import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Switch, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Chip, Snackbar, Alert, InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import HearingIcon from '@mui/icons-material/Hearing';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SensorsIcon from '@mui/icons-material/Sensors';
import { useNavigate } from 'react-router-dom';
import { trappersApi, Trapper } from '../api/client';

export default function Trappers() {
  const theme = useTheme();
  const [trappers, setTrappers] = useState<Trapper[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', trapId: '' });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = () => trappersApi.list().then(setTrappers);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await trappersApi.create(form);
    setOpen(false);
    setForm({ name: '', description: '', trapId: '' });
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

  const filtered = useMemo(
    () =>
      trappers
        .filter((t) => statusFilter === 'all' || t.status === statusFilter)
        .filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase())),
    [trappers, statusFilter, search]
  );

  const activeCount = trappers.filter((t) => t.status === 'active').length;
  const pausedCount = trappers.filter((t) => t.status === 'paused').length;

  const badge = (label: string, color: string) => (
    <Box
      sx={{
        px: 0.75,
        py: 0.15,
        bgcolor: alpha(color, 0.09),
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 0.5,
        display: 'inline-flex',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.55rem',
          fontFamily: 'JetBrains Mono, monospace',
          color,
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => setSnackMsg('Copied!'));
  };

  const retryLabel = (policy: Trapper['retryPolicy']) => {
    if (policy === 'exponential') return badge('RETRY: EXPONENTIAL', theme.palette.primary.main);
    if (policy === 'immediate') return badge('RETRY: IMMEDIATE', theme.palette.warning.main);
    return badge('RETRY: NONE', theme.palette.custom.muted);
  };

  const authLabel = (authType: Trapper['authType']) => {
    const map: Record<Trapper['authType'], string> = {
      bearer: 'AUTH: BEARER',
      basic: 'AUTH: BASIC',
      hmac: 'AUTH: HMAC',
      none: 'AUTH: NONE',
      custom: 'AUTH: CUSTOM',
    };
    const colorMap: Record<Trapper['authType'], string> = {
      bearer: theme.palette.secondary.main,
      basic: theme.palette.primary.main,
      hmac: theme.palette.warning.main,
      none: theme.palette.custom.muted,
      custom: theme.palette.error.main,
    };
    return badge(map[authType], colorMap[authType]);
  };

  return (
    <Box>
      {/* Header row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography
            sx={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '1.6rem',
              color: 'text.primary',
            }}
          >
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
          sx={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '0.8rem',
            py: 0.9,
            px: 2,
          }}
        >
          New Trapper
        </Button>
      </Stack>

      {/* Stat strip */}
      <Stack direction="row" gap={1} mb={2.5} flexWrap="wrap">
        {[
          { label: `Total: ${trappers.length}`, color: theme.palette.primary.main },
          { label: `Active: ${activeCount}`, color: theme.palette.secondary.main },
          { label: `Paused: ${pausedCount}`, color: theme.palette.custom.muted },
        ].map(({ label, color }) => (
          <Box
            key={label}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(color, 0.09),
              border: `1px solid ${alpha(color, 0.15)}`,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontFamily: 'JetBrains Mono, monospace',
                color,
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* Search + filter bar */}
      <Stack direction="row" gap={1.5} alignItems="center" mb={3} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search trappers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: '1rem', color: theme.palette.custom.muted }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
        <Stack direction="row" gap={0.75}>
          <Chip
            label="All"
            size="small"
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            color={statusFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('all')}
          />
          <Chip
            label="Active"
            size="small"
            variant={statusFilter === 'active' ? 'filled' : 'outlined'}
            color={statusFilter === 'active' ? 'success' : 'default'}
            onClick={() => setStatusFilter('active')}
          />
          <Chip
            label="Paused"
            size="small"
            variant={statusFilter === 'paused' ? 'filled' : 'outlined'}
            color="default"
            onClick={() => setStatusFilter('paused')}
          />
        </Stack>
      </Stack>

      {/* Card grid */}
      {filtered.length > 0 ? (
        <Grid container spacing={2}>
          {filtered.map((t) => (
            <Grid item xs={12} md={6} key={t.id} sx={{ overflow: 'visible' }}>
              <Paper
                sx={{
                  border: `1px solid ${theme.palette.custom.border}`,
                  borderLeft: `3px solid ${t.status === 'active' ? theme.palette.secondary.main : theme.palette.custom.muted}`,
                  px: 2.5,
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.custom.hoverBorder,
                  },
                  overflow: 'visible',
                }}
              >
                {/* Top row: name + status badge + toggle switch */}
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography
                    onClick={() => navigate(`/trappers/${t.id}`)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: 'text.primary',
                      cursor: 'pointer',
                      flexGrow: 1,
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {t.name}
                  </Typography>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      bgcolor:
                        t.status === 'active'
                          ? alpha(theme.palette.secondary.main, 0.09)
                          : alpha(theme.palette.custom.muted, 0.09),
                      border: `1px solid ${
                        t.status === 'active'
                          ? alpha(theme.palette.secondary.main, 0.2)
                          : alpha(theme.palette.custom.muted, 0.2)
                      }`,
                      borderRadius: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.55rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        color:
                          t.status === 'active'
                            ? 'secondary.main'
                            : theme.palette.custom.muted,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {t.status.toUpperCase()}
                    </Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={t.status === 'active'}
                    onChange={() => handleToggle(t)}
                    sx={{
                      '& .MuiSwitch-track': {
                        bgcolor:
                          t.status === 'active'
                            ? `${alpha(theme.palette.secondary.main, 0.27)} !important`
                            : `${theme.palette.custom.border} !important`,
                      },
                      '& .MuiSwitch-thumb': {
                        bgcolor:
                          t.status === 'active'
                            ? theme.palette.secondary.main
                            : theme.palette.custom.muted,
                      },
                    }}
                  />
                </Stack>

                {/* Endpoint row */}
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: theme.palette.custom.muted,
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    POST /api/h/{t.trapId}
                  </Typography>
                  <Tooltip title="Copy endpoint">
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(`/api/h/${t.trapId}`)}
                      sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'primary.main' } }}
                    >
                      <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Badge row */}
                <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
                  {retryLabel(t.retryPolicy)}
                  {authLabel(t.authType)}
                  {badge(
                    t.deliveryMode === 'broadcast' ? 'BROADCAST' : 'FALLBACK',
                    t.deliveryMode === 'broadcast'
                      ? theme.palette.secondary.main
                      : theme.palette.warning.main
                  )}
                  {t.rateLimit != null &&
                    badge(`LIMIT: ${t.rateLimit}/s`, theme.palette.error.main)}
                </Stack>

                {/* Description */}
                {t.description && (
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: theme.palette.custom.muted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.description}
                  </Typography>
                )}

                {/* Action row */}
                <Stack direction="row" justifyContent="flex-end" gap={0.5} mt={0.5}>
                  <Tooltip title="Configure">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/trappers/${t.id}/configure`)}
                      sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'primary.main' } }}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Listen">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/trappers/${t.id}/listen`)}
                      sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'secondary.main' } }}
                    >
                      <HearingIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => setConfirmId(t.id)}
                      sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Empty state */
        <Paper
          sx={{
            border: `1px solid ${theme.palette.custom.border}`,
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SensorsIcon sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.6) }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'text.primary',
                mb: 0.5,
              }}
            >
              No trappers yet
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.custom.muted }}>
              {search || statusFilter !== 'all'
                ? 'No trappers match your current filters.'
                : 'Create your first trapper to start capturing webhooks.'}
            </Typography>
          </Box>
          {!search && statusFilter === 'all' && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              Create your first Trapper
            </Button>
          )}
        </Paper>
      )}

      {/* Create dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'background.paper', border: `1px solid ${theme.palette.custom.border}` },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            borderBottom: `1px solid ${theme.palette.custom.border}`,
            pb: 2,
          }}
        >
          New Trapper
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Trap ID (slug)"
            value={form.trapId}
            onChange={(e) => setForm({ ...form, trapId: e.target.value })}
            fullWidth
            size="small"
            helperText={`Endpoint: POST /api/h/${form.trapId || '<trap-id>'}`}
            InputProps={{ sx: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.custom.border}`, px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: theme.palette.custom.muted }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.name || !form.trapId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'background.paper', border: `1px solid ${theme.palette.custom.border}` },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            borderBottom: `1px solid ${theme.palette.custom.border}`,
            pb: 2,
          }}
        >
          Delete Trapper
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            This will permanently delete the trapper and all its logs. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.custom.border}`, px: 3, py: 2 }}>
          <Button onClick={() => setConfirmId(null)} sx={{ color: theme.palette.custom.muted }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy snackbar */}
      <Snackbar
        open={!!snackMsg}
        autoHideDuration={2000}
        onClose={() => setSnackMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackMsg(null)} severity="success" sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
