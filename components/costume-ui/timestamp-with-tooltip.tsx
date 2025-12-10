import Tooltip from './tooltip'
import { formatTimestamp, formatTimestampLong } from '@/utils/formatTime'

type Props = {
  timestamp: string
  className?: string
}

export default function TimestampWithTooltip({ timestamp, className }: Props) {
  return (
    <Tooltip variant='description' content={formatTimestampLong(timestamp)} className='w-fit!'>
      <span className={className}>{formatTimestamp(timestamp)}</span>
    </Tooltip>
  )
}
