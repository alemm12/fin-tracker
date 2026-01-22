import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TransactionQuerySchema } from '@fin-tracker/validation';
import type { Transaction } from '@fin-tracker/types';
import { docClient, TABLE_NAME, getUserPK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { authenticate } from '../../middleware/auth';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = authenticate(event);
    const params = TransactionQuerySchema.parse(event.queryStringParameters || {});

    let KeyConditionExpression = 'PK = :pk AND begins_with(SK, :sk)';
    let ExpressionAttributeValues: Record<string, any> = {
      ':pk': getUserPK(userId),
      ':sk': 'TRANSACTION#',
    };

    if (params.startDate) {
      KeyConditionExpression = 'PK = :pk AND SK BETWEEN :start AND :end';
      ExpressionAttributeValues = {
        ':pk': getUserPK(userId),
        ':start': `TRANSACTION#${params.startDate}`,
        ':end': `TRANSACTION#${params.endDate || '9999-12-31T23:59:59Z'}`,
      };
    }

    let FilterExpression: string | undefined;
    if (params.category || params.minAmount || params.maxAmount) {
      const filters: string[] = [];

      if (params.category) {
        filters.push('category = :category');
        ExpressionAttributeValues[':category'] = params.category;
      }

      if (params.minAmount) {
        filters.push('amount >= :minAmount');
        ExpressionAttributeValues[':minAmount'] = params.minAmount;
      }

      if (params.maxAmount) {
        filters.push('amount <= :maxAmount');
        ExpressionAttributeValues[':maxAmount'] = params.maxAmount;
      }

      FilterExpression = filters.join(' AND ');
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression,
      FilterExpression,
      ExpressionAttributeValues,
      Limit: params.limit,
      ScanIndexForward: false, // Most recent first
    }));

    const transactions = (result.Items || []) as Transaction[];

    return successResponse({
      transactions,
      count: transactions.length,
      lastEvaluatedKey: result.LastEvaluatedKey,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
