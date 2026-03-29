import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/AuthService';
import { TrainerService } from '../../services/TrainerService';
import { WorkoutService } from '../../services/WorkoutService';
import { SnackbarService } from '../../services/SnackbarService';

interface Client {
  user_id: number;
  username: string;
  role: string;
}

interface WorkoutSession {
  session_id: number;
  user_id: number;
  session_date: string;
  trainer_note: string | null;
  duration_total_minutes: number | null;
}

interface ExerciseLog {
  log_id: number;
  session_id: number;
  exercise_id: number;
  sets?: number | null;
  reps?: number | null;
  weight_kg?: number | null;
  duration_minutes?: number | null;
  trainer_note?: string | null;
  exercise_name: string;
  muscle_group_name: string;
}

@Component({
  selector: 'app-trainer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './trainer-dashboard.component.html',
  styleUrls: ['./trainer-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainerDashboardComponent implements OnInit {
  clients = signal<Client[]>([]);
  selectedClient: Client | null = null;
  workoutSessions = signal<WorkoutSession[]>([]);
  selectedSession: WorkoutSession | null = null;
  exerciseLogs = signal<ExerciseLog[]>([]);
  exercises = signal<any[]>([]);
  muscleGroups = signal<any[]>([]);
  
  showNewSessionForm = false;
  showNewExerciseForm = false;
  showEditExerciseForm = false;
  editingLog: ExerciseLog | null = null;
  
  newSessionForm: FormGroup;
  newExerciseForm: FormGroup;
  editExerciseForm: FormGroup;
  
  isLoading = signal(false);
  selectedMuscleGroup = '';
  filteredExercises = signal<any[]>([]);

  constructor(
    public authService: AuthService,
    private trainerService: TrainerService,
    private workoutService: WorkoutService,
    private snackbarService: SnackbarService,
    private fb: FormBuilder
  ) {
    this.newSessionForm = this.fb.group({
      session_date: ['', Validators.required],
      trainer_note: [''],
      duration_total_minutes: ['']
    });

    this.newExerciseForm = this.fb.group({
      exercise_id: ['', Validators.required],
      sets: [''],
      reps: [''],
      weight_kg: [''],
      duration_minutes: [''],
      trainer_note: ['']
    });

    this.editExerciseForm = this.fb.group({
      sets: [''],
      reps: [''],
      weight_kg: [''],
      duration_minutes: [''],
      trainer_note: ['']
    });
  }

  ngOnInit() {
    const currentUser = this.authService.currentUser;
    
    if (!currentUser || !this.authService.isTrainer()) {
      this.snackbarService.error('You must be logged in as a trainer to access this page');
      return;
    }

    this.loadClients();
    this.loadExercises();
    this.loadMuscleGroups();
  }

  loadClients() {
    const currentUser = this.authService.currentUser;
    console.log('[loadClients] Starting load for trainer:', currentUser?.user_id);
    if (!currentUser) {
      console.error('[loadClients] No current user');
      return;
    }

    this.isLoading.set(true);
    console.log('[loadClients] isLoading set to true');
    this.trainerService.getClients(currentUser.user_id).subscribe({
      next: (clients) => {
        console.log('[loadClients] Received clients:', clients);
        this.clients.set(clients);
        setTimeout(() => {
          this.isLoading.set(false);
          console.log('[loadClients] isLoading set to false');
        }, 0);
      },
      error: (err) => {
        console.error('[loadClients] Error loading clients:', err);
        this.snackbarService.error('Failed to load clients');
        setTimeout(() => {
          this.isLoading.set(false);
        }, 0);
      }
    });
  }

  loadExercises() {
    console.log('[loadExercises] Starting load');
    this.workoutService.getExercises().subscribe({
      next: (exercises) => {
        console.log('[loadExercises] Received', exercises.length, 'exercises');
        this.exercises.set(exercises);
        this.filteredExercises.set(exercises);
      },
      error: (err) => {
        console.error('[loadExercises] Error:', err);
      }
    });
  }

  loadMuscleGroups() {
    console.log('[loadMuscleGroups] Starting load');
    this.workoutService.getMuscleGroups().subscribe({
      next: (groups) => {
        console.log('[loadMuscleGroups] Received', groups.length, 'muscle groups:', groups);
        this.muscleGroups.set(groups);
      },
      error: (err) => {
        console.error('[loadMuscleGroups] Error:', err);
      }
    });
  }

  filterExercisesByMuscleGroup(event: Event) {
    const muscleGroupId = (event.target as HTMLSelectElement).value;
    this.selectedMuscleGroup = muscleGroupId;
    const exercisesList = this.exercises();
    if (!muscleGroupId) {
      this.filteredExercises.set(exercisesList);
    } else {
      this.filteredExercises.set(
        exercisesList.filter(
          ex => ex.muscle_group_id === parseInt(muscleGroupId)
        )
      );
    }
  }

  selectClient(client: Client) {
    this.selectedClient = client;
    this.selectedSession = null;
    this.exerciseLogs.set([]);
    this.loadClientWorkouts(client.user_id);
  }

  loadClientWorkouts(clientId: number) {
    const trainer = this.authService.currentUser;
    if (!trainer) return;

    this.isLoading.set(true);
    this.trainerService.getClientWorkoutSessions(trainer.user_id, clientId).subscribe({
      next: (sessions) => {
        this.workoutSessions.set(sessions);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load workout sessions:', err);
        this.snackbarService.error('Failed to load workout sessions');
        this.isLoading.set(false);
      }
    });
  }

  selectSession(session: WorkoutSession) {
    this.selectedSession = session;
    this.exerciseLogs.set([]);
    this.loadSessionExerciseLogs(session.session_id);
  }

  loadSessionExerciseLogs(sessionId: number) {
    // Load exercise logs for the selected session
    this.workoutService.getExerciseLogs(sessionId).subscribe({
      next: (logs: any[]) => {
        this.exerciseLogs.set(logs);
      },
      error: (err) => {
        console.error('Failed to load exercise logs:', err);
        this.exerciseLogs.set([]);
      }
    });
  }

  createNewSession() {
    if (!this.selectedClient || !this.newSessionForm.valid) {
      this.snackbarService.error('Please fill in all required fields');
      return;
    }

    const trainer = this.authService.currentUser;
    if (!trainer) return;

    const { session_date, trainer_note, duration_total_minutes } = this.newSessionForm.value;
    this.trainerService
      .createWorkoutSession(trainer.user_id, this.selectedClient.user_id, session_date, trainer_note, duration_total_minutes)
      .subscribe({
        next: () => {
          this.snackbarService.success('Workout session created successfully');
          this.newSessionForm.reset();
          this.showNewSessionForm = false;
          this.loadClientWorkouts(this.selectedClient!.user_id);
        },
        error: (err) => {
          console.error('Failed to create session:', err);
          this.snackbarService.error('Failed to create session');
        }
      });
  }

  updateSession() {
    if (!this.selectedClient || !this.selectedSession) return;

    const trainer = this.authService.currentUser;
    if (!trainer) return;

    this.trainerService
      .updateWorkoutSession(
        trainer.user_id,
        this.selectedClient.user_id,
        this.selectedSession.session_id,
        this.selectedSession.trainer_note || undefined,
        this.selectedSession.duration_total_minutes || undefined
      )
      .subscribe({
        next: () => {
          this.snackbarService.success('Workout session updated successfully');
          this.loadClientWorkouts(this.selectedClient!.user_id);
        },
        error: (err) => {
          console.error('Failed to update session:', err);
          this.snackbarService.error('Failed to update session');
        }
      });
  }

  addExerciseToSession() {
    if (!this.selectedClient || !this.selectedSession || !this.newExerciseForm.valid) {
      this.snackbarService.error('Please select an exercise');
      return;
    }

    const trainer = this.authService.currentUser;
    if (!trainer) return;

    const { exercise_id, sets, reps, weight_kg, duration_minutes, trainer_note } = this.newExerciseForm.value;
    this.trainerService
      .createExerciseLog(
        trainer.user_id,
        this.selectedClient.user_id,
        this.selectedSession.session_id,
        exercise_id,
        sets,
        reps,
        weight_kg,
        duration_minutes,
        trainer_note
      )
      .subscribe({
        next: () => {
          this.snackbarService.success('Exercise added successfully');
          this.newExerciseForm.reset();
          this.showNewExerciseForm = false;
          // Reload exercise logs
          this.loadSessionExerciseLogs(this.selectedSession!.session_id);
        },
        error: (err) => {
          console.error('Failed to add exercise:', err);
          this.snackbarService.error('Failed to add exercise');
        }
      });
  }

  editExercise(log: ExerciseLog) {
    this.editingLog = log;
    this.editExerciseForm.patchValue({
      sets: log.sets,
      reps: log.reps,
      weight_kg: log.weight_kg,
      duration_minutes: log.duration_minutes,
      trainer_note: log.trainer_note
    });
    this.showEditExerciseForm = true;
  }

  updateExercise() {
    if (!this.selectedClient || !this.editingLog) return;

    const trainer = this.authService.currentUser;
    if (!trainer) return;

    const { sets, reps, weight_kg, duration_minutes, trainer_note } = this.editExerciseForm.value;
    this.trainerService
      .updateExerciseLog(trainer.user_id, this.selectedClient.user_id, this.editingLog.log_id, sets, reps, weight_kg, duration_minutes, trainer_note)
      .subscribe({
        next: () => {
          this.snackbarService.success('Exercise updated successfully');
          this.showEditExerciseForm = false;
          this.editingLog = null;
          this.editExerciseForm.reset();
          // Reload exercise logs
          this.loadSessionExerciseLogs(this.selectedSession!.session_id);
        },
        error: (err) => {
          console.error('Failed to update exercise:', err);
          this.snackbarService.error('Failed to update exercise');
        }
      });
  }

  deleteExercise(log: ExerciseLog) {
    if (!confirm('Are you sure you want to delete this exercise?')) return;

    if (!this.selectedClient) return;

    const trainer = this.authService.currentUser;
    if (!trainer) return;

    this.trainerService.deleteExerciseLog(trainer.user_id, this.selectedClient.user_id, log.log_id).subscribe({
      next: () => {
        this.snackbarService.success('Exercise deleted successfully');
        // Reload exercise logs
        this.loadSessionExerciseLogs(this.selectedSession!.session_id);
      },
      error: (err) => {
        console.error('Failed to delete exercise:', err);
        this.snackbarService.error('Failed to delete exercise');
      }
    });
  }

  toggleNewSessionForm() {
    this.showNewSessionForm = !this.showNewSessionForm;
    if (!this.showNewSessionForm) {
      this.newSessionForm.reset();
    }
  }

  toggleNewExerciseForm() {
    this.showNewExerciseForm = !this.showNewExerciseForm;
    if (!this.showNewExerciseForm) {
      this.newExerciseForm.reset();
    }
  }

  cancelEditExercise() {
    this.showEditExerciseForm = false;
    this.editingLog = null;
    this.editExerciseForm.reset();
  }
}
