import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: 'SENT' | 'FILTERED' | 'REJECTED' | 'active' | 'paused';
}

const colorMap = {
  SENT: 'success',
  FILTERED: 'warning',
  REJECTED: 'error',
  active: 'success',
  paused: 'default',
} as const;

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Chip
      label={status}
      size="small"
      color={colorMap[status]}
      sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}
    />
  );
}
