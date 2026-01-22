import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { compare } from 'bcryptjs';
import { LoginRequestSchema } from '@fin-tracker/validation';
import { generateAccessToken, generateRefreshToken } from '@fin-tracker/shared';
import type { AuthResponse } from '@fin-tracker/types';
import { docClient, TABLE_NAME, getUserPK, getUserSK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { AuthenticationError } from '@fin-tracker/shared';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = LoginRequestSchema.parse(body);

    // Get user ID from email index
    const emailRecord = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `EMAIL#${email.toLowerCase()}`,
        SK: `EMAIL#${email.toLowerCase()}`,
      },
    }));

    if (!emailRecord.Item) {
      throw new AuthenticationError('Invalid email or password');
    }

    const userId = emailRecord.Item.userId;

    // Get user record
    const userRecord = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: getUserPK(userId),
        SK: getUserSK(userId),
      },
    }));

    if (!userRecord.Item) {
      throw new AuthenticationError('Invalid email or password');
    }

    const user = userRecord.Item;

    // Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const accessToken = generateAccessToken(userId, user.email);
    const refreshToken = generateRefreshToken(userId);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
      },
    };

    return successResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
}
