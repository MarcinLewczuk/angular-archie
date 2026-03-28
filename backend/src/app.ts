import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file. Supports both ts-node and compiled execution.
const envPath = path.resolve(process.cwd(), 'backend/private/.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

import express, { Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import { insert, selectAll, selectColumn, loginUser } from './queries';
import { hashPassword, sanitizeUser } from './security/password';

// Initialize Express application with middleware.
const server = express();
server.use(express.json()); // Parse incoming JSON request bodies
server.use(cors()); // Enable Cross-Origin Resource Sharing

/**
 * MySQL database connection pool.
 * Credentials are loaded from environment variables defined in backend/private/.env
 */
const db = mysql.createPool({
  host: process.env['DB_HOST'],
  port: Number(process.env['DB_PORT']),
  user: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Export database connection for use in queries.ts
export { db };

/**
 * Establish database connection and log connection status.
 */
db.getConnection((error, connection) => {
  if (error) {
    console.error('Error connecting to database:', error);
  } else {
    console.log('Connected to database.');
    connection.release();
  }
});

/**
 * Start Express server and listen on the configured port.
 */
server.listen(process.env['PORT'], (error?: Error) => {
  if (error) {
    console.error('Error starting server:', error);
  } else {
    console.log(`Server is running on port ${process.env['PORT']}`);
  }
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /users
 * Retrieves all users from the database.
 */
server.get('/users', (req: Request, res: Response) => {
  selectAll('users')(req, res);
});

/**
 * GET /users/email
 * Retrieves all user email addresses.
 * @deprecated Use username instead
 */
// server.get('/users/email', (req: Request, res: Response) => {
//   selectColumn('users', 'email')(req, res);
// });

/**
 * POST /users
 * Creates a new user account with username and password.
 * - Validates required fields (username, password)
 * - Hashes password using bcrypt
 * - Returns sanitized user object (without password)
 */
server.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    // const username = email.split('@')[0];
    const hashed = await hashPassword(password);

    // Rebuild request body with hashed password
    req.body = { username, password: hashed };
    insert('users', ['username', 'password'])(req, {
      status: (code: number) => ({
        json: (payload: any) => res.status(code).json(sanitizeUser(payload))
      })
    } as Response); // Wrap to intercept response and sanitize
  } catch (e) {
    console.error('User creation failed:', e);
    res.status(500).json({ error: 'internal error' });
  }
});

/**
 * POST /users/login
 * Authenticates a user by username and password.
 * - Verifies credentials against bcrypt-hashed password
 * - Returns sanitized user object (without password) on success
 * - Returns 401 Unauthorized on invalid credentials
 */
server.post('/users/login', loginUser('users'));

// ============================================
// WORKOUT ROUTES
// ============================================

/**
 * GET /users/:userId/workout-sessions
 * Retrieves all workout sessions for a user, optionally filtered by month/year
 */
server.get('/users/:userId/workout-sessions', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const month = req.query.month ? parseInt(req.query.month as string) : null;
  const year = req.query.year ? parseInt(req.query.year as string) : null;

  let query = 'SELECT * FROM workout_sessions WHERE user_id = ?';
  const params: any[] = [userId];

  if (month && year) {
    query += ' AND YEAR(session_date) = ? AND MONTH(session_date) = ? ORDER BY session_date';
    params.push(year, month);
  } else {
    query += ' ORDER BY session_date DESC';
  }

  db.query(query, params, (error: mysql.QueryError | null, results: any[]) => {
    if (error) {
      console.error('Failed to fetch workout sessions:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results || []);
    }
  });
});

/**
 * GET /users/:userId/workout-sessions/:sessionDate
 * Retrieves a workout session for a user on a specific date
 * @param userId User ID
 * @param sessionDate Date in YYYY-MM-DD format
 */
server.get('/users/:userId/workout-sessions/:sessionDate', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const sessionDate = req.params.sessionDate;

  const query = 'SELECT * FROM workout_sessions WHERE user_id = ? AND DATE(session_date) = ?';
  db.query(query, [userId, sessionDate], (error: mysql.QueryError | null, results: any[]) => {
    if (error) {
      console.error('Failed to fetch workout session:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Workout session not found' });
    } else {
      res.json(results[0]);
    }
  });
});

/**
 * GET /workout-sessions/:sessionId/exercise-logs
 * Retrieves all exercise logs for a specific workout session
 * @param sessionId Workout session ID
 */
server.get('/workout-sessions/:sessionId/exercise-logs', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  const query = `
    SELECT el.*, e.exercise_name, mg.name as muscle_group_name
    FROM exercise_logs el
    JOIN exercises e ON el.exercise_id = e.exercise_id
    JOIN muscle_groups mg ON e.muscle_group_id = mg.muscle_group_id
    WHERE el.session_id = ?
    ORDER BY el.log_id
  `;
  
  db.query(query, [sessionId], (error: mysql.QueryError | null, results: any[]) => {
    if (error) {
      console.error('Failed to fetch exercise logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results || []);
    }
  });
});

/**
 * POST /users/:userId/workout-sessions
 * Creates a new workout session for a user
 */
server.post('/users/:userId/workout-sessions', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { session_date, trainer_note, user_note, duration_total_minutes } = req.body;

  if (!session_date) {
    return res.status(400).json({ error: 'session_date is required' });
  }

  // Try to insert with new columns, fall back to old column if table doesn't have them
  let query = 'INSERT INTO workout_sessions (user_id, session_date, trainer_note, user_note, duration_total_minutes) VALUES (?, ?, ?, ?, ?)';
  let values = [userId, session_date, trainer_note || null, user_note || null, duration_total_minutes || null];

  db.query(query, values, (error: mysql.QueryError | null, results: any) => {
    if (error) {
      // If trainer_note doesn't exist, fall back to old schema with 'note' column
      if (error.sqlState === '42S22' && error.message.includes('trainer_note')) {
        const fallbackQuery = 'INSERT INTO workout_sessions (user_id, session_date, note, duration_total_minutes) VALUES (?, ?, ?, ?)';
        const fallbackValues = [userId, session_date, trainer_note || user_note || null, duration_total_minutes || null];
        
        db.query(fallbackQuery, fallbackValues, (fallbackError: mysql.QueryError | null, fallbackResults: any) => {
          if (fallbackError) {
            console.error('Failed to create workout session:', fallbackError);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.status(201).json({ session_id: fallbackResults.insertId, user_id: userId, session_date, trainer_note, user_note, duration_total_minutes });
          }
        });
      } else {
        console.error('Failed to create workout session:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(201).json({ session_id: results.insertId, user_id: userId, session_date, trainer_note, user_note, duration_total_minutes });
    }
  });
});

/**
 * PUT /workout-sessions/:sessionId/user-note
 * Updates the user note for a workout session
 * @param sessionId Workout session ID
 */
server.put('/workout-sessions/:sessionId/user-note', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const { user_note } = req.body;

  const query = 'UPDATE workout_sessions SET user_note = ? WHERE session_id = ?';
  const values = [user_note || null, sessionId];

  db.query(query, values, (error: mysql.QueryError | null, results: any) => {
    if (error) {
      console.error('Failed to update user note:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Workout session not found' });
    } else {
      res.json({ success: true, message: 'User note updated' });
    }
  });
});

/**
 * GET /exercises
 * Retrieves all exercises
 */
server.get('/exercises', (req: Request, res: Response) => {
  db.query('SELECT * FROM exercises ORDER BY exercise_name', (error: mysql.QueryError | null, results: any[]) => {
    if (error) {
      console.error('Failed to fetch exercises:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results || []);
    }
  });
});

/**
 * GET /muscle-groups
 * Retrieves all muscle groups
 */
server.get('/muscle-groups', (req: Request, res: Response) => {
  db.query('SELECT * FROM muscle_groups ORDER BY name', (error: mysql.QueryError | null, results: any[]) => {
    if (error) {
      console.error('Failed to fetch muscle groups:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results || []);
    }
  });
});

/**
 * GET /muscle-groups/:muscleGroupId/exercises
 * Retrieves exercises for a specific muscle group
 */
server.get('/muscle-groups/:muscleGroupId/exercises', (req: Request, res: Response) => {
  const muscleGroupId = req.params.muscleGroupId;
  db.query(
    'SELECT * FROM exercises WHERE muscle_group_id = ? ORDER BY exercise_name',
    [muscleGroupId],
    (error: mysql.QueryError | null, results: any[]) => {
      if (error) {
        console.error('Failed to fetch exercises:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(results || []);
      }
    }
  );
});
/**
 * POST /workout-sessions/:sessionId/exercise-logs
 * Creates a new exercise log for a workout session
 * @param sessionId Workout session ID
 */
server.post('/workout-sessions/:sessionId/exercise-logs', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const { exercise_id, sets, reps, weight_kg, duration_minutes } = req.body;

  if (!exercise_id) {
    return res.status(400).json({ error: 'exercise_id is required' });
  }

  const query = `
    INSERT INTO exercise_logs (session_id, exercise_id, sets, reps, weight_kg, duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [sessionId, exercise_id, sets || null, reps || null, weight_kg || null, duration_minutes || null];

  db.query(query, values, (error: mysql.QueryError | null, results: any) => {
    if (error) {
      console.error('Failed to create exercise log:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(201).json({ log_id: results.insertId, session_id: sessionId, exercise_id, sets, reps, weight_kg, duration_minutes });
    }
  });
});

/**
 * PUT /exercise-logs/:logId
 * Updates an exercise log
 * @param logId Exercise log ID
 */
server.put('/exercise-logs/:logId', (req: Request, res: Response) => {
  const logId = req.params.logId;
  const { sets, reps, weight_kg, duration_minutes } = req.body;

  const query = `
    UPDATE exercise_logs
    SET sets = COALESCE(?, sets),
        reps = COALESCE(?, reps),
        weight_kg = COALESCE(?, weight_kg),
        duration_minutes = COALESCE(?, duration_minutes)
    WHERE log_id = ?
  `;
  const values = [sets, reps, weight_kg, duration_minutes, logId];

  db.query(query, values, (error: mysql.QueryError | null, results: any) => {
    if (error) {
      console.error('Failed to update exercise log:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Exercise log not found' });
    } else {
      res.json({ success: true, message: 'Exercise log updated' });
    }
  });
});

/**
 * DELETE /exercise-logs/:logId
 * Deletes an exercise log
 * @param logId Exercise log ID
 */
server.delete('/exercise-logs/:logId', (req: Request, res: Response) => {
  const logId = req.params.logId;

  db.query('DELETE FROM exercise_logs WHERE log_id = ?', [logId], (error: mysql.QueryError | null, results: any) => {
    if (error) {
      console.error('Failed to delete exercise log:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else if (results.affectedRows === 0) {
      res.status(404).json({ error: 'Exercise log not found' });
    } else {
      res.json({ success: true, message: 'Exercise log deleted' });
    }
  });
});