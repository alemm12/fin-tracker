import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLE_NAME = process.env.TABLE_NAME || 'fin-tracker';

export function getUserPK(userId: string): string {
  return `USER#${userId}`;
}

export function getTransactionSK(date: string, transactionId: string): string {
  return `TRANSACTION#${date}#${transactionId}`;
}

export function getBudgetSK(month: string, category: string): string {
  return `BUDGET#${month}#${category}`;
}

export function getUserSK(userId: string): string {
  return `USER#${userId}`;
}
