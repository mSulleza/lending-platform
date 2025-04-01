"use client";

import { useCurrency } from "@/app/hooks/useCurrency";
import { formatCurrency } from "@/app/utils/formatters";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Input, Select, SelectItem, Switch } from "@nextui-org/react";
import { Slider } from "@nextui-org/slider";
import { Spinner } from "@nextui-org/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import { Tooltip } from "@nextui-org/tooltip";
import { useEffect, useRef, useState } from "react";

interface CashFlowProjection {
  monthKey: string;
  month: string;
  existingReceivables: number;
  potentialPayment: number;
  totalReceivables: number;
  newLoansIssued?: number;
  runningCapital?: number;
}

interface ManualReceivable {
  id: string;
  monthKey: string;
  amount: number;
  description: string;
}

interface RecurringReceivable {
  id: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annually";
  description: string;
  startMonthKey: string;
}

interface CashFlowResponse {
  existingReceivables: { [key: string]: number };
  potentialLoanPayments: Array<{
    date: string;
    amount: number;
    monthKey: string;
  }>;
  cashFlowProjection: CashFlowProjection[];
  loanAmount: number;
  interestRate: number;
  loanTerms: number;
  paymentScheme: string;
  rollingLoans: boolean;
  projectionMonths: number;
  useManualReceivables: boolean;
  receivablesSource: "manual" | "scheduled";
  statistics: {
    totalNewLoans?: number;
    totalPrincipal?: number;
    totalInterest: number;
    totalPayments: number;
    finalCapital?: number;
    interestToLoanRatio: number;
    projectionPeriodMonths: number;
    averageMonthlyLoanIssue?: number;
    averageMonthlyReturn?: number;
    loanPrincipal?: number;
    monthsWithPayments?: number;
  };
}

// Add a new interface for exportable data
interface ExportableData {
  version: string;
  timestamp: string;
  loanParameters: {
    loanAmount: number;
    interestRate: number;
    loanTerms: number;
    paymentScheme: string;
    rollingLoans: boolean;
    projectionPeriod: number;
  };
  manualReceivables: ManualReceivable[];
  recurringReceivables: RecurringReceivable[];
  useManualReceivables: boolean;
}

export default function LoanAdviser() {
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [loanTerms, setLoanTerms] = useState<number>(6);
  const [paymentScheme, setPaymentScheme] = useState<string>("bi-weekly");
  const [rollingLoans, setRollingLoans] = useState<boolean>(false);
  const [projectionPeriod, setProjectionPeriod] = useState<number>(24);
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [statistics, setStatistics] = useState<
    CashFlowResponse["statistics"] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [isParametersExpanded, setIsParametersExpanded] =
    useState<boolean>(true);
  const [useManualReceivables, setUseManualReceivables] =
    useState<boolean>(false);
  const [manualReceivables, setManualReceivables] = useState<
    ManualReceivable[]
  >([]);
  const [recurringReceivables, setRecurringReceivables] = useState<
    RecurringReceivable[]
  >([]);
  const [newReceivable, setNewReceivable] = useState<{
    monthKey: string;
    amount: number;
    description: string;
  }>({
    monthKey: "",
    amount: 0,
    description: "",
  });
  const [newRecurringReceivable, setNewRecurringReceivable] = useState<{
    startMonthKey: string;
    amount: number;
    frequency: "monthly" | "quarterly" | "annually";
    description: string;
  }>({
    startMonthKey: "",
    amount: 0,
    frequency: "monthly",
    description: "",
  });
  const [isReceivablesExpanded, setIsReceivablesExpanded] =
    useState<boolean>(false);
  const [showRecurringForm, setShowRecurringForm] = useState<boolean>(false);
  const { currencyConfig } = useCurrency();

  // Reference for the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paymentSchemes = [
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
  ];

  const fetchProjections = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/cashflow", window.location.origin);
      url.searchParams.append("amount", loanAmount.toString());
      url.searchParams.append("interest", interestRate.toString());
      url.searchParams.append("terms", loanTerms.toString());
      url.searchParams.append("scheme", paymentScheme);
      url.searchParams.append("rolling", rollingLoans.toString());
      url.searchParams.append("period", projectionPeriod.toString());
      url.searchParams.append("useManual", useManualReceivables.toString());

      // Add manual receivables if enabled
      if (useManualReceivables && manualReceivables.length > 0) {
        url.searchParams.append(
          "manualReceivables",
          JSON.stringify(manualReceivables)
        );
      }

      // Add recurring receivables if enabled and available
      if (useManualReceivables && recurringReceivables.length > 0) {
        url.searchParams.append(
          "recurringReceivables",
          JSON.stringify(recurringReceivables)
        );
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch projections");
      }

      const data: CashFlowResponse = await response.json();
      setProjections(data.cashFlowProjection);
      setStatistics(data.statistics);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching projections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjections().then(() => {
      setInitialized(true);
    });
    // Only run this on initial load - further updates will be triggered by button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to reset the recurring receivables form state when the component mounts
  useEffect(() => {
    // Reset the form state for recurring receivables
    setNewRecurringReceivable({
      startMonthKey: "",
      amount: 0,
      frequency: "monthly",
      description: "",
    });
  }, []);

  // Show a loading indicator until initial data is fetched
  if (!initialized && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading Loan Adviser...</p>
      </div>
    );
  }

  // Calculate totals for summary
  const totalExistingReceivables = projections.reduce(
    (sum, month) => sum + month.existingReceivables,
    0
  );
  const totalPotentialPayments = projections.reduce(
    (sum, month) => sum + month.potentialPayment,
    0
  );
  const totalCombined = totalExistingReceivables + totalPotentialPayments;

  // Calculate total new loans that would be issued (for rolling loans)
  const totalNewLoansIssued = rollingLoans
    ? projections.reduce((sum, month) => sum + (month.newLoansIssued || 0), 0)
    : 0;

  const totalCapitalDeployed = totalNewLoansIssued * loanAmount;

  // Calculate monthly averages
  const averageMonthlyReceivables =
    projections.length > 0 ? totalExistingReceivables / projections.length : 0;
  const averageMonthlyWithNewLoan =
    projections.length > 0 ? totalCombined / projections.length : 0;
  const monthlyIncrease = averageMonthlyWithNewLoan - averageMonthlyReceivables;
  const percentageIncrease =
    averageMonthlyReceivables > 0
      ? (monthlyIncrease / averageMonthlyReceivables) * 100
      : 0;

  const handleLoanAmountChange = (value: number) => {
    // Ensure the amount is in increments of 50000
    const roundedValue = Math.round(value / 50000) * 50000;
    setLoanAmount(roundedValue);
  };

  const toggleParameters = () => {
    setIsParametersExpanded(!isParametersExpanded);
  };

  const toggleReceivables = () => {
    // Ensure state changes immediately, important for mobile responsiveness
    setIsReceivablesExpanded((prevState) => !prevState);
  };

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Generate options for the next 36 months
    for (let i = 0; i < 36; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      options.push({
        value: monthKey,
        label: `${monthNames[month]} ${year}`,
      });
    }

    return options;
  };

  const handleAddReceivable = () => {
    if (newReceivable.monthKey && newReceivable.amount > 0) {
      const newItem: ManualReceivable = {
        id: Date.now().toString(),
        ...newReceivable,
      };

      setManualReceivables([...manualReceivables, newItem]);

      // Reset form
      setNewReceivable({
        monthKey: "",
        amount: 0,
        description: "",
      });
    }
  };

  const handleRemoveReceivable = (id: string) => {
    setManualReceivables(manualReceivables.filter((item) => item.id !== id));
  };

  const handleAddRecurringReceivable = () => {
    if (
      newRecurringReceivable.startMonthKey &&
      newRecurringReceivable.amount > 0
    ) {
      console.log("Adding recurring receivable:", newRecurringReceivable);
      const newItem: RecurringReceivable = {
        id: Date.now().toString(),
        ...newRecurringReceivable,
      };

      setRecurringReceivables([...recurringReceivables, newItem]);
      console.log("Updated recurring receivables:", [
        ...recurringReceivables,
        newItem,
      ]);

      // Reset form to default values
      setNewRecurringReceivable({
        startMonthKey: "",
        amount: 0,
        frequency: "monthly",
        description: "",
      });

      // Hide the form after successfully adding
      setShowRecurringForm(false);
    } else {
      console.log(
        "Failed to add receivable - invalid data:",
        newRecurringReceivable
      );
    }
  };

  const handleRemoveRecurringReceivable = (id: string) => {
    console.log("Removing recurring receivable with ID:", id);
    setRecurringReceivables(
      recurringReceivables.filter((item) => item.id !== id)
    );
    console.log(
      "Receivables after removal:",
      recurringReceivables.filter((item) => item.id !== id)
    );

    // Reset the form state to ensure we can add new receivables
    setNewRecurringReceivable({
      startMonthKey: "",
      amount: 0,
      frequency: "monthly",
      description: "",
    });
  };

  const toggleRecurringForm = () => {
    // If we're opening the form, reset the fields
    if (!showRecurringForm) {
      setNewRecurringReceivable({
        startMonthKey: "",
        amount: 0,
        frequency: "monthly",
        description: "",
      });
    }
    setShowRecurringForm(!showRecurringForm);
  };

  // Create dynamic table columns based on rolling loans flag
  const getTableColumns = () => {
    const baseColumns = [
      <TableColumn key="month">Month</TableColumn>,
      <TableColumn key="receivables">
        {useManualReceivables ? "Manual Receivables" : "Scheduled Receivables"}
      </TableColumn>,
      <TableColumn key="potentialPayment">Potential Loan Payment</TableColumn>,
      <TableColumn key="total">Total</TableColumn>,
    ];

    if (rollingLoans) {
      return [
        ...baseColumns,
        <TableColumn key="newLoans">New Loans Issued</TableColumn>,
        <TableColumn key="runningCapital">Running Capital</TableColumn>,
      ];
    }

    return baseColumns;
  };

  // Create dynamic table cells for a row based on rolling loans flag
  const getTableCells = (projection: CashFlowProjection) => {
    const baseCells = [
      <TableCell key="month">{projection.month}</TableCell>,
      <TableCell key="receivables">
        {formatCurrency(projection.existingReceivables)}
      </TableCell>,
      <TableCell key="potentialPayment">
        {formatCurrency(projection.potentialPayment)}
      </TableCell>,
      <TableCell key="total">
        {formatCurrency(projection.totalReceivables)}
      </TableCell>,
    ];

    if (rollingLoans) {
      return [
        ...baseCells,
        <TableCell key="newLoans">
          {projection.newLoansIssued || 0}{" "}
          {projection.newLoansIssued === 1 ? "loan" : "loans"}
          {projection.newLoansIssued
            ? ` (${formatCurrency(projection.newLoansIssued * loanAmount)})`
            : ""}
        </TableCell>,
        <TableCell key="runningCapital">
          {formatCurrency(projection.runningCapital || 0)}
        </TableCell>,
      ];
    }

    return baseCells;
  };

  // Function to handle exporting data
  const handleExportData = () => {
    const exportData: ExportableData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      loanParameters: {
        loanAmount,
        interestRate,
        loanTerms,
        paymentScheme,
        rollingLoans,
        projectionPeriod,
      },
      manualReceivables,
      recurringReceivables,
      useManualReceivables,
    };

    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Format the filename with date
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `loan-configuration-${dateStr}.json`;
    link.href = url;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
  };

  // Function to handle importing data
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as ExportableData;

        // Validate imported data structure
        if (
          !importedData.loanParameters ||
          !("loanAmount" in importedData.loanParameters) ||
          !("interestRate" in importedData.loanParameters) ||
          !("loanTerms" in importedData.loanParameters) ||
          !("paymentScheme" in importedData.loanParameters) ||
          !("rollingLoans" in importedData.loanParameters) ||
          !("projectionPeriod" in importedData.loanParameters)
        ) {
          throw new Error("Invalid configuration file format");
        }

        // Apply imported data to state
        const {
          loanParameters,
          manualReceivables,
          useManualReceivables,
          recurringReceivables,
        } = importedData;

        setLoanAmount(loanParameters.loanAmount);
        setInterestRate(loanParameters.interestRate);
        setLoanTerms(loanParameters.loanTerms);
        setPaymentScheme(loanParameters.paymentScheme);
        setRollingLoans(loanParameters.rollingLoans);
        setProjectionPeriod(loanParameters.projectionPeriod);

        // Only import manual receivables if they exist
        if (Array.isArray(manualReceivables)) {
          setManualReceivables(manualReceivables);
        }

        // Only import recurring receivables if they exist
        if (Array.isArray(recurringReceivables)) {
          setRecurringReceivables(recurringReceivables);
        }

        // Set manual receivables mode if it was enabled in the imported data
        if (typeof useManualReceivables === "boolean") {
          setUseManualReceivables(useManualReceivables);
        }

        // Fetch projections with the new configuration
        fetchProjections();
      } catch (error) {
        setError("Failed to load configuration: Invalid file format");
        console.error("Import error:", error);
      }

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Loan Adviser</h1>

        <ButtonGroup variant="flat">
          <Tooltip content="Import configuration from a file">
            <Button
              color="primary"
              variant="flat"
              onClick={handleImportClick}
              size="sm"
            >
              Import
            </Button>
          </Tooltip>
          <Tooltip content="Export current configuration to a file">
            <Button
              color="primary"
              variant="flat"
              onClick={handleExportData}
              size="sm"
            >
              Export
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: "none" }}
        />
      </div>

      <p className="text-default-500">
        Plan new loans based on current scheduled receivables. See how loans
        will affect your monthly cash flow.
      </p>

      <Card className="bg-default-50 dark:bg-default-50/5">
        <CardHeader
          className="border-b border-divider pb-2 flex justify-between cursor-pointer"
          onClick={toggleParameters}
        >
          <h2 className="text-lg font-medium">Loan Parameters</h2>
          <Button
            isIconOnly
            variant="light"
            aria-label={isParametersExpanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              toggleParameters();
            }}
          >
            {isParametersExpanded ? (
              <span className="text-lg">▲</span>
            ) : (
              <span className="text-lg">▼</span>
            )}
          </Button>
        </CardHeader>
        {isParametersExpanded && (
          <CardBody className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Loan Amount</h3>
                <div className="space-y-4">
                  <Slider
                    size="sm"
                    step={50000}
                    minValue={50000}
                    maxValue={1000000}
                    value={loanAmount}
                    onChange={(value) =>
                      handleLoanAmountChange(value as number)
                    }
                    classNames={{
                      base: "max-w-md",
                    }}
                    renderThumb={(props) => (
                      <div
                        {...props}
                        className="group p-1 top-1/2 bg-primary-500 border-small border-primary-500 shadow-medium rounded-full cursor-grab data-[dragging=true]:cursor-grabbing"
                      >
                        <span className="bg-background shadow-small rounded-full w-3 h-3 block" />
                      </div>
                    )}
                  />
                  <Input
                    type="number"
                    label="Loan Amount"
                    value={loanAmount.toString()}
                    onChange={(e) =>
                      handleLoanAmountChange(parseFloat(e.target.value))
                    }
                    step={50000}
                    min={50000}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          {currencyConfig.symbol}
                        </span>
                      </div>
                    }
                  />
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Projection Period
                  </h3>
                  <div className="space-y-4">
                    <Slider
                      size="sm"
                      step={6}
                      minValue={12}
                      maxValue={60}
                      value={projectionPeriod}
                      onChange={(value) => setProjectionPeriod(value as number)}
                      classNames={{
                        base: "max-w-md",
                      }}
                      renderThumb={(props) => (
                        <div
                          {...props}
                          className="group p-1 top-1/2 bg-primary-500 border-small border-primary-500 shadow-medium rounded-full cursor-grab data-[dragging=true]:cursor-grabbing"
                        >
                          <span className="bg-background shadow-small rounded-full w-3 h-3 block" />
                        </div>
                      )}
                    />
                    <Input
                      type="number"
                      label="Projection Period"
                      value={projectionPeriod.toString()}
                      onChange={(e) =>
                        setProjectionPeriod(parseInt(e.target.value))
                      }
                      step={6}
                      min={12}
                      max={60}
                      endContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">
                            months
                          </span>
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  type="number"
                  label="Interest Rate (%)"
                  value={interestRate.toString()}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  step="0.1"
                  min="0"
                  max="100"
                  endContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">%</span>
                    </div>
                  }
                />

                <Input
                  type="number"
                  label="Loan Terms"
                  value={loanTerms.toString()}
                  onChange={(e) => setLoanTerms(parseInt(e.target.value))}
                  step={1}
                  min={1}
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
                  selectedKeys={[paymentScheme]}
                  onChange={(e) => setPaymentScheme(e.target.value)}
                >
                  {paymentSchemes.map((scheme) => (
                    <SelectItem key={scheme.value} value={scheme.value}>
                      {scheme.label}
                    </SelectItem>
                  ))}
                </Select>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm">Rolling Loans</span>
                  <Switch
                    isSelected={rollingLoans}
                    onValueChange={setRollingLoans}
                    size="sm"
                    color="success"
                  />
                </div>
                {rollingLoans && (
                  <div className="bg-success-50 dark:bg-success-900/20 p-2 rounded-lg text-xs">
                    Rolling loans will automatically create new loans when the
                    accumulated receivables reach {currencyConfig.symbol}50,000.
                  </div>
                )}
              </div>
            </div>

            <Button
              color="primary"
              className="mt-4"
              onClick={fetchProjections}
              isLoading={loading}
            >
              Generate Projection
            </Button>
          </CardBody>
        )}
      </Card>

      {/* Receivables Configuration Card */}
      <Card className="bg-default-50 dark:bg-default-50/5">
        <CardHeader 
          className="border-b border-divider pb-2 flex justify-between cursor-pointer"
          onClick={toggleReceivables}
        >
          <h2 className="text-lg font-medium">Receivables Configuration</h2>
          <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-default-500">
              {useManualReceivables ? "Manual" : "Scheduled"}
            </span>
            <Switch
              isSelected={useManualReceivables}
              onValueChange={setUseManualReceivables}
              size="sm"
              color="primary"
            />
            <Button
              isIconOnly
              variant="light"
              aria-label={isReceivablesExpanded ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                toggleReceivables();
              }}
              className="p-2 touch-manipulation min-w-[40px] min-h-[40px]"
            >
              {isReceivablesExpanded ? (
                <span className="text-lg">▲</span>
              ) : (
                <span className="text-lg">▼</span>
              )}
            </Button>
          </div>
        </CardHeader>

        {isReceivablesExpanded && (
          <CardBody className="py-4">
            {useManualReceivables ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Manual Receivables</h3>
                  <p className="text-xs text-default-500">
                    Add hypothetical receivables to your cash flow projections
                  </p>
                </div>

                {/* Add new receivable form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <Select
                    label="Month"
                    placeholder="Select month"
                    value={newReceivable.monthKey}
                    onChange={(e) =>
                      setNewReceivable({
                        ...newReceivable,
                        monthKey: e.target.value,
                      })
                    }
                  >
                    {generateMonthOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    type="number"
                    label="Amount"
                    placeholder="Enter amount"
                    min={0}
                    value={newReceivable.amount.toString()}
                    onChange={(e) =>
                      setNewReceivable({
                        ...newReceivable,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">
                          {currencyConfig.symbol}
                        </span>
                      </div>
                    }
                  />

                  <Input
                    label="Description (optional)"
                    placeholder="e.g., Off-cycle payment"
                    value={newReceivable.description}
                    onChange={(e) =>
                      setNewReceivable({
                        ...newReceivable,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    onClick={handleAddReceivable}
                    disabled={
                      !newReceivable.monthKey || newReceivable.amount <= 0
                    }
                  >
                    Add Receivable
                  </Button>
                </div>

                {/* List of manual receivables */}
                {manualReceivables.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Added Receivables
                    </h4>
                    <div className="overflow-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-default-100 dark:bg-default-200/20">
                            <th className="px-3 py-2 text-left text-xs">
                              Month
                            </th>
                            <th className="px-3 py-2 text-left text-xs">
                              Amount
                            </th>
                            <th className="px-3 py-2 text-left text-xs">
                              Description
                            </th>
                            <th className="px-3 py-2 text-right text-xs">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualReceivables.map((item) => {
                            const monthYear = item.monthKey.split("-");
                            const month = parseInt(monthYear[1]) - 1;
                            const year = monthYear[0];
                            const monthNames = [
                              "January",
                              "February",
                              "March",
                              "April",
                              "May",
                              "June",
                              "July",
                              "August",
                              "September",
                              "October",
                              "November",
                              "December",
                            ];
                            const displayMonth = `${monthNames[month]} ${year}`;

                            return (
                              <tr
                                key={item.id}
                                className="border-t border-divider"
                              >
                                <td className="px-3 py-2 text-sm">
                                  {displayMonth}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {item.description || "-"}
                                </td>
                                <td className="px-3 py-2 text-sm text-right">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onClick={() =>
                                      handleRemoveReceivable(item.id)
                                    }
                                    aria-label="Remove receivable"
                                  >
                                    X
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-default-400 text-sm">
                    No manual receivables added yet
                  </div>
                )}

                {/* Recurring Receivables Section */}
                <div className="mt-8">
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">
                        Recurring Capital Injections
                      </h3>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={toggleRecurringForm}
                      >
                        {showRecurringForm ? "Cancel" : "Add Recurring"}
                      </Button>
                    </div>
                    <p className="text-xs text-default-500">
                      Set up regular capital additions that repeat automatically
                    </p>
                  </div>

                  {/* Add new recurring receivable form */}
                  {showRecurringForm && (
                    <div className="border border-default-200 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Select
                          label="Start Month"
                          placeholder="Select start month"
                          selectedKeys={
                            newRecurringReceivable.startMonthKey
                              ? [newRecurringReceivable.startMonthKey]
                              : []
                          }
                          onChange={(e) =>
                            setNewRecurringReceivable({
                              ...newRecurringReceivable,
                              startMonthKey: e.target.value,
                            })
                          }
                        >
                          {generateMonthOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>

                        <Select
                          label="Frequency"
                          placeholder="Select frequency"
                          selectedKeys={[newRecurringReceivable.frequency]}
                          onChange={(e) =>
                            setNewRecurringReceivable({
                              ...newRecurringReceivable,
                              frequency: e.target.value as
                                | "monthly"
                                | "quarterly"
                                | "annually",
                            })
                          }
                        >
                          <SelectItem key="monthly" value="monthly">
                            Monthly
                          </SelectItem>
                          <SelectItem key="quarterly" value="quarterly">
                            Quarterly (every 3 months)
                          </SelectItem>
                          <SelectItem key="annually" value="annually">
                            Annually (once a year)
                          </SelectItem>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input
                          type="number"
                          label="Amount"
                          placeholder="Enter amount"
                          min={0}
                          value={
                            newRecurringReceivable.amount > 0
                              ? newRecurringReceivable.amount.toString()
                              : ""
                          }
                          onChange={(e) =>
                            setNewRecurringReceivable({
                              ...newRecurringReceivable,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">
                                {currencyConfig.symbol}
                              </span>
                            </div>
                          }
                        />

                        <Input
                          label="Description (optional)"
                          placeholder="e.g., Monthly capital contribution"
                          value={newRecurringReceivable.description}
                          onChange={(e) =>
                            setNewRecurringReceivable({
                              ...newRecurringReceivable,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          color="primary"
                          onClick={handleAddRecurringReceivable}
                          disabled={
                            !newRecurringReceivable.startMonthKey ||
                            newRecurringReceivable.amount <= 0
                          }
                        >
                          Add Recurring Receivable
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* List of recurring receivables */}
                  {recurringReceivables.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Recurring Capital Injections
                      </h4>
                      <div className="overflow-auto">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-default-100 dark:bg-default-200/20">
                              <th className="px-3 py-2 text-left text-xs">
                                Start Month
                              </th>
                              <th className="px-3 py-2 text-left text-xs">
                                Amount
                              </th>
                              <th className="px-3 py-2 text-left text-xs">
                                Frequency
                              </th>
                              <th className="px-3 py-2 text-left text-xs">
                                Description
                              </th>
                              <th className="px-3 py-2 text-right text-xs">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recurringReceivables.map((item) => {
                              const monthYear = item.startMonthKey.split("-");
                              const month = parseInt(monthYear[1]) - 1;
                              const year = monthYear[0];
                              const monthNames = [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
                              ];
                              const displayMonth = `${monthNames[month]} ${year}`;

                              return (
                                <tr
                                  key={item.id}
                                  className="border-t border-divider"
                                >
                                  <td className="px-3 py-2 text-sm">
                                    {displayMonth}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {formatCurrency(item.amount)}
                                  </td>
                                  <td className="px-3 py-2 text-sm capitalize">
                                    {item.frequency}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {item.description || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      color="danger"
                                      variant="light"
                                      onClick={() =>
                                        handleRemoveRecurringReceivable(item.id)
                                      }
                                      aria-label="Remove recurring receivable"
                                    >
                                      X
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-default-400 text-sm">
                      No recurring receivables added yet
                    </div>
                  )}
                </div>

                <div className="bg-default-200/50 dark:bg-default-100/10 p-3 rounded-lg mt-2">
                  <p className="text-xs text-default-600">
                    <strong>Note:</strong> Manual and recurring receivables will
                    replace the actual scheduled receivables in your cash flow
                    projection. All values are hypothetical and will be used to
                    calculate potential loan issuance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-default-500">
                  Using actual scheduled receivables from your existing loans.
                </p>
                <p className="text-xs text-default-400 mt-1">
                  Toggle the switch above to use manual receivables instead.
                </p>
              </div>
            )}
          </CardBody>
        )}
      </Card>

      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg text-danger">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Total Summary */}
      <Card>
        <CardHeader className="border-b border-divider pb-2">
          <div className="flex w-full justify-between items-center">
            <h2 className="text-lg font-medium">Cash Flow Summary</h2>
            {statistics && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-default-500">
                  Using {useManualReceivables ? "manual" : "scheduled"}{" "}
                  receivables
                </span>
                {useManualReceivables && (
                  <span className="bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 text-xs px-2 py-1 rounded-full">
                    Hypothetical
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardBody className="py-5">
                <h3 className="text-sm font-medium text-default-500">
                  Current Monthly Receivables (Average)
                </h3>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(averageMonthlyReceivables)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-primary-50 dark:bg-primary-900/20">
              <CardBody className="py-5">
                <h3 className="text-sm font-medium text-default-500">
                  Projected Monthly Receivables{" "}
                  {rollingLoans ? "(With Rolling Loans)" : "(With New Loan)"}
                </h3>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(averageMonthlyWithNewLoan)}
                </p>
              </CardBody>
            </Card>

            <Card
              className={
                percentageIncrease > 30
                  ? "bg-success-50 dark:bg-success-900/20"
                  : percentageIncrease > 10
                    ? "bg-warning-50 dark:bg-warning-900/20"
                    : "bg-danger-50 dark:bg-danger-900/20"
              }
            >
              <CardBody className="py-5">
                <h3 className="text-sm font-medium text-default-500">
                  Monthly Increase
                </h3>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(monthlyIncrease)} (
                  {percentageIncrease.toFixed(1)}
                  %)
                </p>
                <p className="text-xs mt-2">
                  {percentageIncrease > 30
                    ? "Excellent increase in cash flow!"
                    : percentageIncrease > 10
                      ? "Moderate increase in monthly income"
                      : "Low impact on monthly cash flow"}
                </p>
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>

      {/* Financial Statistics */}
      {statistics && (
        <Card className="bg-default-50 dark:bg-default-50/5">
          <CardHeader className="border-b border-divider pb-2">
            <h2 className="text-lg font-medium">Financial Statistics</h2>
          </CardHeader>
          <CardBody className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Interest Statistics */}
              <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-default-600 mb-3">
                  Interest Earnings
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-default-500">
                      Total Interest
                    </span>
                    <span className="font-medium">
                      {formatCurrency(statistics.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-default-500">
                      Interest/Principal Ratio
                    </span>
                    <span className="font-medium">
                      {statistics.interestToLoanRatio.toFixed(2)}%
                    </span>
                  </div>
                  {rollingLoans && statistics.averageMonthlyReturn && (
                    <div className="flex justify-between">
                      <span className="text-xs text-default-500">
                        Avg. Monthly Return
                      </span>
                      <span className="font-medium">
                        {formatCurrency(statistics.averageMonthlyReturn)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Capital Statistics */}
              <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-default-600 mb-3">
                  Capital Overview
                </h3>
                <div className="space-y-2">
                  {rollingLoans ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Total Principal Deployed
                        </span>
                        <span className="font-medium">
                          {formatCurrency(statistics.totalPrincipal || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Final Working Capital
                        </span>
                        <span className="font-medium">
                          {formatCurrency(statistics.finalCapital || 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Loan Principal
                        </span>
                        <span className="font-medium">
                          {formatCurrency(statistics.loanPrincipal || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Total Payments
                        </span>
                        <span className="font-medium">
                          {formatCurrency(statistics.totalPayments)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-default-500">
                      Projection Period
                    </span>
                    <span className="font-medium">
                      {statistics.projectionPeriodMonths} months
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Performance */}
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-default-600 mb-3">
                  Loan Performance
                </h3>
                <div className="space-y-2">
                  {rollingLoans ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Total New Loans
                        </span>
                        <span className="font-medium">
                          {statistics.totalNewLoans}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Avg. Loans per Month
                        </span>
                        <span className="font-medium">
                          {statistics.averageMonthlyLoanIssue?.toFixed(1)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Months with Payments
                        </span>
                        <span className="font-medium">
                          {statistics.monthsWithPayments} of {loanTerms}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-default-500">
                          Monthly Payment
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            statistics.totalPayments /
                              (statistics.monthsWithPayments || 1)
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-default-500">
                      Total Cash Flow
                    </span>
                    <span className="font-medium">
                      {formatCurrency(statistics.totalPayments)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Rolling Loans Summary (only shown when rolling loans is enabled) */}
      {rollingLoans && projections.length > 0 && (
        <Card className="bg-success-50 dark:bg-success-900/20">
          <CardHeader className="border-b border-divider pb-2">
            <h2 className="text-lg font-medium">Rolling Loans Summary</h2>
          </CardHeader>
          <CardBody className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-default-500">
                  New Loans Issued (12 months)
                </h3>
                <p className="text-2xl font-semibold mt-1">
                  {totalNewLoansIssued} loans
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-default-500">
                  Total Capital Deployed
                </h3>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(totalCapitalDeployed)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-default-500">
                  Average Loan Issuance
                </h3>
                <p className="text-2xl font-semibold mt-1">
                  {(totalNewLoansIssued / 12).toFixed(1)} per month
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Loan Coverage Summary (Only show for single loan projections) */}
      {!rollingLoans && (
        <Card className="bg-default-50 dark:bg-default-50/5 mt-4">
          <CardHeader className="border-b border-divider pb-2">
            <h2 className="text-lg font-medium">Loan Term Coverage</h2>
          </CardHeader>
          <CardBody className="py-4">
            {loading ? (
              <div className="flex justify-center items-center py-2">
                <Spinner size="sm" label="Loading coverage data..." />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Loan Term:</span>
                  <span className="font-medium">
                    {loanTerms} months ({paymentScheme})
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Projection Period:</span>
                  <span className="font-medium">
                    {projections.length} months
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">First Payment:</span>
                  <span className="font-medium">
                    {projections.length > 0 ? projections[0].month : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Payment:</span>
                  <span className="font-medium">
                    {projections.length > 0 && loanTerms <= projections.length
                      ? projections[loanTerms - 1].month
                      : projections.length > 0
                        ? projections[projections.length - 1].month
                        : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-medium">
                    Months with Payments:
                  </span>
                  <span className="font-medium">
                    {projections.filter((p) => p.potentialPayment > 0).length}{" "}
                    of {loanTerms}
                  </span>
                </div>
                {projections.length > 0 &&
                  projections.filter((p) => p.potentialPayment > 0).length <
                    loanTerms && (
                    <div className="bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 p-2 rounded-md text-sm mt-2">
                      Note: The projection may not show all loan payments if the
                      loan term exceeds the projection period.
                    </div>
                  )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Projection Table */}
      <Card>
        <CardHeader className="border-b border-divider pb-2">
          <h2 className="text-lg font-medium">
            {rollingLoans ? "Rolling Loans Projection" : "Cash Flow Projection"}
          </h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" label="Loading projections..." />
            </div>
          ) : rollingLoans ? (
            // Rolling Loans Table
            <Table aria-label="Rolling loans projection table">
              <TableHeader>
                <TableColumn>Month</TableColumn>
                <TableColumn>Existing Receivables</TableColumn>
                <TableColumn>New Loan Payments</TableColumn>
                <TableColumn>New Loans Issued</TableColumn>
                <TableColumn>Total Receivables</TableColumn>
                <TableColumn>Running Capital</TableColumn>
              </TableHeader>
              <TableBody>
                {projections.map((projection) => (
                  <TableRow key={projection.monthKey}>
                    <TableCell>{projection.month}</TableCell>
                    <TableCell>
                      {formatCurrency(projection.existingReceivables)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(projection.potentialPayment)}
                    </TableCell>
                    <TableCell>
                      {projection.newLoansIssued || 0}{" "}
                      {projection.newLoansIssued === 1 ? "loan" : "loans"}
                      {projection.newLoansIssued
                        ? ` (${formatCurrency(projection.newLoansIssued * loanAmount)})`
                        : ""}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(projection.totalReceivables)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(projection.runningCapital || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            // Standard Loan Projection Table
            <Table aria-label="Cash flow projection table">
              <TableHeader>{getTableColumns()}</TableHeader>
              <TableBody>
                {projections.map((projection) => (
                  <TableRow key={projection.monthKey}>
                    {getTableCells(projection)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <Button color="primary" onClick={fetchProjections} isLoading={loading}>
          {loading ? "Calculating..." : "Update Projections"}
        </Button>
      </div>
    </div>
  );
}
