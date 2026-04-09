export function formatDynamicCurrency(
    valueInUSD: number, 
    currencyCode: string = 'USD', 
    rates: Record<string, number> = { USD: 1 }
  ) {
    const rate = rates[currencyCode] || 1;
    const convertedValue = valueInUSD * rate;
  
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedValue);
}