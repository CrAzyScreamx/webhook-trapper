import { Paper, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h4" fontFamily="Space Grotesk, sans-serif" fontWeight={700}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}
