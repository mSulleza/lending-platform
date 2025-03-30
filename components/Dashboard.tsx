"use client";

import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Spinner } from "@nextui-org/spinner";
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
        <Spinner size="lg" label="Loading dashboard statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-danger">
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
        <Card className="bg-primary-50 dark:bg-primary-900/20">
          <CardBody className="py-5">
            <h2 className="text-sm font-medium text-default-500">
              Total Clients
            </h2>
            <p className="text-3xl font-semibold mt-1">{stats.totalClients}</p>
          </CardBody>
        </Card>

        <Card className="bg-success-50 dark:bg-success-900/20">
          <CardBody className="py-5">
            <h2 className="text-sm font-medium text-default-500">
              Total Loans
            </h2>
            <p className="text-3xl font-semibold mt-1">{stats.totalLoans}</p>
            <p className="text-sm text-default-500 mt-1">
              {formatCurrency(stats.totalLoanAmount)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-warning-50 dark:bg-warning-900/20">
          <CardBody className="py-5">
            <h2 className="text-sm font-medium text-default-500">
              Active Loans
            </h2>
            <p className="text-3xl font-semibold mt-1">{stats.activeLoans}</p>
            <p className="text-sm text-default-500 mt-1">
              {((stats.activeLoans / stats.totalLoans) * 100).toFixed(1)}% of
              total
            </p>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 dark:bg-secondary-900/20">
          <CardBody className="py-5">
            <h2 className="text-sm font-medium text-default-500">
              Total Payments Received
            </h2>
            <p className="text-3xl font-semibold mt-1">
              {stats.totalPaidPayments}
            </p>
            <p className="text-sm text-default-500 mt-1">
              {formatCurrency(stats.totalPaidAmount)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Earnings and Projections */}
      <Card className="mt-6">
        <CardHeader className="border-b border-divider pb-2">
          <h2 className="text-lg font-medium">Earnings & Projections</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-default-500">
                Total Service Charges
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.totalServiceCharges)}
              </p>
              <p className="text-xs text-default-500 mt-1">
                Upfront fees from all loans
              </p>
            </div>

            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-default-500">
                Payments Received
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.totalPaidAmount)}
              </p>
              <p className="text-xs text-default-500 mt-1">
                Total payments collected to date
              </p>
            </div>

            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-default-500">
                Projected Interest Earnings
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.projectedInterestEarnings)}
              </p>
              <p className="text-xs text-default-500 mt-1">
                Expected interest earnings from all loans
              </p>
            </div>

            <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-default-500">
                Total Projected Earnings
              </h3>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(stats.projectedEarnings)}
              </p>
              <p className="text-xs text-default-500 mt-1">
                Service charges + interest + principal
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Payment Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader className="border-b border-divider pb-2">
            <h2 className="text-lg font-medium">Payment Status</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Upcoming Payments (7 days)</h3>
                  <p className="text-sm text-default-500">Due soon</p>
                </div>
                <div className="bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.upcomingPayments}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Overdue Payments</h3>
                  <p className="text-sm text-default-500">Past due date</p>
                </div>
                <div className="bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 px-3 py-1 rounded-full text-sm font-medium">
                  {stats.overduePayments}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-divider pb-2">
            <h2 className="text-lg font-medium">Payment Schemes</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 py-2">
              {stats.paymentSchemes.map((scheme) => (
                <div
                  key={scheme.scheme}
                  className="flex justify-between items-center"
                >
                  <span className="capitalize">{scheme.scheme}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 bg-primary-200 dark:bg-primary-800 rounded-full"
                      style={{
                        width: `${(scheme.count / stats.totalLoans) * 100}px`,
                        minWidth: "20px",
                        maxWidth: "100px",
                      }}
                    ></div>
                    <span className="text-sm">{scheme.count} loans</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Loans Section */}
      <Card className="mt-6">
        <CardHeader className="border-b border-divider pb-2">
          <h2 className="text-lg font-medium">Recent Loans</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-divider">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-default-500 uppercase tracking-wider">
                    Payment Scheme
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-default-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {stats.recentLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-default-50 dark:hover:bg-default-50/10"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {loan.clientName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatCurrency(loan.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatDate(new Date(loan.startDate))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">
                      {loan.paymentScheme}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <a
                        href={`/schedules/${loan.id}`}
                        className="text-primary hover:underline"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
