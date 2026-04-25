import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { keyframes } from '@mui/system';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const driftA = keyframes`
  0%   { transform: translate(0, 0); }
  50%  { transform: translate(60px, -40px); }
  100% { transform: translate(0, 0); }
`;

const driftB = keyframes`
  0%   { transform: translate(0, 0); }
  50%  { transform: translate(-50px, 30px); }
  100% { transform: translate(0, 0); }
`;

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(8,15,28,0.7)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.92rem',
    borderRadius: '8px',
    '& fieldset': { borderColor: 'rgba(166,200,255,0.13)' },
    '&:hover fieldset': { borderColor: 'rgba(166,200,255,0.32)' },
    '&.Mui-focused fieldset': {
      borderColor: '#a6c8ff',
      boxShadow: '0 0 0 3px rgba(166,200,255,0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.85rem',
    color: 'rgba(166,200,255,0.45)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#a6c8ff',
  },
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.post('/auth/login', { username, password });
      localStorage.setItem('trapper_token', resp.data.token);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0b1323',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Grid background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(166%2C200%2C255%2C0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Orb A */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(49,146,252,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: `${driftA} 18s ease-in-out infinite`,
        }}
      />

      {/* Orb B */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(81,223,142,0.14) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: `${driftB} 22s ease-in-out infinite`,
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
        }}
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: 'relative',
            maxWidth: 460,
            width: '100%',
            p: { xs: 3.5, md: 5 },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            background: 'rgba(20,27,44,0.75)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(166,200,255,0.13)',
            boxShadow: '0 0 0 1px rgba(166,200,255,0.05), 0 32px 64px rgba(0,0,0,0.55)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '8%',
              right: '8%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(166,200,255,0.55), transparent)',
              borderRadius: '1px',
            },
          }}
        >
          {/* Icon badge row */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', mb: 0.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #1e3a6e 0%, #0d1929 100%)',
                border: '1px solid rgba(166,200,255,0.3)',
                borderRadius: '12px',
                boxShadow: '0 0 0 4px rgba(166,200,255,0.07), 0 0 20px rgba(166,200,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilterAltIcon sx={{ fontSize: 26, color: '#a6c8ff' }} />
            </Box>
            <Typography
              sx={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: { xs: '1.55rem', md: '1.75rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                background: 'linear-gradient(90deg, #a6c8ff 0%, #51df8e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WEBHOOK TRAPPER
            </Typography>
          </Box>

          {/* Tagline */}
          <Typography
            sx={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem',
              color: 'rgba(166,200,255,0.45)',
              letterSpacing: '0.06em',
              mt: -1,
            }}
          >
            ▸ capture · inspect · route · replay
          </Typography>

          {/* Scan-line divider */}
          <Box
            sx={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(166,200,255,0.1), transparent)',
              my: 0.5,
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Username"
            size="medium"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
            sx={textFieldSx}
          />
          <TextField
            label="Password"
            type="password"
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
            sx={textFieldSx}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !username || !password}
            sx={{
              mt: 0.5,
              py: 1.4,
              borderRadius: '8px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              background: 'linear-gradient(90deg, #3192fc 0%, #51df8e 100%)',
              color: '#0b1323',
              boxShadow: '0 4px 20px rgba(81,223,142,0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(90deg, #4aa3ff 0%, #66e8a0 100%)',
                boxShadow: '0 6px 28px rgba(81,223,142,0.35)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                background: 'rgba(166,200,255,0.1)',
                color: 'rgba(166,200,255,0.25)',
                boxShadow: 'none',
              },
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </Button>
        </Paper>
      </Box>

      {/* Footer */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.68rem',
          color: 'rgba(166,200,255,0.2)',
          letterSpacing: '0.08em',
          zIndex: 1,
        }}
      >
        WEBHOOK TRAPPER · secure local gateway
      </Typography>
    </Box>
  );
}
