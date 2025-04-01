"use client";

import { formatCurrency } from "@/app/utils/formatters";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from "@heroui/modal";
import { Spinner, Tab, Tabs } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { useCallback, useEffect, useRef, useState } from "react";

interface CloseLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  loanAmount: number;
  remainingBalance: number;
  onSuccess: () => void;
  defaultTab?: string;
}

export default function CloseLoanModal({
  isOpen,
  onClose,
  loanId,
  loanAmount,
  remainingBalance,
  onSuccess,
  defaultTab = "default",
}: CloseLoanModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  const [notes, setNotes] = useState("");

  // For restructuring
  const [interestRate, setInterestRate] = useState("");
  const [newLoanTerms, setNewLoanTerms] = useState("");
  const [paymentScheme, setPaymentScheme] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  // For completion verification
  const [allPaymentsMade, setAllPaymentsMade] = useState(false);
  const [checkingPayments, setCheckingPayments] = useState(false);

  // Use refs to track payment check status
  const hasCheckedPayments = useRef(false);
  const unpaidPaymentCount = useRef(0);

  const paymentSchemes = [
    { label: "Weekly", value: "weekly" },
    { label: "Bi-weekly", value: "bi-weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
  ];

  // Update the selected tab when the defaultTab prop changes
  useEffect(() => {
    // When the modal opens or the defaultTab changes, update the selected tab
    setSelectedTab(defaultTab);
  }, [defaultTab, isOpen]);

  // Reset error and state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setError("");
      // Only reset allPaymentsMade if we're not on the complete tab
      if (selectedTab !== "complete") {
        setAllPaymentsMade(false);
      }
    }
  }, [isOpen, selectedTab]);

  // Reset refs when the modal is closed
  const handleClose = () => {
    setSelectedTab("default");
    setNotes("");
    setInterestRate("");
    setNewLoanTerms("");
    setPaymentScheme("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setError("");
    setAllPaymentsMade(false);
    setCheckingPayments(false);
    hasCheckedPayments.current = false;
    unpaidPaymentCount.current = 0;
    onClose();
  };

  const handleLoanDefault = async () => {
    if (!notes) {
      setError("Please provide notes about the loan default.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/schedules/${loanId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "default",
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark loan as defaulted");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanRestructure = async () => {
    if (!interestRate || !newLoanTerms || !paymentScheme || !startDate) {
      setError("All fields are required for loan restructuring.");
      return;
    }

    if (!notes) {
      setError("Please provide notes about the reason for restructuring.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/schedules/${loanId}/restructure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
          remainingBalance,
          monthlyInterest: parseFloat(interestRate),
          loanTerms: parseInt(newLoanTerms),
          paymentScheme,
          startDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restructure loan");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanComplete = async () => {
    if (!notes) {
      setError("Please provide notes about the loan completion.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify all payments are made (additional server check)
      const response = await fetch(`/api/schedules/${loanId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "complete",
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark loan as completed");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Check payment status when the complete tab is selected
  const checkPaymentStatus = useCallback(async () => {
    if (checkingPayments) return;

    // If we've already checked and found unpaid payments, don't check again
    if (hasCheckedPayments.current && unpaidPaymentCount.current > 0) {
      return;
    }

    setCheckingPayments(true);

    try {
      const response = await fetch(`/api/schedules/${loanId}/payments`);
      if (!response.ok) {
        throw new Error("Failed to fetch payment status");
      }

      const payments = await response.json();
      const unpaidPayments = payments.filter((payment: any) => !payment.isPaid);

      // Store the count of unpaid payments
      unpaidPaymentCount.current = unpaidPayments.length;
      hasCheckedPayments.current = true;

      if (unpaidPayments.length > 0) {
        setError(
          `There are still ${unpaidPayments.length} unpaid payments. All payments must be made before completing the loan.`
        );
        setAllPaymentsMade(false);
      } else if (payments.length === 0) {
        setError("No payments found for this loan.");
        setAllPaymentsMade(false);
      } else {
        setAllPaymentsMade(true);
        setError("");
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      setError((err as Error).message || "Error checking payment status");
      setAllPaymentsMade(false);
    } finally {
      setCheckingPayments(false);
    }
  }, [loanId, checkingPayments]);

  // Run payment check when tab changes to "complete"
  useEffect(() => {
    // Only check when the tab is "complete", we're not already checking, and modal is open
    if (selectedTab === "complete" && !checkingPayments && isOpen) {
      checkPaymentStatus();
    }
  }, [selectedTab, checkPaymentStatus, checkingPayments, isOpen]);

  const handleSubmit = () => {
    if (selectedTab === "default") {
      handleLoanDefault();
    } else if (selectedTab === "complete") {
      handleLoanComplete();
    } else if (selectedTab === "restructure") {
      handleLoanRestructure();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      classNames={{
        closeButton: "right-2 top-2",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Close Loan
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="bg-danger-50 text-danger p-3 rounded-medium mb-4">
                  {error}
                </div>
              )}

              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key: any) => {
                  // If moving away from complete tab, reset payment check status
                  if (selectedTab === "complete" && key !== "complete") {
                    hasCheckedPayments.current = false;
                    unpaidPaymentCount.current = 0;
                  }

                  setSelectedTab(key);
                  // Only clear error when not switching to complete tab
                  // because we want to keep the payment verification error
                  if (key !== "complete") {
                    setError("");
                  }
                }}
                variant="bordered"
                aria-label="Loan closing options"
                classNames={{
                  tabList: "gap-2",
                }}
              >
                <Tab key="default" title="Mark as Default">
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-warning-50 dark:bg-warning-400/10 rounded-medium">
                      <p className="text-warning-600 dark:text-warning-400 font-medium">
                        This will mark the loan as defaulted and close it. This
                        action cannot be undone.
                      </p>
                      <p className="mt-2 text-sm text-warning-600/80 dark:text-warning-400/80">
                        Original loan amount: {formatCurrency(loanAmount)}
                        <br />
                        Remaining balance: {formatCurrency(remainingBalance)}
                      </p>
                    </div>
                    <Textarea
                      label="Default Notes"
                      placeholder="Enter detailed information about the reason for default"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      minRows={3}
                      isRequired
                    />
                  </div>
                </Tab>
                <Tab key="complete" title="Mark as Completed">
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-success-50 dark:bg-success-400/10 rounded-medium">
                      <p className="text-success-600 dark:text-success-400 font-medium">
                        This will mark the loan as completed and close it. All
                        payments must be made.
                      </p>
                      <p className="mt-2 text-sm text-success-600/80 dark:text-success-400/80">
                        Original loan amount: {formatCurrency(loanAmount)}
                        <br />
                        {checkingPayments ? (
                          <span className="flex items-center mt-2">
                            <Spinner
                              size="sm"
                              color="success"
                              className="mr-2"
                            />
                            Verifying payment status...
                          </span>
                        ) : allPaymentsMade ? (
                          <span className="text-success-600 font-medium mt-2 block">
                            ✓ All payments have been made
                          </span>
                        ) : unpaidPaymentCount.current > 0 ? (
                          <span className="flex items-center mt-2 justify-between">
                            <span className="text-danger-600 font-medium">
                              {unpaidPaymentCount.current} unpaid payment(s)
                            </span>
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => {
                                hasCheckedPayments.current = false;
                                unpaidPaymentCount.current = 0;
                                checkPaymentStatus();
                              }}
                            >
                              Refresh
                            </Button>
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Textarea
                      label="Completion Notes"
                      placeholder="Enter details about the loan completion"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      minRows={3}
                      isRequired
                      isDisabled={!allPaymentsMade}
                    />
                  </div>
                </Tab>
                <Tab key="restructure" title="Restructure Loan">
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-400/10 rounded-medium">
                      <p className="text-primary-600 dark:text-primary-400 font-medium">
                        This will close the current loan and create a new
                        restructured loan with the remaining balance.
                      </p>
                      <p className="mt-2 text-sm text-primary-600/80 dark:text-primary-400/80">
                        Remaining balance to be restructured:{" "}
                        {formatCurrency(remainingBalance)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        label="Monthly Interest (%)"
                        placeholder="e.g. 1.5"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        isRequired
                        endContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              %
                            </span>
                          </div>
                        }
                      />
                      <Input
                        type="number"
                        label="New Loan Terms"
                        placeholder="Number of months"
                        value={newLoanTerms}
                        onChange={(e) => setNewLoanTerms(e.target.value)}
                        isRequired
                        endContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              months
                            </span>
                          </div>
                        }
                      />
                      <Select
                        label="Payment Scheme"
                        placeholder="Select payment frequency"
                        selectedKeys={paymentScheme ? [paymentScheme] : []}
                        onChange={(e) => setPaymentScheme(e.target.value)}
                        isRequired
                      >
                        {paymentSchemes.map((scheme) => (
                          <SelectItem key={scheme.value}>
                            {scheme.label}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        type="date"
                        label="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        isRequired
                      />
                    </div>
                    <Textarea
                      label="Restructuring Notes"
                      placeholder="Enter information about the reason for restructuring"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      minRows={3}
                      isRequired
                    />
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button
                color={
                  selectedTab === "default"
                    ? "warning"
                    : selectedTab === "complete"
                      ? "success"
                      : "primary"
                }
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={selectedTab === "complete" && !allPaymentsMade}
              >
                {selectedTab === "default"
                  ? "Mark as Defaulted"
                  : selectedTab === "complete"
                    ? "Mark as Completed"
                    : "Restructure Loan"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
