"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";
import AddScheduleForm from "./components/AddScheduleForm";
import ScheduleList from "./components/ScheduleList";

export default function SchedulesPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const handleAddScheduleClick = () => {
      setShowAddForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    document.addEventListener("add-schedule-click", handleAddScheduleClick);
    return () => {
      document.removeEventListener(
        "add-schedule-click",
        handleAddScheduleClick
      );
    };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
            Loan Schedules
          </h1>
          <p className="text-default-500 mt-1">
            Manage loan schedules and payment plans
          </p>
        </div>
        <Button
          color="primary"
          variant={showAddForm ? "flat" : "shadow"}
          size="lg"
          onPress={() => setShowAddForm(!showAddForm)}
          className="font-medium"
        >
          {showAddForm ? "Hide Form" : "Create New Schedule"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-8 shadow-md border-1 border-primary-100 dark:border-primary-900/20">
          <CardHeader className="bg-primary-50 dark:bg-primary-900/10">
            <h2 className="text-xl font-semibold text-primary">
              Create Loan Schedule
            </h2>
          </CardHeader>
          <CardBody className="px-6 py-8">
            <AddScheduleForm onSuccess={() => setShowAddForm(false)} />
          </CardBody>
        </Card>
      )}

      <ScheduleList />
    </div>
  );
}
