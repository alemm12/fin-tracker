import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionSchema } from '@fin-tracker/validation';
import type { Transaction } from '@fin-tracker/types';
import { docClient, TABLE_NAME, getUserPK, getTransactionSK } from '../../lib/dynamodb';
import { successResponse, errorResponse } from '../../lib/response';
import { authenticate } from '../../middleware/auth';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = authenticate(event);
    const body = JSON.parse(event.body || '{}');
    const data = CreateTransactionSchema.parse(body);

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id: transactionId,
      userId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: getUserPK(userId),
        SK: getTransactionSK(data.date, transactionId),
        type: 'TRANSACTION',
        ...transaction,
        GSI1PK: `USER#${userId}#CAT#${data.category}`,
        GSI1SK: data.date,
      },
    }));

    return successResponse(transaction, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
