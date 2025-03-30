"use client";

import { useCurrency } from "@/app/hooks/useCurrency";
import { availableCurrencies, defaultCurrencyConfig } from "@/config/currency";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { currencyConfig, updateCurrency, resetCurrency } = useCurrency();
  const [formValues, setFormValues] = useState(currencyConfig);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Update the form when currency settings change
  useEffect(() => {
    setFormValues(currencyConfig);
  }, [currencyConfig]);

  const handleCurrencyChange = (key: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectCurrency = (currencyCode: string) => {
    const selectedCurrency = availableCurrencies.find(
      (c) => c.code === currencyCode
    );

    if (selectedCurrency) {
      setFormValues((prev) => ({
        ...prev,
        code: selectedCurrency.code,
        locale: selectedCurrency.locale,
        symbol: selectedCurrency.symbol,
      }));
    }
  };

  const handleSaveSettings = () => {
    try {
      updateCurrency(formValues);
      setMessage({
        text: "Currency settings saved successfully!",
        type: "success",
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      setMessage({
        text: "Error saving currency settings",
        type: "error",
      });
    }
  };

  const handleResetToDefaults = () => {
    setFormValues({ ...defaultCurrencyConfig });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Application Settings</h1>

      <Card className="mb-8">
        <CardHeader className="border-b border-divider">
          <h2 className="text-lg font-medium">Currency Settings</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          <Select
            label="Currency"
            placeholder="Select a currency"
            selectedKeys={[formValues.code]}
            onChange={(e) => handleSelectCurrency(e.target.value)}
            className="max-w-xs"
          >
            {availableCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.name} ({currency.symbol})
              </SelectItem>
            ))}
          </Select>

          <Divider className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Currency Code"
              value={formValues.code}
              onChange={(e) => handleCurrencyChange("code", e.target.value)}
            />

            <Input
              label="Currency Symbol"
              value={formValues.symbol}
              onChange={(e) => handleCurrencyChange("symbol", e.target.value)}
            />

            <Input
              label="Locale"
              value={formValues.locale}
              onChange={(e) => handleCurrencyChange("locale", e.target.value)}
            />

            <div className="flex gap-4">
              <Input
                type="number"
                min="0"
                max="10"
                label="Min Fraction Digits"
                value={formValues.minimumFractionDigits.toString()}
                onChange={(e) =>
                  handleCurrencyChange(
                    "minimumFractionDigits",
                    parseInt(e.target.value)
                  )
                }
              />

              <Input
                type="number"
                min="0"
                max="10"
                label="Max Fraction Digits"
                value={formValues.maximumFractionDigits.toString()}
                onChange={(e) =>
                  handleCurrencyChange(
                    "maximumFractionDigits",
                    parseInt(e.target.value)
                  )
                }
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              color="default"
              variant="flat"
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </Button>
            <Button color="danger" variant="flat" onClick={resetCurrency}>
              Apply Defaults
            </Button>
            <Button color="primary" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>

          {message.text && (
            <div
              className={`mt-4 p-3 rounded ${message.type === "success" ? "bg-success-100 text-success-700" : "bg-danger-100 text-danger-700"}`}
            >
              {message.text}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
