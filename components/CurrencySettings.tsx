"use client";

import { useCurrency } from "@/app/hooks/useCurrency";
import { availableCurrencies } from "@/config/currency";
import { Button } from "@nextui-org/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/dropdown";
import { useCallback } from "react";

export default function CurrencySettings() {
  const { currencyConfig, updateCurrency } = useCurrency();

  // Apply currency change and update UI
  const handleCurrencyChange = useCallback(
    (currencyCode: string) => {
      const currency = availableCurrencies.find((c) => c.code === currencyCode);

      if (currency) {
        updateCurrency({
          code: currency.code,
          locale: currency.locale,
          symbol: currency.symbol,
        });
      }
    },
    [updateCurrency]
  );

  const selectedCurrencyObj = availableCurrencies.find(
    (c) => c.code === currencyConfig.code
  );

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="light"
          size="sm"
          startContent={<span>{selectedCurrencyObj?.symbol}</span>}
        >
          {currencyConfig.code}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Currency Options"
        onAction={(key) => handleCurrencyChange(key as string)}
        selectedKeys={[currencyConfig.code]}
        selectionMode="single"
      >
        {availableCurrencies.map((currency) => (
          <DropdownItem key={currency.code}>
            <div className="flex items-center justify-between w-full">
              <span>{currency.name}</span>
              <span className="text-default-500">{currency.symbol}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
