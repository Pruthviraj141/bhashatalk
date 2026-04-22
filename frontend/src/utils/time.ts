export function formatTime(isoLike: string | undefined): string {
  if (!isoLike) return ''
  const date = new Date(isoLike)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatConversationTime(isoLike: string | undefined): string {
  if (!isoLike) return ''
  const date = new Date(isoLike)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
