"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
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
  createdAt: string;
  updatedAt: string;
}

export default function ClientDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setClient(data);
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

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/clients/${id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this client? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      router.push("/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client. Please try again later.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center text-danger">{error}</div>
          <div className="flex justify-center mt-4">
            <Button color="primary" variant="light" onPress={handleBack}>
              Back to Clients
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card>
        <CardBody>
          <div className="text-center">Client not found</div>
          <div className="flex justify-center mt-4">
            <Button color="primary" variant="light" onPress={handleBack}>
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
          <Button color="default" variant="light" onPress={handleBack}>
            Back
          </Button>
          <h1 className="text-3xl font-bold">{`${client.firstName} ${client.lastName}`}</h1>
        </div>
        <div className="flex gap-2">
          <Button color="primary" onPress={handleEdit}>
            Edit
          </Button>
          <Button color="danger" variant="light" onPress={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Client Information</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-default-500">Name</h3>
              <p>{`${client.firstName} ${client.lastName}`}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-default-500">Email</h3>
              <p>{client.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-default-500">Phone</h3>
              <p>{client.phone || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-default-500">Address</h3>
              <p>{client.address || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-default-500">City</h3>
              <p>{client.city || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-default-500">State</h3>
              <p>{client.state || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-default-500">Zip Code</h3>
              <p>{client.zipCode || "—"}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {client.notes && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Notes</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <p className="whitespace-pre-wrap">{client.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
