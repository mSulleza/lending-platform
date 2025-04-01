"use client";

import {
    calculatePayment,
    formatCurrency,
    formatDate,
} from "@/app/utils/formatters";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CloseLoanModal from "../components/CloseLoanModal";
import GenerateContractButton from "../components/GenerateContractButton";
import PaymentScheduleTable from "../components/PaymentScheduleTable";

interface Schedule {
  id: string;
  clientId: string;
  loanAmount: number;
  serviceCharge: number;
  monthlyInterest: number;
  loanTerms: number;
  paymentScheme: string;
  startDate: string;
  createdAt: string;
  hasContract: boolean;
  status: string;
  closedDate?: string;
  closingNotes?: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface Payment {
  id: string;
  loanScheduleId: string;
  dueDate: string;
  amount: number;
  isPaid: boolean;
}

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [isCloseLoanModalOpen, setIsCloseLoanModalOpen] = useState(false);
  const [allPaymentsMade, setAllPaymentsMade] = useState(false);
  const [selectedModalTab, setSelectedModalTab] = useState("default");

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/schedules/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Loan schedule not found");
          }
          throw new Error("Failed to fetch loan schedule");
        }
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        setError(
          (err as Error).message || "An error occurred. Please try again."
        );
        console.error("Error fetching schedule:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSchedule();
    }
  }, [id]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/schedules/${id}/payments`);
        if (!response.ok) {
          throw new Error("Failed to fetch payments");
        }
        const data = await response.json();
        setPayments(data);

        // Calculate remaining balance
        if (schedule) {
          const totalPaid = data
            .filter((payment: Payment) => payment.isPaid)
            .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);

          const remaining = schedule.loanAmount - totalPaid;
          setRemainingBalance(remaining > 0 ? remaining : 0);

          // Check if all payments are made
          setAllPaymentsMade(
            data.length > 0 && data.every((payment: Payment) => payment.isPaid)
          );
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
      }
    };

    if (schedule) {
      fetchPayments();
    }
  }, [id, schedule]);

  const getPaymentSchemeColor = (scheme: string) => {
    switch (scheme.toLowerCase()) {
      case "weekly":
        return "primary";
      case "bi-weekly":
        return "secondary";
      case "monthly":
        return "success";
      case "quarterly":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "completed":
        return "primary";
      case "defaulted":
        return "danger";
      case "restructured":
        return "warning";
      default:
        return "default";
    }
  };

  const refreshData = () => {
    if (id) {
      router.refresh();
      // Force refetch
      const fetchSchedule = async () => {
        try {
          const response = await fetch(`/api/schedules/${id}`);
          if (response.ok) {
            const data = await response.json();
            setSchedule(data);
          }
        } catch (err) {
          console.error("Error refreshing data:", err);
        }
      };

      fetchSchedule();
    }
  };

  const openLoanModal = (tab: string = "default") => {
    setSelectedModalTab(tab);
    setIsCloseLoanModalOpen(true);
  };

  const closeLoanModal = () => {
    setSelectedModalTab("default");
    setIsCloseLoanModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Spinner color="primary" size="lg" />
          <p className="text-default-500 mt-4 ml-4">Loading loan schedule...</p>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Card className="w-full">
          <CardBody className="flex flex-col items-center justify-center py-12">
            <p className="text-danger mb-4">
              {error || "Loan schedule not found"}
            </p>
            <Button color="primary" onPress={() => router.push("/schedules")}>
              Back to Schedules
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const paymentAmount = calculatePayment(
    schedule.loanAmount,
    schedule.monthlyInterest,
    schedule.loanTerms,
    schedule.paymentScheme
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
            Loan Schedule
          </h1>
          <p className="text-default-500 mt-1">
            {schedule.client.firstName} {schedule.client.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          {schedule.status === "active" && (
            <>
              {allPaymentsMade ? (
                <Button
                  color="success"
                  onPress={() => openLoanModal("complete")}
                  className="font-medium"
                  startContent={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                >
                  Mark as Completed
                </Button>
              ) : (
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => openLoanModal()}
                  className="font-medium"
                >
                  Close Loan
                </Button>
              )}
              <GenerateContractButton 
                loanId={id} 
                hasContract={schedule.hasContract}
                onSuccess={refreshData}
              />
            </>
          )}
          <Button
            color="primary"
            variant="light"
            onPress={() => router.push("/schedules")}
            className="font-medium"
          >
            Back to Schedules
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {schedule.status === "active" && allPaymentsMade && (
          <Card className="col-span-full bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700">
            <CardBody className="flex flex-row items-center gap-4 p-4">
              <div className="rounded-full bg-success-100 dark:bg-success-800 p-2 flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 12.0002C22 17.5002 17.5 22.0002 12 22.0002C6.5 22.0002 2 17.5002 2 12.0002C2 6.50024 6.5 2.00024 12 2.00024C17.5 2.00024 22 6.50024 22 12.0002Z"
                    fill="currentColor"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M7.75 12.0002L10.58 14.8302L16.25 9.17024"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-success-700 dark:text-success-400 font-semibold mb-1">
                  Congratulations!
                </h4>
                <p className="text-success-600 dark:text-success-500 text-sm">
                  All payments have been completed. You can now mark this loan
                  as completed.
                </p>
              </div>
              <Button
                color="success"
                className="ml-auto"
                onPress={() => openLoanModal("complete")}
                size="sm"
              >
                Mark as Completed
              </Button>
            </CardBody>
          </Card>
        )}

        <Card className="col-span-2">
          <CardHeader className="bg-primary-50 dark:bg-primary-900/10">
            <h2 className="text-xl font-semibold text-primary">Loan Details</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-default-500 mb-1">Loan Amount</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(schedule.loanAmount)}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">
                  Service Charge
                </h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(schedule.serviceCharge || 0)}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">
                  Monthly Interest
                </h3>
                <p className="text-xl font-semibold">
                  {schedule.monthlyInterest}%
                </p>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">Loan Term</h3>
                <p className="text-xl font-semibold">
                  {schedule.loanTerms} months
                </p>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">
                  Payment Scheme
                </h3>
                <Chip
                  size="sm"
                  color={getPaymentSchemeColor(schedule.paymentScheme)}
                  variant="flat"
                  className="mt-1"
                >
                  {schedule.paymentScheme.charAt(0).toUpperCase() +
                    schedule.paymentScheme.slice(1)}
                </Chip>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">Start Date</h3>
                <p className="text-xl font-semibold">
                  {formatDate(new Date(schedule.startDate))}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">Status</h3>
                <Chip
                  size="sm"
                  color={getStatusColor(schedule.status)}
                  variant="flat"
                  className="mt-1"
                >
                  {schedule.status.charAt(0).toUpperCase() +
                    schedule.status.slice(1)}
                </Chip>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">Contract</h3>
                <Chip
                  size="sm"
                  color={schedule.hasContract ? "success" : "warning"}
                  variant="flat"
                  className="mt-1"
                >
                  {schedule.hasContract ? "Generated" : "Not Generated"}
                </Chip>
              </div>
              {schedule.status === "active" && (
                <div className="md:col-span-2">
                  <h3 className="text-sm text-default-500 mb-1">
                    {schedule.paymentScheme.charAt(0).toUpperCase() +
                      schedule.paymentScheme.slice(1)}{" "}
                    Payment
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(paymentAmount)}
                  </p>
                </div>
              )}
              {schedule.status !== "active" && schedule.closedDate && (
                <div className="md:col-span-2">
                  <h3 className="text-sm text-default-500 mb-1">Closed Date</h3>
                  <p className="text-xl font-semibold">
                    {formatDate(new Date(schedule.closedDate))}
                  </p>
                  {schedule.closingNotes && (
                    <div className="mt-4">
                      <h3 className="text-sm text-default-500 mb-1">
                        Closing Notes
                      </h3>
                      <p className="text-default-700">
                        {schedule.closingNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="bg-primary-50 dark:bg-primary-900/10">
            <h2 className="text-xl font-semibold text-primary">
              Client Information
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-default-500 mb-1">Name</h3>
                <p className="font-semibold">
                  {schedule.client.firstName} {schedule.client.lastName}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-default-500 mb-1">Email</h3>
                <p className="font-semibold">{schedule.client.email}</p>
              </div>
              {schedule.client.phone && (
                <div>
                  <h3 className="text-sm text-default-500 mb-1">Phone</h3>
                  <p className="font-semibold">{schedule.client.phone}</p>
                </div>
              )}
              <Divider />
              <div className="pt-2">
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  onPress={() => router.push(`/clients/${schedule.clientId}`)}
                  className="w-full"
                >
                  View Client Profile
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-10">
        <PaymentScheduleTable loanScheduleId={schedule.id} />
      </div>

      {isCloseLoanModalOpen && (
        <CloseLoanModal
          isOpen={isCloseLoanModalOpen}
          onClose={closeLoanModal}
          loanId={id}
          loanAmount={schedule.loanAmount}
          remainingBalance={remainingBalance}
          onSuccess={refreshData}
          defaultTab={selectedModalTab}
        />
      )}
    </div>
  );
}
