import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { UpdateTransactionSchema } from '@fin-tracker/validation';
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

    const body = JSON.parse(event.body || '{}');
    const updates = UpdateTransactionSchema.parse(body);

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

    // Build update expression
    const updateParts: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateParts.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateParts.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: transaction.PK,
        SK: transaction.SK,
      },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return successResponse(result.Attributes);
  } catch (error) {
    return errorResponse(error);
  }
}
