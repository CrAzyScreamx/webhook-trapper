import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, textAlign: 'center', mb: 0 }}
        >
          Welcome to Webhook Trapper
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, textAlign: 'center', mb: 1 }}
        >
          Sign In
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          fullWidth
        />

        <Button type="submit" variant="contained" fullWidth disabled={loading || !username || !password}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </Paper>
    </Box>
  );
}
