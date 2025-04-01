"use client";

import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { InfoIcon } from "@heroui/shared-icons";
import { Tooltip } from "@heroui/tooltip";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddClientFormProps {
  onSuccess: () => void;
}

export default function AddClientForm({ onSuccess }: AddClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^[0-9()\-\s+]*$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.zipCode && !/^[0-9\-]*$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid zip code";
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
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add client");
      }

      onSuccess();
      router.refresh();

      // Dispatch a custom event to trigger client list refresh
      document.dispatchEvent(new CustomEvent("client-added"));
    } catch (error) {
      console.error("Error adding client:", error);
      setErrors({ form: "Failed to add client. Please try again." });
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
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          variant="bordered"
          color={errors.firstName ? "danger" : "default"}
          errorMessage={errors.firstName}
          placeholder="John"
          labelPlacement="outside"
        />

        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          variant="bordered"
          color={errors.lastName ? "danger" : "default"}
          errorMessage={errors.lastName}
          placeholder="Doe"
          labelPlacement="outside"
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          variant="bordered"
          color={errors.email ? "danger" : "default"}
          errorMessage={errors.email}
          placeholder="john.doe@example.com"
          labelPlacement="outside"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">@</span>
            </div>
          }
        />

        <Input
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          variant="bordered"
          color={errors.phone ? "danger" : "default"}
          errorMessage={errors.phone}
          placeholder="(555) 123-4567"
          labelPlacement="outside"
        />

        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          variant="bordered"
          placeholder="123 Main St"
          labelPlacement="outside"
          className="md:col-span-2"
          endContent={
            <Tooltip content="Street address">
              <InfoIcon className="text-default-400" />
            </Tooltip>
          }
        />

        <Input
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          variant="bordered"
          placeholder="New York"
          labelPlacement="outside"
        />

        <Input
          label="State"
          name="state"
          value={formData.state}
          onChange={handleChange}
          variant="bordered"
          placeholder="NY"
          labelPlacement="outside"
        />

        <Input
          label="Zip Code"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          variant="bordered"
          color={errors.zipCode ? "danger" : "default"}
          errorMessage={errors.zipCode}
          placeholder="10001"
          labelPlacement="outside"
        />

        <Textarea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          variant="bordered"
          placeholder="Additional information about the client"
          labelPlacement="outside"
          className="md:col-span-2"
          minRows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          color="danger"
          variant="light"
          onPress={onSuccess}
          className="font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          className="font-medium"
        >
          Add Client
        </Button>
      </div>
    </form>
  );
}
