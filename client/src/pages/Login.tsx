import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, useTheme, useMediaQuery } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: isDesktop ? 'row' : 'column', bgcolor: 'background.default' }}>
      <Box
        sx={{
          flex: isDesktop ? 1 : 'none',
          py: isDesktop ? 0 : 4,
          bgcolor: 'primary.dark',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <FilterAltIcon sx={{ fontSize: isDesktop ? 64 : 40, color: 'primary.main' }} />
        <Typography
          variant={isDesktop ? 'h3' : 'h5'}
          sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: 'common.white', textAlign: 'center' }}
        >
          Webhook Trapper
        </Typography>
        <Typography
          variant="body1"
          sx={{ fontFamily: 'Inter, sans-serif', color: 'primary.main', mt: 1, textAlign: 'center', px: 4 }}
        >
          Capture, inspect &amp; route webhooks in real time
        </Typography>
      </Box>

      <Box sx={{ flex: isDesktop ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 6 } }}>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: 400,
            width: '100%',
            p: 5,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, textAlign: 'center', mb: 1 }}
          >
            Sign In
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Username"
            size="medium"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !username || !password}
            sx={{ mt: 1, py: 1.2 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
