import * as crypto from 'crypto';

export function hashRefreshToken(token: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
