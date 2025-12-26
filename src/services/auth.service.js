import jwt from "jsonwebtoken";
import { getPgConnection } from "../config/auth.js"; // Corrected path to PG connection utility
import { getOrSetCache, cacheKeys, DEFAULT_TTL } from "./redisCache.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret'; // Use a strong secret from .env

/**
 * Authenticates a user against the PostgreSQL 'users' table.
 * @param {string} user_name - The user's username.
 * @param {string} employee_id - The user's employee ID.
 * @param {string} password - The user's plaintext password.
 * @returns {Promise<{success: boolean, token?: string, user?: object, message?: string}>}
 */
export async function loginUser(user_name, employee_id, password) {
  console.time('[auth.service.js] Total Login Time');
  try {
    console.log(`[auth.service.js] Attempting login for user_name: ${user_name}, employee_id: ${employee_id}`);
    
    // Create cache key for user lookup
    const cacheKey = `auth:user:${user_name || ''}:${employee_id || ''}`;
    
    // Try to get user from cache first (fast!)
    const cachedUser = await getOrSetCache(
      cacheKey,
      async () => {
        let client;
        try {
          console.time('[auth.service.js] Get PG Connection');
          client = await getPgConnection();
          console.timeEnd('[auth.service.js] Get PG Connection');

          // Query the 'users' table for the user
          // IMPORTANT: The SQL query should find the user by identifier first,
          // then the password comparison happens in JavaScript.
          let queryText = `
            SELECT id, user_name, employee_id, password, role, user_access, department
            FROM users
            WHERE 1=1 -- Always true, makes appending AND clauses easier
          `;
          const queryParams = [];
          let paramIndex = 1;

          // Add identifier conditions
          if (user_name && employee_id) {
            queryText += ` AND (user_name = $${paramIndex++} OR employee_id = $${paramIndex++})`;
            queryParams.push(user_name, employee_id);
          } else if (user_name) {
            queryText += ` AND user_name = $${paramIndex++}`;
            queryParams.push(user_name);
          } else if (employee_id) {
            queryText += ` AND employee_id = $${paramIndex++}`;
            queryParams.push(employee_id);
          }
          queryText += ` LIMIT 1;`; // Ensure only one user is returned and terminate query

          console.time('[auth.service.js] Execute DB Query');
          console.log('[auth.service.js] Executing query:', queryText, 'with params:', queryParams);
          const result = await client.query(queryText, queryParams);
          console.timeEnd('[auth.service.js] Execute DB Query');
          console.log('[auth.service.js] Query result rows:', result.rows);
          
          if (result.rows.length === 0) {
            return null; // User not found
          }

          return result.rows[0]; // Return user data for caching
        } finally {
          if (client) {
            client.release(); // Release the client back to the pool
          }
        }
      },
      300 // Cache for 5 minutes (300 seconds)
    );

    // If user not found in cache or database
    if (!cachedUser) {
      console.timeEnd('[auth.service.js] Total Login Time');
      return { success: false, message: 'Invalid credentials' };
    }

    // Password validation (always check, not cached)
    const isPasswordValid = password === cachedUser.password;

    if (!isPasswordValid) {
      console.timeEnd('[auth.service.js] Total Login Time');
      return { success: false, message: 'Invalid credentials' };
    }

    const user = cachedUser;

    // If authentication is successful, generate a JSON Web Token (JWT)
    const token = jwt.sign(
      {
        id: user.id,
        user_name: user.user_name,
        employee_id: user.employee_id,
        role: user.role, // Include user role in the token payload
      },
      JWT_SECRET,
      { expiresIn: '30d' } // Token expires in 30 days
    );

    console.timeEnd('[auth.service.js] Total Login Time');
    return {
      success: true,
      token,
      user: {
        id: user.id,
        user_name: user.user_name,
        employee_id: user.employee_id,
        role: user.role,
        user_access: user.user_access || user.department || null,
        department: user.department || user.user_access || null,
      },
    };
  } catch (error) {
    console.error('[auth.service.js] Login error:', error);
    console.timeEnd('[auth.service.js] Total Login Time');
    // The error object itself might contain more details about the internal issue
    return { success: false, message: 'An internal server error occurred during login.' };
  }
}

/**
 * Issue a backend JWT for the given user object.
 * Payload will contain sub (user id), email and username.
 */
export function issueJwt(user) { // This function remains largely the same
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");

  const payload = {
    sub: user?.id ?? null,
    email: user?.email ?? null,
    username: user?.username ?? null,
    employee_id: user?.employee_id ?? null,
    role: user?.role ?? null,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    issuer: process.env.JWT_ISSUER || "store-backend",
  });
}

export async function logoutUser(token) {
  // you can add blacklist logic here later
  if (!token) {
    return {
      ok: true,
      message: "No token provided. User already logged out or not logged in.",
    };
  }

  return {
    ok: true,
    message: "Logout successful. Remove token on client.",
  };
}





