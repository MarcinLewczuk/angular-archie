import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/AuthService';
import { WorkoutService } from '../../services/WorkoutService';
import { SnackbarService } from '../../services/SnackbarService';

interface MuscleGroup {
  muscle_group_id: number;
  name: string;
}

interface Exercise {
  exercise_id: number;
  exercise_name: string;
  muscle_group_id: number;
}

@Component({
  selector: 'app-exercise-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './exercise-management.component.html',
  styleUrls: ['./exercise-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseManagementComponent implements OnInit {
  muscleGroups = signal<MuscleGroup[]>([]);
  exercises = signal<Exercise[]>([]);
  isLoading = signal(false);
  
  activeTab: 'muscle-groups' | 'exercises' = 'muscle-groups';
  showNewMuscleGroupForm = false;
  showNewExerciseForm = false;
  editingMuscleGroup: MuscleGroup | null = null;
  editingExercise: Exercise | null = null;
  
  muscleGroupForm: FormGroup;
  exerciseForm: FormGroup;

  constructor(
    public authService: AuthService,
    private workoutService: WorkoutService,
    private snackbarService: SnackbarService,
    private fb: FormBuilder
  ) {
    this.muscleGroupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.exerciseForm = this.fb.group({
      exercise_name: ['', [Validators.required, Validators.minLength(2)]],
      muscle_group_id: ['', Validators.required]
    });
  }

  ngOnInit() {
    const currentUser = this.authService.currentUser;
    
    if (!currentUser || !this.authService.isTrainer()) {
      this.snackbarService.error('You must be logged in as a trainer to access this page');
      return;
    }

    this.loadMuscleGroups();
    this.loadExercises();
  }

  // Muscle Group CRUD
  loadMuscleGroups() {
    this.isLoading.set(true);
    this.workoutService.getMuscleGroups().subscribe({
      next: (groups) => {
        this.muscleGroups.set(groups);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[loadMuscleGroups] Error:', err);
        this.snackbarService.error('Failed to load muscle groups');
        this.isLoading.set(false);
      }
    });
  }

  createMuscleGroup() {
    if (!this.muscleGroupForm.valid) {
      this.snackbarService.error('Please fill in all required fields');
      return;
    }

    const { name } = this.muscleGroupForm.value;
    this.isLoading.set(true);

    this.workoutService.createMuscleGroup(name).subscribe({
      next: (group) => {
        this.muscleGroups.set([...this.muscleGroups(), group]);
        this.snackbarService.success(`Muscle group "${name}" created successfully`);
        this.muscleGroupForm.reset();
        this.showNewMuscleGroupForm = false;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[createMuscleGroup] Error:', err);
        this.snackbarService.error('Failed to create muscle group');
        this.isLoading.set(false);
      }
    });
  }

  updateMuscleGroup() {
    if (!this.editingMuscleGroup || !this.muscleGroupForm.valid) {
      this.snackbarService.error('Please fill in all required fields');
      return;
    }

    const { name } = this.muscleGroupForm.value;
    this.isLoading.set(true);

    this.workoutService.updateMuscleGroup(this.editingMuscleGroup.muscle_group_id, name).subscribe({
      next: (group) => {
        const updatedGroups = this.muscleGroups().map(g =>
          g.muscle_group_id === group.muscle_group_id ? group : g
        );
        this.muscleGroups.set(updatedGroups);
        this.snackbarService.success('Muscle group updated successfully');
        this.muscleGroupForm.reset();
        this.editingMuscleGroup = null;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[updateMuscleGroup] Error:', err);
        this.snackbarService.error('Failed to update muscle group');
        this.isLoading.set(false);
      }
    });
  }

  deleteMuscleGroup(groupId: number) {
    if (!confirm('Are you sure you want to delete this muscle group?')) {
      return;
    }

    this.isLoading.set(true);

    this.workoutService.deleteMuscleGroup(groupId).subscribe({
      next: () => {
        this.muscleGroups.set(this.muscleGroups().filter(g => g.muscle_group_id !== groupId));
        this.snackbarService.success('Muscle group deleted successfully');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[deleteMuscleGroup] Error:', err);
        this.snackbarService.error('Failed to delete muscle group');
        this.isLoading.set(false);
      }
    });
  }

  editMuscleGroup(group: MuscleGroup) {
    this.editingMuscleGroup = group;
    this.muscleGroupForm.patchValue({ name: group.name });
    this.showNewMuscleGroupForm = true;
  }

  cancelEditMuscleGroup() {
    this.editingMuscleGroup = null;
    this.muscleGroupForm.reset();
    this.showNewMuscleGroupForm = false;
  }

  toggleNewMuscleGroupForm() {
    this.showNewMuscleGroupForm = !this.showNewMuscleGroupForm;
    if (!this.showNewMuscleGroupForm) {
      this.editingMuscleGroup = null;
      this.muscleGroupForm.reset();
    }
  }

  loadExercises() {
    this.isLoading.set(true);
    this.workoutService.getExercises().subscribe({
      next: (exercises) => {
        this.exercises.set(exercises);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[loadExercises] Error:', err);
        this.snackbarService.error('Failed to load exercises');
        this.isLoading.set(false);
      }
    });
  }

  createExercise() {
    if (!this.exerciseForm.valid) {
      this.snackbarService.error('Please fill in all required fields');
      return;
    }

    const { exercise_name, muscle_group_id } = this.exerciseForm.value;
    this.isLoading.set(true);

    this.workoutService.createExercise(exercise_name, parseInt(muscle_group_id)).subscribe({
      next: (exercise) => {
        this.exercises.set([...this.exercises(), exercise]);
        this.snackbarService.success(`Exercise "${exercise_name}" created successfully`);
        this.exerciseForm.reset();
        this.showNewExerciseForm = false;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[createExercise] Error:', err);
        this.snackbarService.error('Failed to create exercise');
        this.isLoading.set(false);
      }
    });
  }

  updateExercise() {
    if (!this.editingExercise || !this.exerciseForm.valid) {
      this.snackbarService.error('Please fill in all required fields');
      return;
    }

    const { exercise_name, muscle_group_id } = this.exerciseForm.value;
    this.isLoading.set(true);

    this.workoutService.updateExercise(this.editingExercise.exercise_id, exercise_name, parseInt(muscle_group_id)).subscribe({
      next: (exercise) => {
        const updatedExercises = this.exercises().map(e =>
          e.exercise_id === exercise.exercise_id ? exercise : e
        );
        this.exercises.set(updatedExercises);
        this.snackbarService.success('Exercise updated successfully');
        this.exerciseForm.reset();
        this.editingExercise = null;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[updateExercise] Error:', err);
        this.snackbarService.error('Failed to update exercise');
        this.isLoading.set(false);
      }
    });
  }

  deleteExercise(exerciseId: number) {
    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    this.isLoading.set(true);

    this.workoutService.deleteExercise(exerciseId).subscribe({
      next: () => {
        this.exercises.set(this.exercises().filter(e => e.exercise_id !== exerciseId));
        this.snackbarService.success('Exercise deleted successfully');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[deleteExercise] Error:', err);
        this.snackbarService.error('Failed to delete exercise');
        this.isLoading.set(false);
      }
    });
  }

  editExercise(exercise: Exercise) {
    this.editingExercise = exercise;
    this.exerciseForm.patchValue({
      exercise_name: exercise.exercise_name,
      muscle_group_id: exercise.muscle_group_id
    });
    this.showNewExerciseForm = true;
  }

  cancelEditExercise() {
    this.editingExercise = null;
    this.exerciseForm.reset();
    this.showNewExerciseForm = false;
  }

  toggleNewExerciseForm() {
    this.showNewExerciseForm = !this.showNewExerciseForm;
    if (!this.showNewExerciseForm) {
      this.editingExercise = null;
      this.exerciseForm.reset();
    }
  }

  getMuscleGroupName(muscleGroupId: number): string {
    const group = this.muscleGroups().find(g => g.muscle_group_id === muscleGroupId);
    return group ? group.name : 'Unknown';
  }
}
