import { format, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'yyyy/MM/dd', { locale: ja })
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ja })
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}
