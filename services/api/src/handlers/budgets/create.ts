import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { CreateBudgetSchema } from '@fin-tracker/validation';
import type { Budget } from '@fin-tracker/types';
import { getCurrentMonth } from '@fin-tracker/shared';
import { docClient, TABLE_NAME, getUserPK, getBudgetSK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { authenticate } from '../../middleware/auth';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = authenticate(event);
    const body = JSON.parse(event.body || '{}');
    const data = CreateBudgetSchema.parse(body);

    const budgetId = uuidv4();
    const now = new Date().toISOString();
    const month = data.month || getCurrentMonth();

    const budget: Budget = {
      id: budgetId,
      userId,
      ...data,
      month,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: getUserPK(userId),
        SK: getBudgetSK(month, data.category),
        type: 'BUDGET',
        ...budget,
      },
    }));

    return successResponse(budget, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
