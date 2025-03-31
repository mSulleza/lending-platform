"use client";

import { useCurrency } from "@/app/hooks/useCurrency";
import { availableCurrencies } from "@/config/currency";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";

export default function CurrencySettings() {
  const { currencyConfig, updateCurrency } = useCurrency();

  // Apply currency change and update UI
  const handleCurrencyChange = (currencyCode: string) => {
    const currency = availableCurrencies.find((c) => c.code === currencyCode);

    if (currency) {
      updateCurrency({
        code: currency.code,
        locale: currency.locale,
        symbol: currency.symbol,
      });
    }
  };

  const selectedCurrencyObj = availableCurrencies.find(
    (c) => c.code === currencyConfig.code
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center gap-x-1.5 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
          <span>{selectedCurrencyObj?.symbol}</span>
          {currencyConfig.code}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {availableCurrencies.map((currency) => (
              <Menu.Item key={currency.code}>
                {({ active }) => (
                  <button
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`
                      ${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}
                      ${currency.code === currencyConfig.code ? 'bg-primary-50 dark:bg-primary-900/20 text-primary' : ''}
                      group flex w-full items-center justify-between px-4 py-2 text-sm
                    `}
                  >
                    <span>{currency.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{currency.symbol}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
