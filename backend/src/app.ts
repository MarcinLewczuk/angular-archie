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
 * Creates a new user account with username, password, and role.
 * - Validates required fields (username, password)
 * - Hashes password using bcrypt
 * - Sets role as 'trainer' or 'client' (defaults to 'client')
 * - Returns sanitized user object (without password)
 */
server.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    // const username = email.split('@')[0];
    const hashed = await hashPassword(password);
    const userRole = (role === 'trainer') ? 'trainer' : 'client';

    // Rebuild request body with hashed password
    req.body = { username, password: hashed, role: userRole };
    insert('users', ['username', 'password', 'role'])(req, {
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

// ============================================
// TRAINER ROUTES
// ============================================

/**
 * GET /trainers/:trainerId/clients
 * Retrieves all clients assigned to a trainer
 */
server.get('/trainers/:trainerId/clients', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;

  const query = 'SELECT user_id, username, role FROM users WHERE trainer_id = ? AND role = ?';
  db.query(query, [trainerId, 'client'], (error: mysql.QueryError | null, results: any[]) => {
    if (error) {
      console.error('Failed to fetch trainer clients:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results || []);
    }
  });
});

/**
 * POST /trainers/:trainerId/clients/:clientId
 * Assigns a client to a trainer
 */
server.post('/trainers/:trainerId/clients/:clientId', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;

  // Verify trainer exists and is a trainer
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND role = ?',
    [trainerId, 'trainer'],
    (error: mysql.QueryError | null, results: any[]) => {
      if (error || results.length === 0) {
        return res.status(403).json({ error: 'Trainer not found or unauthorized' });
      }

      // Update client's trainer_id
      const query = 'UPDATE users SET trainer_id = ? WHERE user_id = ? AND role = ?';
      db.query(query, [trainerId, clientId, 'client'], (error: mysql.QueryError | null, results: any) => {
        if (error) {
          console.error('Failed to assign client:', error);
          res.status(500).json({ error: 'Internal server error' });
        } else if (results.affectedRows === 0) {
          res.status(404).json({ error: 'Client not found' });
        } else {
          res.json({ success: true, message: 'Client assigned to trainer' });
        }
      });
    }
  );
});

/**
 * DELETE /trainers/:trainerId/clients/:clientId
 * Removes a client from a trainer
 */
server.delete('/trainers/:trainerId/clients/:clientId', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;

  // Verify trainer exists and owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, results: any[]) => {
      if (error || results.length === 0) {
        return res.status(404).json({ error: 'Client not found for this trainer' });
      }

      // Remove trainer assignment
      const query = 'UPDATE users SET trainer_id = NULL WHERE user_id = ?';
      db.query(query, [clientId], (error: mysql.QueryError | null, results: any) => {
        if (error) {
          console.error('Failed to remove client:', error);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ success: true, message: 'Client removed from trainer' });
        }
      });
    }
  );
});

/**
 * GET /trainers/:trainerId/clients/:clientId/workout-sessions
 * Retrieves all workout sessions for a trainer's client
 */
server.get('/trainers/:trainerId/clients/:clientId/workout-sessions', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;

  // Verify trainer owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, verifyResults: any[]) => {
      if (error || verifyResults.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get workout sessions for the client
      const query = 'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY session_date DESC';
      db.query(query, [clientId], (error: mysql.QueryError | null, results: any[]) => {
        if (error) {
          console.error('Failed to fetch workout sessions:', error);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(results || []);
        }
      });
    }
  );
});

/**
 * POST /trainers/:trainerId/clients/:clientId/workout-sessions
 * Creates a new workout session for a trainer's client
 */
server.post('/trainers/:trainerId/clients/:clientId/workout-sessions', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;
  const { session_date, trainer_note, duration_total_minutes } = req.body;

  if (!session_date) {
    return res.status(400).json({ error: 'session_date is required' });
  }

  // Verify trainer owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, verifyResults: any[]) => {
      if (error || verifyResults.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Create workout session
      const query = 'INSERT INTO workout_sessions (user_id, session_date, trainer_note, duration_total_minutes) VALUES (?, ?, ?, ?)';
      const values = [clientId, session_date, trainer_note || null, duration_total_minutes || null];

      db.query(query, values, (error: mysql.QueryError | null, results: any) => {
        if (error) {
          console.error('Failed to create workout session:', error);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.status(201).json({ session_id: results.insertId, user_id: clientId, session_date, trainer_note, duration_total_minutes });
        }
      });
    }
  );
});

/**
 * PUT /trainers/:trainerId/clients/:clientId/workout-sessions/:sessionId
 * Updates a workout session (trainer edit)
 */
server.put('/trainers/:trainerId/clients/:clientId/workout-sessions/:sessionId', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;
  const sessionId = req.params.sessionId;
  const { trainer_note, duration_total_minutes } = req.body;

  // Verify trainer owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, verifyResults: any[]) => {
      if (error || verifyResults.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update workout session
      const query = 'UPDATE workout_sessions SET trainer_note = ?, duration_total_minutes = ? WHERE session_id = ? AND user_id = ?';
      db.query(query, [trainer_note, duration_total_minutes, sessionId, clientId], (error: mysql.QueryError | null, results: any) => {
        if (error) {
          console.error('Failed to update workout session:', error);
          res.status(500).json({ error: 'Internal server error' });
        } else if (results.affectedRows === 0) {
          res.status(404).json({ error: 'Workout session not found' });
        } else {
          res.json({ success: true, message: 'Workout session updated' });
        }
      });
    }
  );
});

/**
 * POST /trainers/:trainerId/clients/:clientId/workout-sessions/:sessionId/exercise-logs
 * Creates a new exercise log for a client's workout (trainer edit)
 */
server.post('/trainers/:trainerId/clients/:clientId/workout-sessions/:sessionId/exercise-logs', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;
  const sessionId = req.params.sessionId;
  const { exercise_id, sets, reps, weight_kg, duration_minutes, trainer_note } = req.body;

  if (!exercise_id) {
    return res.status(400).json({ error: 'exercise_id is required' });
  }

  // Verify trainer owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, verifyResults: any[]) => {
      if (error || verifyResults.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Create exercise log
      const query = `
        INSERT INTO exercise_logs (session_id, exercise_id, sets, reps, weight_kg, duration_minutes, trainer_note, created_by, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [sessionId, exercise_id, sets || null, reps || null, weight_kg || null, duration_minutes || null, trainer_note || null, 'trainer', trainerId];

      db.query(query, values, (error: mysql.QueryError | null, results: any) => {
        if (error) {
          console.error('Failed to create exercise log:', error);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.status(201).json({ log_id: results.insertId, session_id: sessionId, exercise_id, sets, reps, weight_kg, duration_minutes });
        }
      });
    }
  );
});

/**
 * PUT /trainers/:trainerId/clients/:clientId/exercise-logs/:logId
 * Updates an exercise log (trainer edit)
 */
server.put('/trainers/:trainerId/clients/:clientId/exercise-logs/:logId', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;
  const logId = req.params.logId;
  const { sets, reps, weight_kg, duration_minutes, trainer_note } = req.body;

  // Verify trainer owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, verifyResults: any[]) => {
      if (error || verifyResults.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update exercise log
      const query = `
        UPDATE exercise_logs
        SET sets = COALESCE(?, sets),
            reps = COALESCE(?, reps),
            weight_kg = COALESCE(?, weight_kg),
            duration_minutes = COALESCE(?, duration_minutes),
            trainer_note = ?
        WHERE log_id = ?
      `;
      const values = [sets, reps, weight_kg, duration_minutes, trainer_note, logId];

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
    }
  );
});

/**
 * DELETE /trainers/:trainerId/clients/:clientId/exercise-logs/:logId
 * Deletes an exercise log (trainer delete)
 */
server.delete('/trainers/:trainerId/clients/:clientId/exercise-logs/:logId', (req: Request, res: Response) => {
  const trainerId = req.params.trainerId;
  const clientId = req.params.clientId;
  const logId = req.params.logId;

  // Verify trainer owns this client
  db.query(
    'SELECT user_id FROM users WHERE user_id = ? AND trainer_id = ? AND role = ?',
    [clientId, trainerId, 'client'],
    (error: mysql.QueryError | null, verifyResults: any[]) => {
      if (error || verifyResults.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Delete exercise log
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
    }
  );
});

// ============================================
// MUSCLE GROUP CRUD ENDPOINTS
// ============================================

/**
 * POST /muscle-groups
 * Creates a new muscle group (trainer only)
 */
server.post('/muscle-groups', (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Muscle group name is required' });
  }

  db.query(
    'INSERT INTO muscle_groups (name) VALUES (?)',
    [name],
    (error: mysql.QueryError | null, results: any) => {
      if (error) {
        console.error('Failed to create muscle group:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(201).json({
          muscle_group_id: results.insertId,
          name
        });
      }
    }
  );
});

/**
 * PUT /muscle-groups/:muscleGroupId
 * Updates a muscle group (trainer only)
 */
server.put('/muscle-groups/:muscleGroupId', (req: Request, res: Response) => {
  const muscleGroupId = req.params.muscleGroupId;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Muscle group name is required' });
  }

  db.query(
    'UPDATE muscle_groups SET name = ? WHERE muscle_group_id = ?',
    [name, muscleGroupId],
    (error: mysql.QueryError | null, results: any) => {
      if (error) {
        console.error('Failed to update muscle group:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Muscle group not found' });
      } else {
        res.json({
          muscle_group_id: parseInt(muscleGroupId),
          name
        });
      }
    }
  );
});

/**
 * DELETE /muscle-groups/:muscleGroupId
 * Deletes a muscle group (trainer only)
 */
server.delete('/muscle-groups/:muscleGroupId', (req: Request, res: Response) => {
  const muscleGroupId = req.params.muscleGroupId;

  db.query(
    'DELETE FROM muscle_groups WHERE muscle_group_id = ?',
    [muscleGroupId],
    (error: mysql.QueryError | null, results: any) => {
      if (error) {
        console.error('Failed to delete muscle group:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Muscle group not found' });
      } else {
        res.json({ success: true, message: 'Muscle group deleted' });
      }
    }
  );
});

// ============================================
// EXERCISE CRUD ENDPOINTS
// ============================================

/**
 * POST /exercises
 * Creates a new exercise (trainer only)
 */
server.post('/exercises', (req: Request, res: Response) => {
  const { exercise_name, muscle_group_id } = req.body;

  if (!exercise_name || !muscle_group_id) {
    return res.status(400).json({ error: 'Exercise name and muscle group ID are required' });
  }

  db.query(
    'INSERT INTO exercises (exercise_name, muscle_group_id) VALUES (?, ?)',
    [exercise_name, muscle_group_id],
    (error: mysql.QueryError | null, results: any) => {
      if (error) {
        console.error('Failed to create exercise:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(201).json({
          exercise_id: results.insertId,
          exercise_name,
          muscle_group_id
        });
      }
    }
  );
});

/**
 * PUT /exercises/:exerciseId
 * Updates an exercise (trainer only)
 */
server.put('/exercises/:exerciseId', (req: Request, res: Response) => {
  const exerciseId = req.params.exerciseId;
  const { exercise_name, muscle_group_id } = req.body;

  if (!exercise_name || !muscle_group_id) {
    return res.status(400).json({ error: 'Exercise name and muscle group ID are required' });
  }

  db.query(
    'UPDATE exercises SET exercise_name = ?, muscle_group_id = ? WHERE exercise_id = ?',
    [exercise_name, muscle_group_id, exerciseId],
    (error: mysql.QueryError | null, results: any) => {
      if (error) {
        console.error('Failed to update exercise:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Exercise not found' });
      } else {
        res.json({
          exercise_id: parseInt(exerciseId),
          exercise_name,
          muscle_group_id
        });
      }
    }
  );
});

/**
 * DELETE /exercises/:exerciseId
 * Deletes an exercise (trainer only)
 */
server.delete('/exercises/:exerciseId', (req: Request, res: Response) => {
  const exerciseId = req.params.exerciseId;

  db.query(
    'DELETE FROM exercises WHERE exercise_id = ?',
    [exerciseId],
    (error: mysql.QueryError | null, results: any) => {
      if (error) {
        console.error('Failed to delete exercise:', error);
        res.status(500).json({ error: 'Internal server error' });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Exercise not found' });
      } else {
        res.json({ success: true, message: 'Exercise deleted' });
      }
    }
  );
});