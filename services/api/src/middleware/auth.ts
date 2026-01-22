import type { APIGatewayProxyEvent } from 'aws-lambda';
import { verifyToken } from '@fin-tracker/shared';
import { AuthenticationError } from '@fin-tracker/shared';

export interface AuthContext {
  userId: string;
  email: string;
}

export function extractToken(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError('No authorization header provided');
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthenticationError('Invalid authorization header format');
  }

  return parts[1];
}

export function authenticate(event: APIGatewayProxyEvent): AuthContext {
  const token = extractToken(event);
  const payload = verifyToken(token);

  return {
    userId: payload.userId,
    email: payload.email,
  };
}
