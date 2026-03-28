import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { WorkoutService } from '../../services/WorkoutService';

interface WorkoutDay {
  date: Date;
  day: number;
  month: number;
  hasWorkout: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  muscleGroups: string[];
}

@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workouts.component.html',
  styleUrls: ['./workouts.component.css']
})
export class WorkoutsComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  private workout = inject(WorkoutService);
  
  currentDate = new Date();
  currentMonth = signal(this.currentDate.getMonth());
  currentYear = signal(this.currentDate.getFullYear());
  
  weeks = signal<WorkoutDay[][]>([]);
  private hasLoadedWorkouts = false;
  
  monthName = computed(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.currentMonth()];
  });

  ngOnInit(): void {
    this.generateCalendar();
    this.loadWorkoutData();
    
    // Retry loading after a short delay in case auth wasn't ready
    setTimeout(() => {
      if (this.auth.isAuthenticated() && !this.hasLoadedWorkouts) {
        this.loadWorkoutData();
      }
    }, 500);
  }

  generateCalendar(): void {
    const newWeeks: WorkoutDay[][] = [];
    
    const currentMonth = this.currentMonth();
    const currentYear = this.currentYear();
    
    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get days from previous month to fill the first week
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    let day = 1;
    let week: WorkoutDay[] = [];
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      week.push({
        date,
        day: prevMonthLastDay - i,
        month: currentMonth - 1,
        hasWorkout: false,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        muscleGroups: []
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      week.push({
        date,
        day: i,
        month: currentMonth,
        hasWorkout: false,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        muscleGroups: []
      });
      
      if (week.length === 7) {
        newWeeks.push(week);
        week = [];
      }
    }
    
    // Add next month's days
    let nextDay = 1;
    while (week.length > 0 && week.length < 7) {
      const date = new Date(currentYear, currentMonth + 1, nextDay);
      week.push({
        date,
        day: nextDay,
        month: currentMonth + 1,
        hasWorkout: false,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        muscleGroups: []
      });
      nextDay++;
    }
    
    if (week.length > 0) {
      newWeeks.push(week);
    }
    
    this.weeks.set(newWeeks);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousMonth(): void {    this.currentMonth.update(m => m === 0 ? 11 : m - 1);
    if (this.currentMonth() === 11) {
      this.currentYear.update(y => y - 1);
    }
    this.generateCalendar();
    this.loadWorkoutData();
  }

  nextMonth(): void {
    this.currentMonth.update(m => m === 11 ? 0 : m + 1);
    if (this.currentMonth() === 0) {
      this.currentYear.update(y => y + 1);
    }
    this.generateCalendar();
    this.loadWorkoutData();
  }

  selectDay(workoutDay: WorkoutDay): void {
    if (!workoutDay.isCurrentMonth) return;
    
    const dateString = this.formatDateForQuery(workoutDay.date);
    this.router.navigate(['/workouts/detail'], { queryParams: { date: dateString } });
  }

  private formatDateForQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadWorkoutData(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    
    const userId = this.auth.currentUser?.user_id;
    if (!userId) {
      return;
    }
    
    this.hasLoadedWorkouts = true;

    
    // Fetch all workout sessions for the current month
    this.workout.getWorkoutSessions(userId, this.currentMonth(), this.currentYear()).subscribe({
      next: (sessions) => {
        // Build a map of exercise logs by session_id
        const sessionsWithExercises = sessions.filter(s => s.session_id);
        
        // Fetch exercise logs for each session
        sessionsWithExercises.forEach(session => {
          this.workout.getExerciseLogs(session.session_id).subscribe({
            next: (logs) => {
              // Extract unique muscle groups from logs
              const muscleGroupsSet = new Set<string>();
              logs.forEach(log => {
                if (log.muscle_group_name) {
                  muscleGroupsSet.add(log.muscle_group_name);
                }
              });
              
              const muscleGroupArray = Array.from(muscleGroupsSet);
              
              // Find and update the corresponding day in the calendar
              const sessionDate = new Date(session.session_date);
              
              const updatedWeeks = this.weeks().map(week => 
                week.map(day => {
                  if (this.isSameDay(day.date, sessionDate)) {
                    return {
                      ...day,
                      hasWorkout: true,
                      muscleGroups: muscleGroupArray
                    };
                  }
                  return day;
                })
              );
              
              this.weeks.set(updatedWeeks);
            },
            error: (err) => console.error('Error loading exercise logs:', err)
          });
        });
      },
      error: (err) => console.error('Error loading workout sessions:', err)
    });
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
}
