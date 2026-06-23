import Tooltip from './tooltip'
import { formatDate, formatTimestamp, formatTimestampLong } from '@/utils/formatTime'

type Props = {
  timestamp: string
  className?: string
  variant?: 'time' | 'date'
}

export default function TimestampWithTooltip({ variant = 'time', timestamp, className }: Props) {
  return (
    <Tooltip variant='description' content={formatTimestampLong(timestamp)} className='w-fit!'>
      <span className={className}>{variant === 'time' ? formatTimestamp(timestamp) : formatDate(timestamp)}</span>
    </Tooltip>
  )
}
