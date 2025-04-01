"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { SearchIcon } from "@heroui/shared-icons";
import { Spinner } from "@heroui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type SortDescriptor = {
  column: string;
  direction: "ascending" | "descending";
};

export default function ClientList() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "lastName",
    direction: "ascending",
  });

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Listen for client-added event to refresh the client list
    const handleClientAdded = () => {
      fetchClients();
    };

    document.addEventListener("client-added", handleClientAdded);

    return () => {
      document.removeEventListener("client-added", handleClientAdded);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        `${client.firstName} ${client.lastName}`
          .toLowerCase()
          .includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.phone && client.phone.includes(query)) ||
        (client.city && client.city.toLowerCase().includes(query)) ||
        (client.state && client.state.toLowerCase().includes(query))
    );
    setFilteredClients(filtered);
    setPage(1); // Reset to first page when filtering
  }, [searchQuery, clients]);

  const handleViewDetails = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  // Export data to CSV
  const exportToCsv = useCallback(() => {
    if (filteredClients.length === 0) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Zip Code",
      "Notes",
    ];
    const csvRows = [headers.join(",")];

    filteredClients.forEach((client) => {
      const values = [
        `"${client.firstName} ${client.lastName}"`,
        `"${client.email}"`,
        `"${client.phone || ""}"`,
        `"${client.address || ""}"`,
        `"${client.city || ""}"`,
        `"${client.state || ""}"`,
        `"${client.zipCode || ""}"`,
        `"${client.notes?.replace(/"/g, '""') || ""}"`,
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clients-${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredClients]);

  // Compute sorted and paginated items
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      const first =
        sortDescriptor.column === "name"
          ? `${a.lastName} ${a.firstName}`
          : sortDescriptor.column === "location"
            ? a.city && a.state
              ? `${a.city}, ${a.state}`
              : a.city || a.state || ""
            : (a[sortDescriptor.column as keyof Client] as string) || "";

      const second =
        sortDescriptor.column === "name"
          ? `${b.lastName} ${b.firstName}`
          : sortDescriptor.column === "location"
            ? b.city && b.state
              ? `${b.city}, ${b.state}`
              : b.city || b.state || ""
            : (b[sortDescriptor.column as keyof Client] as string) || "";

      const cmp = first.localeCompare(second);

      return sortDescriptor.direction === "ascending" ? cmp : -cmp;
    });
  }, [filteredClients, sortDescriptor]);

  // Calculate pagination values
  const pages = Math.ceil(sortedClients.length / rowsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedClients.slice(start, end);
  }, [page, sortedClients, rowsPerPage]);

  // Handle sort change
  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortDescriptor.column !== columnKey) return null;

    return sortDescriptor.direction === "ascending" ? (
      <svg
        className="text-primary w-4 h-4 ml-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M8 16L12 12L16 16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg
        className="text-primary w-4 h-4 ml-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M8 12L12 16L16 12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setPage(1); // Reset to first page
  };

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardBody>
          <div className="flex justify-center items-center py-12">
            <Spinner
              size="lg"
              color="primary"
              labelColor="primary"
              label="Loading clients..."
            />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-sm border-1 border-danger-100">
        <CardBody>
          <div className="text-center text-danger py-8">
            <div className="text-xl mb-2">Error</div>
            <div>{error}</div>
            <Button
              color="primary"
              variant="flat"
              className="mt-4"
              onPress={() => fetchClients()}
            >
              Try Again
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<SearchIcon className="text-default-400" />}
              classNames={{
                inputWrapper: "bg-default-100",
              }}
              className="max-w-full sm:max-w-xs"
              size="sm"
            />
            <div className="flex items-center gap-3 ml-auto">
              <Chip variant="flat" color="primary">
                {filteredClients.length}{" "}
                {filteredClients.length === 1 ? "Client" : "Clients"}
              </Chip>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  variant="light"
                  size="sm"
                  onPress={fetchClients}
                  className="min-w-0 px-3"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="ml-1">Refresh</span>
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  onPress={exportToCsv}
                  className="min-w-0 px-3"
                  isDisabled={filteredClients.length === 0}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="ml-1">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {clients.length === 0 ? (
          <CardBody>
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <svg
                  className="w-16 h-16 text-default-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-xl font-medium mb-2">No clients yet</div>
              <div className="text-default-500 mb-6">
                Add your first client to get started
              </div>
              <div className="flex justify-center">
                <Button
                  color="primary"
                  variant="shadow"
                  size="lg"
                  onClick={() =>
                    document.dispatchEvent(new CustomEvent("add-client-click"))
                  }
                >
                  Add Your First Client
                </Button>
              </div>
            </div>
          </CardBody>
        ) : filteredClients.length === 0 ? (
          <CardBody>
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <svg
                  className="w-12 h-12 text-default-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-lg mb-2">No matching clients</div>
              <div className="text-default-500">
                Try a different search term
              </div>
            </div>
          </CardBody>
        ) : (
          <CardBody className="p-0">
            <Table
              aria-label="Clients table"
              classNames={{
                wrapper: "shadow-none",
                table: "min-h-[400px]",
                thead: "bg-default-50",
                th: "text-default-600 font-semibold text-xs",
              }}
              selectionMode="single"
              sortDescriptor={{
                column: sortDescriptor.column,
                direction: sortDescriptor.direction,
              }}
              onSortChange={(key) => {
                // Convert Key to SortDescriptor
                const column = String(key);
                handleSortChange({
                  column,
                  direction:
                    sortDescriptor.column === column &&
                    sortDescriptor.direction === "ascending"
                      ? "descending"
                      : "ascending",
                });
              }}
            >
              <TableHeader>
                <TableColumn key="name" allowsSorting>
                  <div className="flex items-center">
                    NAME {renderSortIcon("name")}
                  </div>
                </TableColumn>
                <TableColumn key="email" allowsSorting>
                  <div className="flex items-center">
                    EMAIL {renderSortIcon("email")}
                  </div>
                </TableColumn>
                <TableColumn key="phone" allowsSorting>
                  <div className="flex items-center">
                    PHONE {renderSortIcon("phone")}
                  </div>
                </TableColumn>
                <TableColumn key="location" allowsSorting>
                  <div className="flex items-center">
                    LOCATION {renderSortIcon("location")}
                  </div>
                </TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No clients found">
                {paginatedClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer border-b border-divider hover:bg-default-50"
                  >
                    <TableCell>
                      <div className="font-medium">{`${client.firstName} ${client.lastName}`}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-default-500">{client.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-default-600">
                        {client.phone || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-default-600">
                        {client.city && client.state
                          ? `${client.city}, ${client.state}`
                          : client.city || client.state || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          isIconOnly
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() => handleViewDetails(client.id)}
                          className="min-w-0"
                          title="View client details"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Button>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              color="default"
                              variant="light"
                              size="sm"
                              className="min-w-0"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Client actions">
                            <DropdownItem
                              key="view"
                              onPress={() => handleViewDetails(client.id)}
                              startContent={
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              }
                            >
                              View Details
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              }
                            >
                              Edit Client
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              }
                            >
                              Delete Client
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-small text-default-500">
                  Rows per page:
                </span>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      size="sm"
                      className="min-w-[70px] h-8"
                    >
                      {rowsPerPage}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Rows per page"
                    selectionMode="single"
                    selectedKeys={new Set([rowsPerPage.toString()])}
                    onAction={(key) => {
                      handleRowsPerPageChange(Number(key));
                    }}
                  >
                    <DropdownItem key="5">5</DropdownItem>
                    <DropdownItem key="10">10</DropdownItem>
                    <DropdownItem key="15">15</DropdownItem>
                    <DropdownItem key="20">20</DropdownItem>
                    <DropdownItem key="25">25</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {pages > 1 && (
                <Pagination
                  total={pages}
                  page={page}
                  onChange={setPage}
                  showControls
                  showShadow
                  color="primary"
                  size="sm"
                />
              )}

              <div className="text-small text-default-500 hidden sm:block">
                Showing {(page - 1) * rowsPerPage + 1} to{" "}
                {Math.min(page * rowsPerPage, sortedClients.length)} of{" "}
                {sortedClients.length} clients
              </div>
            </div>
          </CardBody>
        )}
      </Card>
    </div>
  );
}
