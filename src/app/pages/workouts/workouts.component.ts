import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/AuthService';

interface WorkoutDay {
  date: Date;
  day: number;
  month: number;
  hasWorkout: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
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
  
  currentDate = new Date();
  currentMonth = signal(this.currentDate.getMonth());
  currentYear = signal(this.currentDate.getFullYear());
  
  weeks: WorkoutDay[][] = [];
  
  monthName = computed(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.currentMonth()];
  });

  ngOnInit(): void {
    this.generateCalendar();
  }

  generateCalendar(): void {
    this.weeks = [];
    
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
        isToday: this.isToday(date)
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
        isToday: this.isToday(date)
      });
      
      if (week.length === 7) {
        this.weeks.push(week);
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
        isToday: this.isToday(date)
      });
      nextDay++;
    }
    
    if (week.length > 0) {
      this.weeks.push(week);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousMonth(): void {
    let month = this.currentMonth();
    let year = this.currentYear();
    
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
    
    this.currentMonth.set(month);
    this.currentYear.set(year);
    this.generateCalendar();
  }

  nextMonth(): void {
    let month = this.currentMonth();
    let year = this.currentYear();
    
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
    
    this.currentMonth.set(month);
    this.currentYear.set(year);
    this.generateCalendar();
  }

  selectDay(workoutDay: WorkoutDay): void {
    // TODO: Implement detail view when needed
    console.log('Selected day:', workoutDay.date);
  }
}
