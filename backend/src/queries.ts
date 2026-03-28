import { Request, Response } from 'express';
import { QueryError } from 'mysql2';
import { db } from './app';
import { verifyPassword, sanitizeUser } from './security/password';

/**
 * Retrieves all records from a specified table.
 * @param tableName The name of the table to query.
 * @returns Middleware function that returns all records as JSON.
 */
export function selectAll(tableName: string) {
    return (req: Request, res: Response) => {
        db.query(`SELECT * FROM ${tableName}`, (error: QueryError | null, results: any[]) => {
            if (error) {
                console.error(`GET from "${tableName}" failed:`, error);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.json(results);
            }
        });
    };
}

/**
 * Retrieves records by filtering on a specific column.
 * @param tableName The name of the table to query.
 * @param columnName The column name to filter by.
 * @returns Middleware function that returns matching records or 404 if not found.
 */
export function selectColumn(tableName: string, columnName: string) {
    return (req: Request, res: Response) => {
        const value = req.params[columnName];
        db.query(
            `SELECT ${columnName} FROM ${tableName}`,
            [value],
            (error: QueryError | null, results: any[]) => {
                if (error) {
                    console.error(`GET from "${tableName}" failed:`, error);
                    res.status(500).json({ error: 'Internal server error' });
                } else if (results.length === 0) {
                    res.status(404).json({ error: `${tableName.slice(0, -1)} not found` });
                } else {
                    res.json(results);
                }
            }
        );
    };
}

/**
 * Inserts a new record into the specified table.
 * Uses parameterized queries to prevent SQL injection.
 * @param tableName The name of the table to insert into.
 * @param columns Array of column names to insert. Values come from req.body.
 * @returns Middleware function that returns the created record with insertId.
 */
export function insert(tableName: string, columns: string[]) {
    return (req: Request, res: Response) => {
        const data = req.body;
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => data[col]);
        
        db.query(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values,
            (error: QueryError | null, results: any) => {
                if (error) {
                    console.error(`POST to "${tableName}" failed:`, error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    res.status(201).json({ id: results.insertId, ...data });
                }
            }
        );
    };
}

/**
 * Authenticates a user by verifying email and bcrypt-hashed password.
 * @param tableName The name of the table containing user records.
 * @returns Middleware function that verifies credentials and returns sanitized user or 401 error.
 */
export function loginUser(tableName: string) {
    return (req: Request, res: Response) => {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password required' });
        }

        // Fetch user record by email only; verify bcrypt hash separately.
        db.query(
            `SELECT id, email, password FROM ${tableName} WHERE email = ? LIMIT 1`,
            [email],
            async (error: QueryError | null, results: any[]) => {
                if (error) {
                    console.error(`LOGIN query on "${tableName}" failed:`, error);
                    return res.status(500).json({ error: 'internal error' });
                }
                if (!results || results.length === 0) {
                    return res.status(401).json({ error: 'invalid credentials' });
                }
                const user = results[0];
                try {
                    const ok = await verifyPassword(password, user.password);
                    if (!ok) {
                        return res.status(401).json({ error: 'invalid credentials' });
                    }
                    return res.status(200).json(sanitizeUser(user));
                } catch (e) {
                    console.error('Password verification failed:', e);
                    return res.status(500).json({ error: 'internal error' });
                }
            }
        );
    };
}