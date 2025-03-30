export type CurrencyConfig = typeof defaultCurrencyConfig;

/**
 * Default currency configuration 
 */
export const defaultCurrencyConfig = {
  code: 'USD',
  locale: 'en-US',
  symbol: '$',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

// Load from localStorage if available
const loadSavedConfig = (): CurrencyConfig => {
  if (typeof window === 'undefined') {
    return { ...defaultCurrencyConfig };
  }
  
  try {
    const savedConfig = localStorage.getItem('currencyConfig');
    if (savedConfig) {
      return { ...defaultCurrencyConfig, ...JSON.parse(savedConfig) };
    }
  } catch (e) {
    console.error('Error loading currency config from localStorage:', e);
  }
  
  return { ...defaultCurrencyConfig };
};

// This can be modified at runtime to change the currency settings app-wide
let currentCurrencyConfig: CurrencyConfig = loadSavedConfig();

/**
 * Get the current currency configuration
 */
export function getCurrencyConfig(): CurrencyConfig {
  return currentCurrencyConfig;
}

/**
 * Update the currency configuration for the entire app
 */
export function setCurrencyConfig(config: Partial<CurrencyConfig>): CurrencyConfig {
  currentCurrencyConfig = {
    ...currentCurrencyConfig,
    ...config,
  };
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('currencyConfig', JSON.stringify(currentCurrencyConfig));
    } catch (e) {
      console.error('Error saving currency config to localStorage:', e);
    }
  }
  
  return currentCurrencyConfig;
}

/**
 * Reset currency to default configuration
 */
export function resetCurrencyConfig(): CurrencyConfig {
  currentCurrencyConfig = { ...defaultCurrencyConfig };
  
  // Clear from localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('currencyConfig');
    } catch (e) {
      console.error('Error removing currency config from localStorage:', e);
    }
  }
  
  return currentCurrencyConfig;
}

/**
 * List of available currency options for the UI
 */
export const availableCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'en-EU' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', locale: 'fil-PH' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', locale: 'es-MX' },
]; 