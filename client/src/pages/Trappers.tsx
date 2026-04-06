import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Switch, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import HearingIcon from '@mui/icons-material/Hearing';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { trappersApi, Trapper } from '../api/client';

export default function Trappers() {
  const theme = useTheme();
  const [trappers, setTrappers] = useState<Trapper[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', trapId: '', destinationUrl: '' });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = () => trappersApi.list().then(setTrappers);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await trappersApi.create(form);
    setOpen(false);
    setForm({ name: '', description: '', trapId: '', destinationUrl: '' });
    load();
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    await trappersApi.delete(confirmId);
    setConfirmId(null);
    load();
  };

  const handleToggle = async (t: Trapper) => {
    await trappersApi.setStatus(t.id, t.status === 'active' ? 'paused' : 'active');
    load();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: 'text.primary' }}>
            Trappers
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, mt: 0.25 }}>
            {trappers.length} webhook interceptors configured
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.8rem', py: 0.9, px: 2 }}
        >
          New Trapper
        </Button>
      </Stack>

      <Stack gap={1.5}>
        {trappers.map((t) => (
          <Paper
            key={t.id}
            sx={{
              border: `1px solid ${theme.palette.custom.border}`,
              px: 2.5, py: 2,
              display: 'flex', alignItems: 'center', gap: 2,
              '&:hover': { borderColor: theme.palette.custom.hoverBorder, bgcolor: alpha('#ffffff', 0.012) },
              transition: 'all 0.15s',
            }}
          >
            {/* Avatar */}
            <Box sx={{
              width: 40, height: 40, borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.06), border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Typography sx={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 600 }}>
                {t.name.slice(0, 2).toUpperCase()}
              </Typography>
            </Box>

            {/* Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={0.25}>
                <Typography
                  onClick={() => navigate(`/trappers/${t.id}`)}
                  sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.primary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                >
                  {t.name}
                </Typography>
                <Box sx={{
                  px: 0.75, py: 0.15,
                  bgcolor: t.status === 'active' ? alpha(theme.palette.secondary.main, 0.09) : alpha(theme.palette.custom.muted, 0.09),
                  border: `1px solid ${t.status === 'active' ? alpha(theme.palette.secondary.main, 0.2) : alpha(theme.palette.custom.muted, 0.2)}`,
                  borderRadius: 0.5,
                }}>
                  <Typography sx={{ fontSize: '0.55rem', fontFamily: 'JetBrains Mono, monospace', color: t.status === 'active' ? 'secondary.main' : theme.palette.custom.muted, letterSpacing: '0.08em' }}>
                    {t.status.toUpperCase()}
                  </Typography>
                </Box>
              </Stack>
              {t.description && (
                <Typography sx={{ fontSize: '0.72rem', color: theme.palette.custom.muted, mb: 0.25 }}>{t.description}</Typography>
              )}
              <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                POST /api/h/{t.trapId}
              </Typography>
            </Box>

            {/* Destination */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0, maxWidth: 200 }}>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.08em', mb: 0.25 }}>DESTINATION</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: theme.palette.custom.hoverBorder, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.destinationUrl}
              </Typography>
            </Box>

            {/* Toggle + actions */}
            <Stack direction="row" alignItems="center" gap={0.5}>
              <Switch
                size="small"
                checked={t.status === 'active'}
                onChange={() => handleToggle(t)}
                sx={{
                  '& .MuiSwitch-track': { bgcolor: t.status === 'active' ? `${alpha(theme.palette.secondary.main, 0.27)} !important` : `${theme.palette.custom.border} !important` },
                  '& .MuiSwitch-thumb': { bgcolor: t.status === 'active' ? theme.palette.secondary.main : theme.palette.custom.muted },
                }}
              />
              <Tooltip title="Configure"><IconButton size="small" onClick={() => navigate(`/trappers/${t.id}/configure`)} sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'primary.main' } }}><SettingsIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Listen"><IconButton size="small" onClick={() => navigate(`/trappers/${t.id}/listen`)} sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'secondary.main' } }}><HearingIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={() => setConfirmId(t.id)} sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'error.main' } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
          </Paper>
        ))}

        {trappers.length === 0 && (
          <Paper sx={{ border: `1px solid ${theme.palette.custom.border}`, p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, mb: 1.5 }}>
              // No trappers configured yet
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              Create your first Trapper
            </Button>
          </Paper>
        )}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper', border: `1px solid ${theme.palette.custom.border}` } }}>
        <DialogTitle sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', borderBottom: `1px solid ${theme.palette.custom.border}`, pb: 2 }}>
          New Trapper
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
          <TextField label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth size="small" />
          <TextField
            label="Trap ID (slug)"
            value={form.trapId}
            onChange={(e) => setForm({ ...form, trapId: e.target.value })}
            fullWidth size="small"
            helperText={`Endpoint: POST /api/h/${form.trapId || '<trap-id>'}`}
            InputProps={{ sx: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' } }}
          />
          <TextField label="Destination URL" value={form.destinationUrl} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} fullWidth size="small" />
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.custom.border}`, px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: theme.palette.custom.muted }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.trapId || !form.destinationUrl}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper', border: `1px solid ${theme.palette.custom.border}` } }}>
        <DialogTitle sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', borderBottom: `1px solid ${theme.palette.custom.border}`, pb: 2 }}>
          Delete Trapper
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            This will permanently delete the trapper and all its logs. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.custom.border}`, px: 3, py: 2 }}>
          <Button onClick={() => setConfirmId(null)} sx={{ color: theme.palette.custom.muted }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
