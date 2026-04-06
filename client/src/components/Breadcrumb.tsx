import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const navigate = useNavigate();

  return (
    <Box sx={(theme) => ({ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 1 })}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && ' > '}
          {item.path ? (
            <Typography
              component="span"
              onClick={() => navigate(item.path!)}
              sx={{ fontSize: 'inherit', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            >
              {item.label.toUpperCase()}
            </Typography>
          ) : (
            <Typography component="span" sx={{ fontSize: 'inherit' }}>
              {item.label.toUpperCase()}
            </Typography>
          )}
        </span>
      ))}
    </Box>
  );
}
