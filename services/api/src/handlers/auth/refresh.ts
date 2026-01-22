import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { RefreshTokenSchema } from '@fin-tracker/validation';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@fin-tracker/shared';
import type { AuthTokens } from '@fin-tracker/types';
import { docClient, TABLE_NAME, getUserPK, getUserSK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { AuthenticationError } from '@fin-tracker/shared';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = RefreshTokenSchema.parse(body);

    const payload = verifyToken(refreshToken);

    // Get user to verify they still exist
    const userRecord = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: getUserPK(payload.userId),
        SK: getUserSK(payload.userId),
      },
    }));

    if (!userRecord.Item) {
      throw new AuthenticationError('User not found');
    }

    const user = userRecord.Item;

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);

    const response: AuthTokens = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
    };

    return successResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
}
