import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  trainer_note: string | null;
  exercise_name: string;
  muscle_group_name: string;
}

@Injectable({ providedIn: 'root' })
export class TrainerService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /**
   * Get all clients for a trainer
   */
  getClients(trainerId: number): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/trainers/${trainerId}/clients`);
  }

  /**
   * Assign a client to a trainer
   */
  assignClient(trainerId: number, clientId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}`,
      {}
    );
  }

  /**
   * Remove a client from a trainer
   */
  removeClient(trainerId: number, clientId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}`
    );
  }

  /**
   * Get all workout sessions for a trainer's client
   */
  getClientWorkoutSessions(trainerId: number, clientId: number): Observable<WorkoutSession[]> {
    return this.http.get<WorkoutSession[]>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}/workout-sessions`
    );
  }

  /**
   * Create a workout session for a trainer's client
   */
  createWorkoutSession(
    trainerId: number,
    clientId: number,
    sessionDate: string,
    trainerNote?: string,
    durationTotalMinutes?: number
  ): Observable<WorkoutSession> {
    return this.http.post<WorkoutSession>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}/workout-sessions`,
      {
        session_date: sessionDate,
        trainer_note: trainerNote,
        duration_total_minutes: durationTotalMinutes
      }
    );
  }

  /**
   * Update a workout session (trainer edit)
   */
  updateWorkoutSession(
    trainerId: number,
    clientId: number,
    sessionId: number,
    trainerNote?: string,
    durationTotalMinutes?: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}/workout-sessions/${sessionId}`,
      {
        trainer_note: trainerNote,
        duration_total_minutes: durationTotalMinutes
      }
    );
  }

  /**
   * Create an exercise log for a trainer's client
   */
  createExerciseLog(
    trainerId: number,
    clientId: number,
    sessionId: number,
    exerciseId: number,
    sets?: number,
    reps?: number,
    weightKg?: number,
    durationMinutes?: number,
    trainerNote?: string
  ): Observable<ExerciseLog> {
    return this.http.post<ExerciseLog>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}/workout-sessions/${sessionId}/exercise-logs`,
      {
        exercise_id: exerciseId,
        sets,
        reps,
        weight_kg: weightKg,
        duration_minutes: durationMinutes,
        trainer_note: trainerNote
      }
    );
  }

  /**
   * Update an exercise log (trainer edit)
   */
  updateExerciseLog(
    trainerId: number,
    clientId: number,
    logId: number,
    sets?: number,
    reps?: number,
    weightKg?: number,
    durationMinutes?: number,
    trainerNote?: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}/exercise-logs/${logId}`,
      {
        sets,
        reps,
        weight_kg: weightKg,
        duration_minutes: durationMinutes,
        trainer_note: trainerNote
      }
    );
  }

  /**
   * Delete an exercise log (trainer delete)
   */
  deleteExerciseLog(
    trainerId: number,
    clientId: number,
    logId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/trainers/${trainerId}/clients/${clientId}/exercise-logs/${logId}`
    );
  }
}
