function formatISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayISODate(): string {
  return formatISODate(new Date())
}

// Mirrors dofusin-api/src/lib/date.ts — used by MockApiClient's
// deactivateAvailabilities/deactivateJobAvailabilities to match the real
// API's "restamp to yesterday" behavior exactly.
export function yesterdayISODate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatISODate(yesterday)
}
