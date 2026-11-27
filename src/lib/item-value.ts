const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatValue(value: number) {
  return '$' + formatter.format(value);
}

export function priceRange(min: number | null, max: number | null) {
  if (min !== null && max !== null && min !== max) {
    return `${formatValue(min)} – ${formatValue(max)}`;
  }
  const onlyValue = min ?? max;
  return onlyValue === null ? 'Unknown' : formatValue(onlyValue);
}
