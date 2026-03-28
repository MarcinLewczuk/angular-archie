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
 * POST /users/:userId/workout-sessions
 * Creates a new workout session for a user
 */
server.post('/users/:userId/workout-sessions', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { session_date, note, duration_total_minutes } = req.body;

  if (!session_date) {
    return res.status(400).json({ error: 'session_date is required' });
  }

  const query = 'INSERT INTO workout_sessions (user_id, session_date, note, duration_total_minutes) VALUES (?, ?, ?, ?)';
  const values = [userId, session_date, note || null, duration_total_minutes || null];

  db.query(query, values, (error: mysql.QueryError | null, results: any) => {
    if (error) {
      console.error('Failed to create workout session:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(201).json({ session_id: results.insertId, user_id: userId, session_date, note, duration_total_minutes });
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
