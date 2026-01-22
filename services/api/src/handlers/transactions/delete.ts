import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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

    // First, find the transaction
    const queryResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND contains(SK, :id)',
      ExpressionAttributeValues: {
        ':pk': getUserPK(userId),
        ':id': transactionId,
      },
      Limit: 1,
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      throw new NotFoundError('Transaction not found');
    }

    const transaction = queryResult.Items[0];

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: transaction.PK,
        SK: transaction.SK,
      },
    }));

    return successResponse({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}
