import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutService, WorkoutSession, ExerciseLog, Exercise } from '../../../services/WorkoutService';
import { AuthService } from '../../../services/AuthService';
import { SnackbarService } from '../../../services/SnackbarService';

@Component({
  selector: 'app-workout-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout-detail.component.html',
  styleUrls: ['./workout-detail.component.css']
})
export class WorkoutDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  workoutService = inject(WorkoutService);
  auth = inject(AuthService);
  snackbar = inject(SnackbarService);

  session = signal<WorkoutSession | null>(null);
  exerciseLogs = signal<ExerciseLog[]>([]);
  userNoteText = signal<string>('');
  isLoadingSession = signal(true);
  isLoadingExercises = signal(true);
  isSavingNote = signal(false);
  isLoggingExercise = signal(false);
  showExerciseForm = signal(false);
  allExercises = signal<Exercise[]>([]);
  selectedExerciseId = signal<number | null>(null);
  exerciseSets = signal('');
  exerciseReps = signal('');
  exerciseWeight = signal('');
  exerciseDuration = signal('');

  ngOnInit(): void {
    this.loadWorkoutSession();
    this.loadAllExercises();
  }

  loadAllExercises(): void {
    this.workoutService.getExercises().subscribe({
      next: (exercises) => {
        this.allExercises.set(exercises);
      },
      error: (err) => {
        console.error('Error loading exercises:', err);
      }
    });
  }

  loadWorkoutSession(): void {
    this.route.queryParams.subscribe((params) => {
      const sessionDate = params['date'];
      const userId = this.auth.currentUser?.user_id;

      if (!sessionDate || !userId) {
        this.snackbar.error('Invalid workout session');
        this.router.navigate(['/workouts']);
        return;
      }

      this.workoutService.getWorkoutSessionByDate(userId, sessionDate).subscribe({
        next: (session) => {
          this.session.set(session);
          this.userNoteText.set(session.user_note || '');
          this.isLoadingSession.set(false);
          this.loadExerciseLogs(session.session_id);
        },
        error: () => {
          // Session doesn't exist yet, create one
          this.session.set({
            session_id: 0,
            user_id: userId,
            session_date: sessionDate,
            trainer_note: '',
            user_note: ''
          });
          this.isLoadingSession.set(false);
        }
      });
    });
  }

  loadExerciseLogs(sessionId: number): void {
    this.workoutService.getExerciseLogs(sessionId).subscribe({
      next: (logs) => {
        this.exerciseLogs.set(logs);
        this.isLoadingExercises.set(false);
      },
      error: () => {
        this.exerciseLogs.set([]);
        this.isLoadingExercises.set(false);
      }
    });
  }

  saveUserNote(): void {
    const currentSession = this.session();
    if (!currentSession) return;

    this.isSavingNote.set(true);

    const updateData: Partial<WorkoutSession> = {
      user_note: this.userNoteText()
    };

    if (currentSession.session_id === 0) {
      // Create new session with note
      this.workoutService.createWorkoutSession(
        currentSession.user_id,
        currentSession.session_date,
        currentSession.trainer_note,
        this.userNoteText()
      ).subscribe({
        next: (newSession) => {
          this.session.set(newSession);
          this.isSavingNote.set(false);
          this.snackbar.success('Note saved successfully!');
        },
        error: () => {
          this.isSavingNote.set(false);
          this.snackbar.error('Failed to save note');
        }
      });
    } else {
      // Update existing session
      this.workoutService.updateWorkoutSession(currentSession.session_id, updateData).subscribe({
        next: (updated) => {
          this.session.set(updated);
          this.isSavingNote.set(false);
          this.snackbar.success('Note saved successfully!');
        },
        error: () => {
          this.isSavingNote.set(false);
          this.snackbar.error('Failed to save note');
        }
      });
    }
  }

  toggleExerciseForm(): void {
    this.showExerciseForm.set(!this.showExerciseForm());
    if (!this.showExerciseForm()) {
      this.resetExerciseForm();
    }
  }

  resetExerciseForm(): void {
    this.selectedExerciseId.set(null);
    this.exerciseSets.set('');
    this.exerciseReps.set('');
    this.exerciseWeight.set('');
    this.exerciseDuration.set('');
  }

  logExercise(): void {
    const currentSession = this.session();
    const exerciseId = this.selectedExerciseId();

    if (!currentSession || !exerciseId) {
      this.snackbar.error('Please select an exercise');
      return;
    }

    // Ensure session has an ID
    if (currentSession.session_id === 0) {
      // Create session first if it doesn't exist
      this.workoutService.createWorkoutSession(
        currentSession.user_id,
        currentSession.session_date
      ).subscribe({
        next: (newSession) => {
          this.session.set(newSession);
          this.saveExerciseLog(newSession.session_id, exerciseId);
        },
        error: () => {
          this.snackbar.error('Failed to create workout session');
        }
      });
    } else {
      this.saveExerciseLog(currentSession.session_id, exerciseId);
    }
  }

  private saveExerciseLog(sessionId: number, exerciseId: number): void {
    this.isLoggingExercise.set(true);

    const exerciseLogData = {
      exercise_id: exerciseId,
      sets: this.exerciseSets() ? parseInt(this.exerciseSets()) : undefined,
      reps: this.exerciseReps() ? parseInt(this.exerciseReps()) : undefined,
      weight_kg: this.exerciseWeight() ? parseFloat(this.exerciseWeight()) : undefined,
      duration_minutes: this.exerciseDuration() ? parseInt(this.exerciseDuration()) : undefined
    };

    this.workoutService.addExerciseLog(sessionId, exerciseLogData).subscribe({
      next: () => {
        this.resetExerciseForm();
        this.showExerciseForm.set(false);
        this.isLoggingExercise.set(false);
        this.snackbar.success('Exercise logged successfully!');
        // Reload exercise logs
        this.loadExerciseLogs(sessionId);
      },
      error: () => {
        this.isLoggingExercise.set(false);
        this.snackbar.error('Failed to log exercise');
      }
    });
  }

  updateExerciseLog(log: ExerciseLog, field: string, value: any): void {
    const updates: any = {};
    
    // Convert value to appropriate type
    if (field === 'sets' || field === 'reps' || field === 'duration_minutes') {
      updates[field] = value ? parseInt(value) : undefined;
    } else if (field === 'weight_kg') {
      updates[field] = value ? parseFloat(value) : undefined;
    }

    this.workoutService.updateExerciseLog(log.log_id, updates).subscribe({
      next: () => {
        this.snackbar.success('Exercise updated!');
        // Update local state
        const updated = { ...log, ...updates };
        const logs = this.exerciseLogs();
        const index = logs.findIndex(l => l.log_id === log.log_id);
        if (index !== -1) {
          logs[index] = updated;
          this.exerciseLogs.set([...logs]);
        }
      },
      error: () => {
        this.snackbar.error('Failed to update exercise');
      }
    });
  }

  deleteExerciseLog(logId: number): void {
    if (!confirm('Are you sure you want to delete this exercise log?')) return;

    this.workoutService.deleteExerciseLog(logId).subscribe({
      next: () => {
        this.snackbar.success('Exercise deleted!');
        this.exerciseLogs.set(this.exerciseLogs().filter(l => l.log_id !== logId));
      },
      error: () => {
        this.snackbar.error('Failed to delete exercise');
      }
    });
  }

  onExerciseSelected(value: any): void {
    this.selectedExerciseId.set(value ? Number(value) : null);
  }

  onExerciseFieldChange(event: any, log: ExerciseLog, field: string): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateExerciseLog(log, field, value);
  }

  close(): void {
    this.router.navigate(['/workouts']);
  }
}
