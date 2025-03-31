"use client";

import { getCurrencyConfig } from "@/config/currency";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Define Client type since it's not exported directly
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AddScheduleFormProps {
  onSuccess: () => void;
}

const paymentSchemes = [
  { label: "Weekly", value: "weekly" },
  { label: "Bi-weekly", value: "bi-weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
];

export default function AddScheduleForm({ onSuccess }: AddScheduleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [formData, setFormData] = useState({
    clientId: "",
    loanAmount: "",
    serviceCharge: "",
    monthlyInterest: "",
    loanTerms: "",
    paymentScheme: "",
    startDate: "",
  });

  // Load currency configuration
  useEffect(() => {
    const config = getCurrencyConfig();
    setCurrencySymbol(config.symbol);

    // Listen for currency changes
    const handleCurrencyChange = () => {
      const updatedConfig = getCurrencyConfig();
      setCurrencySymbol(updatedConfig.symbol);
    };

    window.addEventListener("currency-changed", handleCurrencyChange);

    return () => {
      window.removeEventListener("currency-changed", handleCurrencyChange);
    };
  }, []);

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user fixes the field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user fixes the field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
    }

    if (!formData.loanAmount) {
      newErrors.loanAmount = "Loan amount is required";
    } else if (
      isNaN(parseFloat(formData.loanAmount)) ||
      parseFloat(formData.loanAmount) <= 0
    ) {
      newErrors.loanAmount = "Please enter a valid loan amount";
    }

    if (
      formData.serviceCharge &&
      (isNaN(parseFloat(formData.serviceCharge)) ||
        parseFloat(formData.serviceCharge) < 0)
    ) {
      newErrors.serviceCharge = "Please enter a valid service charge amount";
    }

    if (!formData.monthlyInterest) {
      newErrors.monthlyInterest = "Monthly interest is required";
    } else if (
      isNaN(parseFloat(formData.monthlyInterest)) ||
      parseFloat(formData.monthlyInterest) < 0 ||
      parseFloat(formData.monthlyInterest) > 100
    ) {
      newErrors.monthlyInterest = "Please enter a valid interest rate (0-100)";
    }

    if (!formData.loanTerms) {
      newErrors.loanTerms = "Loan term is required";
    } else if (
      isNaN(parseInt(formData.loanTerms)) ||
      parseInt(formData.loanTerms) <= 0
    ) {
      newErrors.loanTerms = "Please enter a valid loan term";
    }

    if (!formData.paymentScheme) {
      newErrors.paymentScheme = "Payment scheme is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create loan schedule");
      }

      onSuccess();
      router.refresh();

      // Dispatch a custom event to trigger schedule list refresh
      document.dispatchEvent(new CustomEvent("schedule-added"));
    } catch (error) {
      console.error("Error creating loan schedule:", error);
      setErrors({ form: "Failed to create loan schedule. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="text-danger text-center p-2 mb-4 bg-danger-50 rounded-medium">
          {errors.form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Client"
          name="clientId"
          placeholder="Select a client"
          selectedKeys={formData.clientId ? [formData.clientId] : []}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("clientId", e.target.value)
          }
          isRequired
          variant="bordered"
          color={errors.clientId ? "danger" : "default"}
          errorMessage={errors.clientId}
          labelPlacement="outside"
          className="col-span-2"
          renderValue={(items) => {
            const selectedClient = clients.find(
              (client) => client.id === formData.clientId
            );
            return selectedClient ? (
              <div className="flex items-center gap-2">
                {selectedClient.firstName} {selectedClient.lastName} (
                {selectedClient.email})
              </div>
            ) : null;
          }}
        >
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.firstName} {client.lastName} ({client.email})
            </SelectItem>
          ))}
        </Select>

        <Input
          label="Loan Amount"
          name="loanAmount"
          type="number"
          value={formData.loanAmount}
          onChange={handleChange}
          isInvalid={!!errors.loanAmount}
          errorMessage={errors.loanAmount}
          placeholder="Enter loan amount"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">
                {currencySymbol}
              </span>
            </div>
          }
          min="0"
          required
        />

        <Input
          label="Service Charge (Optional)"
          name="serviceCharge"
          type="number"
          value={formData.serviceCharge}
          onChange={handleChange}
          isInvalid={!!errors.serviceCharge}
          errorMessage={errors.serviceCharge}
          placeholder="Enter service charge amount"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">
                {currencySymbol}
              </span>
            </div>
          }
          min="0"
        />

        <Input
          label="Monthly Interest (%)"
          name="monthlyInterest"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={formData.monthlyInterest}
          onChange={handleChange}
          required
          variant="bordered"
          color={errors.monthlyInterest ? "danger" : "default"}
          errorMessage={errors.monthlyInterest}
          placeholder="1.5"
          labelPlacement="outside"
          endContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">%</span>
            </div>
          }
        />

        <Input
          label="Loan Terms (months)"
          name="loanTerms"
          type="number"
          min="1"
          value={formData.loanTerms}
          onChange={handleChange}
          required
          variant="bordered"
          color={errors.loanTerms ? "danger" : "default"}
          errorMessage={errors.loanTerms}
          placeholder="12"
          labelPlacement="outside"
          endContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">months</span>
            </div>
          }
        />

        <Select
          label="Payment Scheme"
          name="paymentScheme"
          placeholder="Select payment scheme"
          selectedKeys={formData.paymentScheme ? [formData.paymentScheme] : []}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSelectChange("paymentScheme", e.target.value)
          }
          isRequired
          variant="bordered"
          color={errors.paymentScheme ? "danger" : "default"}
          errorMessage={errors.paymentScheme}
          labelPlacement="outside"
        >
          {paymentSchemes.map((scheme) => (
            <SelectItem key={scheme.value} value={scheme.value}>
              {scheme.label}
            </SelectItem>
          ))}
        </Select>

        <Input
          label="Start Date"
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={handleChange}
          required
          variant="bordered"
          color={errors.startDate ? "danger" : "default"}
          errorMessage={errors.startDate}
          labelPlacement="outside"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          color="danger"
          variant="light"
          onPress={onSuccess}
          className="font-medium"
          isDisabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          className="font-medium"
        >
          Create Loan Schedule
        </Button>
      </div>
    </form>
  );
}
