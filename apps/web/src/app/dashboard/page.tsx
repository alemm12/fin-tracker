'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Transaction, Budget } from '@fin-tracker/types';

export default function DashboardPage() {
  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () =>
      apiClient.get<{ data: Transaction[] }>('/transactions?limit=5'),
  });

  // Fetch budgets
  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiClient.get<{ data: Budget[] }>('/budgets'),
  });

  const transactions = transactionsData?.data || [];
  const budgets = budgetsData?.data || [];

  // Calculate summary statistics
  const thisMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const now = new Date();
    return (
      transactionDate.getMonth() === now.getMonth() &&
      transactionDate.getFullYear() === now.getFullYear()
    );
  });

  const totalIncome = thisMonthTransactions
    .filter((t) => t.category === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = thisMonthTransactions
    .filter((t) => t.category !== 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Income
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  ${totalIncome.toFixed(2)}
                </dd>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="rounded-md bg-green-50 p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Expenses
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </dd>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="rounded-md bg-red-50 p-3">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Net Balance
                </dt>
                <dd
                  className={`mt-1 text-3xl font-semibold ${
                    netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}
                >
                  ${netBalance.toFixed(2)}
                </dd>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="rounded-md bg-blue-50 p-3">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Transactions
          </h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {transactionsLoading ? (
            <p className="text-gray-500">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => {
                const isIncome = transaction.category === 'income';
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-full p-2 ${
                          isIncome ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isIncome ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()} •{' '}
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}$
                      {transaction.amount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Budget Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Budget Overview</h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {budgetsLoading ? (
            <p className="text-gray-500">Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <p className="text-gray-500">No budgets set yet.</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spent = thisMonthTransactions
                  .filter((t) => t.category === budget.category)
                  .reduce((sum, t) => sum + t.amount, 0);
                const percentage = (spent / budget.limit) * 100;

                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {budget.category}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${spent.toFixed(2)} of ${budget.limit.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          percentage > 90
                            ? 'text-red-600'
                            : percentage > 70
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                      >
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage > 90
                            ? 'bg-red-600'
                            : percentage > 70
                            ? 'bg-orange-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
