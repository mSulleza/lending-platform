"use client";

import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Spinner } from "@nextui-org/spinner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
}

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Client>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    notes: null,
  });

  const fetchClient = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Client not found");
          return;
        }
        throw new Error("Failed to fetch client");
      }

      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error("Error fetching client:", error);
      setError("Failed to load client details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update client");
      }

      router.push(`/clients/${id}`);
    } catch (error) {
      console.error("Error updating client:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update client. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !formData.id) {
    return (
      <Card>
        <CardBody>
          <div className="text-center text-danger">{error}</div>
          <div className="flex justify-center mt-4">
            <Button color="primary" variant="light" onPress={handleCancel}>
              Back to Clients
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button color="default" variant="light" onPress={handleCancel}>
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Client</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Client Information</h2>
        </CardHeader>
        <CardBody>
          {error && <div className="text-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                variant="bordered"
              />

              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                variant="bordered"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="bordered"
              />

              <Input
                label="Phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                variant="bordered"
              />

              <Input
                label="Address"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                variant="bordered"
                className="md:col-span-2"
              />

              <Input
                label="City"
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                variant="bordered"
              />

              <Input
                label="State"
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                variant="bordered"
              />

              <Input
                label="Zip Code"
                name="zipCode"
                value={formData.zipCode || ""}
                onChange={handleChange}
                variant="bordered"
              />

              <Input
                label="Notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                variant="bordered"
                className="md:col-span-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button color="danger" variant="light" onPress={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
