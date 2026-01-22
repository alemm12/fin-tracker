import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Transaction } from '@fin-tracker/types';
import { docClient, TABLE_NAME, getUserPK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { authenticate } from '../../middleware/auth';
import { NotFoundError } from '@fin-tracker/shared';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = authenticate(event);
    const transactionId = event.pathParameters?.id;

    if (!transactionId) {
      throw new NotFoundError('Transaction ID is required');
    }

    // Query for the transaction
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND contains(SK, :id)',
      ExpressionAttributeValues: {
        ':pk': getUserPK(userId),
        ':id': transactionId,
      },
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      throw new NotFoundError('Transaction not found');
    }

    return successResponse(result.Items[0] as Transaction);
  } catch (error) {
    return errorResponse(error);
  }
}
