export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

export function formatTime(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}${suffix}`;
}

export function waitColor(minutes: number): 'green' | 'orange' | 'red' {
  if (minutes <= 2) return 'red';
  if (minutes <= 6) return 'orange';
  return 'green';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
