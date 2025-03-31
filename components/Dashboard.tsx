"use client";

import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { useCallback, useEffect, useState } from "react";

interface DashboardStats {
  totalClients: number;
  totalLoans: number;
  totalLoanAmount: number;
  totalServiceCharges: number;
  activeLoans: number;
  totalPaidPayments: number;
  totalPaidAmount: number;
  upcomingPayments: number;
  overduePayments: number;
  projectedEarnings: number;
  projectedInterestEarnings: number;
  paymentSchemes: Array<{
    scheme: string;
    count: number;
  }>;
  recentLoans: Array<{
    id: string;
    clientName: string;
    amount: number;
    serviceCharge: number;
    startDate: string;
    paymentScheme: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for currency changes to refresh formatting
  useEffect(() => {
    const handleCurrencyChange = () => {
      // Force re-render to update currency formatting
      forceUpdate({});
    };

    window.addEventListener("currency-changed", handleCurrencyChange);

    return () => {
      window.removeEventListener("currency-changed", handleCurrencyChange);
    };
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-primary">Loading dashboard statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-600">
        <h3 className="text-xl mb-2">Error Loading Dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-6">
        <h3 className="text-xl">No data available</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Daily Loan Report</h1>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Clients
          </h2>
          <p className="text-3xl font-semibold mt-1">{stats.totalClients}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Loans
          </h2>
          <p className="text-3xl font-semibold mt-1">{stats.totalLoans}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatCurrency(stats.totalLoanAmount)}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Loans
          </h2>
          <p className="text-3xl font-semibold mt-1">{stats.activeLoans}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {((stats.activeLoans / stats.totalLoans) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Payments Received
          </h2>
          <p className="text-3xl font-semibold mt-1">
            {stats.totalPaidPayments}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatCurrency(stats.totalPaidAmount)}
          </p>
        </div>
      </div>

      {/* Earnings and Projections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-medium">Earnings & Projections</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Service Charges
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.totalServiceCharges)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upfront fees from all loans
              </p>
            </div>

            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Payments Received
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.totalPaidAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total payments collected to date
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Projected Interest Earnings
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.projectedInterestEarnings)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Expected interest earnings from all loans
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Projected Earnings
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.projectedEarnings)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Service charges + interest + principal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium">Payment Status</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Upcoming Payments (7 days)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due soon</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.upcomingPayments}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Overdue Payments</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Past due date</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.overduePayments}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-medium">Payment Schemes</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {stats.paymentSchemes.map((scheme) => (
                <div key={scheme.scheme} className="flex justify-between items-center">
                  <span className="font-medium">{scheme.scheme}</span>
                  <span className="text-gray-500 dark:text-gray-400">{scheme.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loans */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-medium">Recent Loans</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Service Charge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Scheme
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {loan.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(loan.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(loan.serviceCharge)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(loan.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {loan.paymentScheme}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
