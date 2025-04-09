// lib/password.ts
import * as bcrypt from 'bcryptjs';

const saltRounds = 10;

/**
 * Hashes a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - A promise that resolves with the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifies a password against a stored hash using bcrypt.
 * @param {string} password - The password to verify.
 * @param {string} storedHash - The stored hash.
 * @returns {Promise<boolean>} - A promise that resolves with true if the password matches, false otherwise.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}
