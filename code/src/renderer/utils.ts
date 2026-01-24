export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateRange(startDate?: string | Date, endDate?: string | Date): string {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (!start && !end) return 'Not set';
  if (!start && end) return `until ${formatDate(end)}`;
  if (!end && start) return `from ${formatDate(start)}`;

  // At this point, both start and end are non-null
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  if (start!.getFullYear() === end!.getFullYear()) {
    return `${start!.toLocaleDateString('en-US', options)} - ${end!.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  }

  return `${start!.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end!.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
