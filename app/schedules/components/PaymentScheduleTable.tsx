import { formatCurrency, formatDate } from "@/app/utils/formatters";
import {
  Button,
  Chip,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { useEffect, useState } from "react";

interface Payment {
  id: string;
  loanScheduleId: string;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paymentDate: string | null;
  chequeNumber: string | null;
}

interface PaymentScheduleTableProps {
  loanScheduleId: string;
  onGeneratePayments?: () => void;
}

export default function PaymentScheduleTable({
  loanScheduleId,
  onGeneratePayments,
}: PaymentScheduleTableProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [chequeNumber, setChequeNumber] = useState("");
  const [generatingPayments, setGeneratingPayments] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [loanScheduleId]);

  const fetchPayments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/schedules/${loanScheduleId}/payments`);
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError((err as Error).message || "An error occurred");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayments = async () => {
    setGeneratingPayments(true);
    try {
      const response = await fetch(
        `/api/schedules/${loanScheduleId}/payments`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate payments");
      }

      await fetchPayments();
      if (onGeneratePayments) {
        onGeneratePayments();
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred");
      console.error("Error generating payments:", err);
    } finally {
      setGeneratingPayments(false);
    }
  };

  const updatePayment = async (paymentId: string, data: any) => {
    try {
      const response = await fetch(
        `/api/schedules/${loanScheduleId}/payments/${paymentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update payment");
      }

      await fetchPayments();
    } catch (err) {
      setError((err as Error).message || "An error occurred");
      console.error("Error updating payment:", err);
    }
  };

  const handleTogglePaid = async (paymentId: string, currentPaid: boolean) => {
    const newPaidStatus = !currentPaid;
    let paymentDate = null;

    if (newPaidStatus) {
      paymentDate = new Date().toISOString();
    }

    await updatePayment(paymentId, {
      isPaid: newPaidStatus,
      paymentDate: newPaidStatus ? paymentDate : null,
      chequeNumber: newPaidStatus ? undefined : null,
    });
  };

  const handleSaveChequeNumber = async (paymentId: string) => {
    await updatePayment(paymentId, { chequeNumber });
    setEditingPayment(null);
    setChequeNumber("");
  };

  const handleEditCheque = (payment: Payment) => {
    setEditingPayment(payment.id);
    setChequeNumber(payment.chequeNumber || "");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-danger py-4">
        <p>{error}</p>
        <Button
          color="primary"
          variant="light"
          onPress={fetchPayments}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-default-500 mb-4">
          No payments have been generated for this loan schedule.
        </p>
        <Button
          color="primary"
          onPress={handleGeneratePayments}
          isLoading={generatingPayments}
        >
          Generate Payment Schedule
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Payment Schedule</h3>
        <Button
          color="primary"
          size="sm"
          onPress={handleGeneratePayments}
          isLoading={generatingPayments}
        >
          Regenerate Payments
        </Button>
      </div>

      <Table aria-label="Payment schedule table">
        <TableHeader>
          <TableColumn>DUE DATE</TableColumn>
          <TableColumn>AMOUNT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>PAYMENT DATE</TableColumn>
          <TableColumn>CHEQUE #</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(new Date(payment.dueDate))}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <Chip
                  color={payment.isPaid ? "success" : "warning"}
                  variant="flat"
                  size="sm"
                >
                  {payment.isPaid ? "Paid" : "Unpaid"}
                </Chip>
              </TableCell>
              <TableCell>
                {payment.paymentDate
                  ? formatDate(new Date(payment.paymentDate))
                  : "—"}
              </TableCell>
              <TableCell>
                {editingPayment === payment.id ? (
                  <Input
                    size="sm"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="Enter cheque number"
                    className="max-w-[150px]"
                  />
                ) : (
                  payment.chequeNumber || "—"
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {editingPayment === payment.id ? (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleSaveChequeNumber(payment.id)}
                    >
                      Save
                    </Button>
                  ) : payment.isPaid ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() =>
                          handleTogglePaid(payment.id, payment.isPaid)
                        }
                        startContent={
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                      >
                        Unpay
                      </Button>
                      <Button
                        size="sm"
                        color="default"
                        variant="light"
                        onPress={() => handleEditCheque(payment)}
                      >
                        Edit Cheque
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        onPress={() =>
                          handleTogglePaid(payment.id, payment.isPaid)
                        }
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
                        Mark Paid
                      </Button>
                      <Button
                        size="sm"
                        color="default"
                        variant="light"
                        onPress={() => handleEditCheque(payment)}
                      >
                        Edit Cheque
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
