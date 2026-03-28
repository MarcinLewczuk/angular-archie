import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkoutSession {
	session_id: number;
	user_id: number;
	session_date: string;
	trainer_note?: string;
	user_note?: string;
	duration_total_minutes?: number;
}

export interface Exercise {
	exercise_id: number;
	exercise_name: string;
	muscle_group_id: number;
}

export interface ExerciseLog {
	log_id: number;
	session_id: number;
	exercise_id: number;
	sets?: number;
	reps?: number;
	weight_kg?: number;
	duration_minutes?: number;
	exercise_name?: string;
	muscle_group_name?: string;
	trainer_note?: string;
	created_by?: 'trainer' | 'user';
}

@Injectable({ providedIn: 'root' })
export class WorkoutService {
	private http = inject(HttpClient);
	private baseUrl = 'http://localhost:3000';

	// Get all workout sessions for a user (optional month filter)
	getWorkoutSessions(userId: number, month?: number, year?: number): Observable<WorkoutSession[]> {
		let url = `${this.baseUrl}/users/${userId}/workout-sessions`;
		if (month !== undefined && year !== undefined) {
			url += `?month=${month + 1}&year=${year}`;
		}
		return this.http.get<WorkoutSession[]>(url);
	}

	// Get specific workout session with exercise logs
	getWorkoutSession(sessionId: number): Observable<any> {
		return this.http.get(`${this.baseUrl}/workout-sessions/${sessionId}`);
	}

	// Create new workout session
	createWorkoutSession(userId: number, sessionDate: string, trainerNote?: string, userNote?: string): Observable<WorkoutSession> {
		return this.http.post<WorkoutSession>(`${this.baseUrl}/users/${userId}/workout-sessions`, {
			session_date: sessionDate,
			trainer_note: trainerNote,
			user_note: userNote
		});
	}

	// Update workout session
	updateWorkoutSession(sessionId: number, data: Partial<WorkoutSession>): Observable<WorkoutSession> {
		return this.http.put<WorkoutSession>(`${this.baseUrl}/workout-sessions/${sessionId}`, data);
	}

	// Delete workout session
	deleteWorkoutSession(sessionId: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/workout-sessions/${sessionId}`);
	}

	// Get all exercises
	getExercises(): Observable<Exercise[]> {
		return this.http.get<Exercise[]>(`${this.baseUrl}/exercises`);
	}

	// Get exercises by muscle group
	getExercisesByMuscleGroup(muscleGroupId: number): Observable<Exercise[]> {
		return this.http.get<Exercise[]>(`${this.baseUrl}/muscle-groups/${muscleGroupId}/exercises`);
	}

	// Add exercise log to workout session
	addExerciseLog(sessionId: number, exerciseLog: Omit<ExerciseLog, 'log_id' | 'session_id'>): Observable<ExerciseLog> {
		return this.http.post<ExerciseLog>(`${this.baseUrl}/workout-sessions/${sessionId}/exercise-logs`, exerciseLog);
	}

	// Update exercise log
	updateExerciseLog(logId: number, data: Partial<ExerciseLog>): Observable<ExerciseLog> {
		return this.http.put<ExerciseLog>(`${this.baseUrl}/exercise-logs/${logId}`, data);
	}

	// Delete exercise log
	deleteExerciseLog(logId: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/exercise-logs/${logId}`);
	}

	// Get workout session by user and date
	getWorkoutSessionByDate(userId: number, sessionDate: string): Observable<WorkoutSession> {
		return this.http.get<WorkoutSession>(`${this.baseUrl}/users/${userId}/workout-sessions/${sessionDate}`);
	}

	// Get all exercise logs for a session
	getExerciseLogs(sessionId: number): Observable<ExerciseLog[]> {
		return this.http.get<ExerciseLog[]>(`${this.baseUrl}/workout-sessions/${sessionId}/exercise-logs`);
	}

	// Save user note for a workout session
	saveUserNote(sessionId: number, userNote: string): Observable<any> {
		return this.http.put(`${this.baseUrl}/workout-sessions/${sessionId}/user-note`, {
			user_note: userNote
		});
	}
}
