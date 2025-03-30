import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrencyConfig, 
  setCurrencyConfig,
  resetCurrencyConfig,
  CurrencyConfig
} from '@/config/currency';
import { formatCurrency } from '@/app/utils/formatters';

/**
 * Custom hook to use and update currency settings in any component
 */
export function useCurrency() {
  const [currencyConfig, setCurrencyState] = useState<CurrencyConfig>(getCurrencyConfig());
  
  // Update local state when currency changes globally
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrencyState(getCurrencyConfig());
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    
    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);
  
  // Update global currency settings
  const updateCurrency = useCallback((config: Partial<CurrencyConfig>) => {
    const newConfig = setCurrencyConfig(config);
    setCurrencyState(newConfig);
    window.dispatchEvent(new CustomEvent('currency-changed'));
  }, []);
  
  // Reset to defaults
  const resetCurrency = useCallback(() => {
    const defaultConfig = resetCurrencyConfig();
    setCurrencyState(defaultConfig);
    window.dispatchEvent(new CustomEvent('currency-changed'));
  }, []);
  
  // Format a number according to current currency settings
  const format = useCallback((amount: number) => {
    return formatCurrency(amount);
  }, []);
  
  return {
    currencyConfig,
    updateCurrency,
    resetCurrency,
    format
  };
} 