import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(81,223,142,0.5); }
  70% { box-shadow: 0 0 0 8px rgba(81,223,142,0); }
  100% { box-shadow: 0 0 0 0 rgba(81,223,142,0); }
`;

export default function LiveDot() {
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: 'secondary.main',
        animation: `${pulse} 1.5s infinite`,
        display: 'inline-block',
      }}
    />
  );
}
