import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Budget } from '@fin-tracker/types';
import { getCurrentMonth } from '@fin-tracker/shared';
import { docClient, TABLE_NAME, getUserPK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { authenticate } from '../../middleware/auth';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = authenticate(event);
    const month = event.queryStringParameters?.month || getCurrentMonth();

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': getUserPK(userId),
        ':sk': `BUDGET#${month}`,
      },
    }));

    const budgets = (result.Items || []) as Budget[];

    return successResponse({
      budgets,
      count: budgets.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
