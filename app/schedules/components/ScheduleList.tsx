"use client";

import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Spinner } from "@nextui-org/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ScheduleList() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/schedules");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(
        "An error occurred while fetching the schedules. Please try again."
      );
      console.error("Error fetching schedules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();

    // Listen for the custom event to refresh the schedule list
    const handleScheduleAdded = () => {
      fetchSchedules();
    };

    document.addEventListener("schedule-added", handleScheduleAdded);
    return () => {
      document.removeEventListener("schedule-added", handleScheduleAdded);
    };
  }, []);

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

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-12">
          <Spinner color="primary" size="lg" />
          <p className="text-default-500 mt-4">Loading schedules...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-12">
          <p className="text-danger mb-4">{error}</p>
          <Button color="primary" onPress={fetchSchedules}>
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-12">
          <p className="text-default-500 mb-4">No loan schedules found</p>
          <Button
            color="primary"
            onPress={() =>
              document.dispatchEvent(new CustomEvent("add-schedule-click"))
            }
          >
            Create Your First Loan Schedule
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Table
      aria-label="Loan Schedules"
      classNames={{
        base: "min-h-[400px]",
        table: "min-w-full",
      }}
    >
      <TableHeader>
        <TableColumn>CLIENT</TableColumn>
        <TableColumn>LOAN AMOUNT</TableColumn>
        <TableColumn>INTEREST</TableColumn>
        <TableColumn>TERMS</TableColumn>
        <TableColumn>PAYMENT SCHEME</TableColumn>
        <TableColumn>START DATE</TableColumn>
        <TableColumn>CONTRACT</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>
              <div className="flex flex-col">
                <p className="font-medium text-small">
                  {schedule.client.firstName} {schedule.client.lastName}
                </p>
                <p className="text-tiny text-default-500">
                  {schedule.client.email}
                </p>
              </div>
            </TableCell>
            <TableCell>{formatCurrency(schedule.loanAmount)}</TableCell>
            <TableCell>{schedule.monthlyInterest}%</TableCell>
            <TableCell>{schedule.loanTerms} months</TableCell>
            <TableCell>
              <Chip
                size="sm"
                color={getPaymentSchemeColor(schedule.paymentScheme)}
                variant="flat"
              >
                {schedule.paymentScheme.charAt(0).toUpperCase() +
                  schedule.paymentScheme.slice(1)}
              </Chip>
            </TableCell>
            <TableCell>{formatDate(new Date(schedule.startDate))}</TableCell>
            <TableCell>
              <Chip
                size="sm"
                color={schedule.hasContract ? "success" : "warning"}
                variant="flat"
              >
                {schedule.hasContract ? "Yes" : "No"}
              </Chip>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => router.push(`/schedules/${schedule.id}`)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color={schedule.hasContract ? "default" : "success"}
                  isDisabled={schedule.hasContract}
                >
                  Generate Contract
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
