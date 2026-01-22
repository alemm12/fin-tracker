import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterRequestSchema } from '@fin-tracker/validation';
import { generateAccessToken, generateRefreshToken } from '@fin-tracker/shared';
import type { AuthResponse } from '@fin-tracker/types';
import { docClient, TABLE_NAME, getUserPK, getUserSK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { ConflictError } from '@fin-tracker/shared';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name } = RegisterRequestSchema.parse(body);

    // Check if user already exists
    const existingUser = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMAIL#${email.toLowerCase()}`,
        SK: `EMAIL#${email.toLowerCase()}`,
      },
    }));

    if (existingUser.Item) {
      throw new ConflictError('User with this email already exists');
    }

    const userId = uuidv4();
    const hashedPassword = await hash(password, 10);
    const now = new Date().toISOString();

    // Create user record
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: getUserPK(userId),
        SK: getUserSK(userId),
        type: 'USER',
        id: userId,
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        defaultCurrency: 'USD',
        timezone: 'UTC',
        createdAt: now,
        updatedAt: now,
      },
    }));

    // Create email index record for lookup
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `EMAIL#${email.toLowerCase()}`,
        SK: `EMAIL#${email.toLowerCase()}`,
        userId,
      },
    }));

    const accessToken = generateAccessToken(userId, email);
    const refreshToken = generateRefreshToken(userId);

    const response: AuthResponse = {
      user: {
        id: userId,
        email,
        name,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
      },
    };

    return successResponse(response, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
