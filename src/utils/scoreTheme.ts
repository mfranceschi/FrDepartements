/** ratio ∈ [0, 1] */
export function scoreColor(ratio: number): string {
  if (ratio >= 0.85) return 'text-green-600';
  if (ratio >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}

export function barColor(ratio: number): string {
  if (ratio >= 0.85) return 'bg-green-500';
  if (ratio >= 0.6) return 'bg-yellow-400';
  return 'bg-red-400';
}
