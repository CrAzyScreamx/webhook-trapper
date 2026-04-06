import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Stack, IconButton, Tooltip, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { keyframes } from '@mui/system';
import { trappersApi, Trapper, WebhookLog } from '../api/client';
import JsonViewer from '../components/JsonViewer';
import Breadcrumb from '../components/Breadcrumb';

const ping = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
`;
const ripple = keyframes`
  0% { transform: scale(0.9); opacity: 0.5; }
  100% { transform: scale(2.2); opacity: 0; }
`;
const scan = keyframes`
  0% { top: 0%; opacity: 0.6; }
  100% { top: 100%; opacity: 0; }
`;

export default function WebhookListener() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const [trapper, setTrapper] = useState<Trapper | null>(null);
  const [lastPayload, setLastPayload] = useState<unknown>(null);
  const [captures, setCaptures] = useState<WebhookLog[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
    SENT:     { color: theme.palette.secondary.main, bg: alpha(theme.palette.secondary.main, 0.09), label: 'SENT' },
    FILTERED: { color: theme.palette.primary.main,   bg: alpha(theme.palette.primary.main, 0.09),   label: 'FILTERED' },
    REJECTED: { color: theme.palette.error.main,     bg: alpha(theme.palette.error.main, 0.09),     label: 'REJECTED' },
  };

  useEffect(() => {
    trappersApi.get(id!).then(setTrapper);
    trappersApi.getLogs(id!, { limit: 3 }).then((r) => setCaptures(r.rows));

    const es = new EventSource(`/api/sse/${id}`);
    esRef.current = es;
    es.onmessage = (e) => {
      const log: WebhookLog = JSON.parse(e.data);
      try { setLastPayload(JSON.parse(log.payload)); } catch { /* ignore */ }
      if (log.latency != null) setLatency(log.latency);
      setActive(true);
      setTimeout(() => setActive(false), 2000);
      setCaptures((prev) => [log, ...prev].slice(0, 3));
    };
    return () => es.close();
  }, [id]);

  const endpoint = `${window.location.origin}/api/h/${trapper?.trapId ?? '...'}`;

  const copy = () => {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Breadcrumb items={[
        { label: 'Trappers', path: '/trappers' },
        { label: trapper?.trapId ?? '...', path: `/trappers/${id}` },
        { label: 'Listen' },
      ]} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', color: 'text.primary' }}>
          Listening...
        </Typography>
        <Stack direction="row" gap={1}>
          <Button size="small" onClick={() => setCaptures([])}
            startIcon={<ClearAllIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.72rem', borderColor: theme.palette.custom.border, color: theme.palette.custom.muted, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
            variant="outlined">
            Clear Log
          </Button>
          <Button size="small" variant="contained" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
            Capture & Continue
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={3}>
        {/* Left — scanner panel */}
        <Paper sx={{ flex: 1, p: 3, border: `1px solid ${theme.palette.custom.border}`, position: 'relative', overflow: 'hidden', minHeight: 320 }}>
          {/* scan line */}
          <Box sx={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.4)}, transparent)`,
            animation: `${scan} 3s linear infinite`,
            pointerEvents: 'none',
          }} />

          {/* Waiting animation */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 2, pb: 3 }}>
            <Box sx={{ position: 'relative', width: 100, height: 100, mb: 2.5 }}>
              {/* Ripple rings */}
              {[0, 1, 2].map((i) => (
                <Box key={i} sx={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  border: `1px solid ${active ? theme.palette.secondary.main : theme.palette.custom.border}`,
                  animation: active ? `${ripple} 1.2s ease-out ${i * 0.3}s infinite` : 'none',
                  transition: 'border-color 0.3s',
                }} />
              ))}
              {/* Center badge */}
              <Box sx={{
                position: 'absolute', inset: '20%',
                borderRadius: '50%',
                bgcolor: active ? alpha(theme.palette.secondary.main, 0.09) : alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${active ? alpha(theme.palette.secondary.main, 0.33) : alpha(theme.palette.primary.main, 0.13)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `${ping} 2s ease-in-out infinite`,
                transition: 'all 0.3s',
              }}>
                <Typography sx={{ fontSize: '1.4rem' }}>
                  {active ? '📡' : '📶'}
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: active ? 'secondary.main' : 'text.primary', mb: 0.5, transition: 'color 0.3s' }}>
              {active ? 'Payload Received!' : 'Waiting for Payload'}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: theme.palette.custom.muted, textAlign: 'center', maxWidth: 220 }}>
              Monitoring incoming POST requests on the secured Alpha-01 channel
            </Typography>
          </Box>

          {/* Endpoint */}
          <Box>
            <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.75 }}>
              TARGET ENDPOINT
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.5} sx={{
              bgcolor: theme.palette.custom.codeBg, border: `1px solid ${theme.palette.custom.border}`, borderRadius: 1, px: 1.5, py: 1,
            }}>
              <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'primary.main', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {endpoint}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                <IconButton size="small" onClick={copy} sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'primary.main' } }}>
                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack direction="row" gap={3} mt={1.5}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                <Typography sx={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>NETWORK ACTIVE</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: latency != null ? 'secondary.main' : theme.palette.custom.muted }} />
                <Typography sx={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                  LATENCY {latency != null ? `${latency}ms` : 'N/A'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {/* Right — live JSON */}
        <Paper sx={{ flex: 1.2, p: 0, border: `1px solid ${theme.palette.custom.border}`, overflow: 'hidden', minHeight: 320 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${theme.palette.custom.border}` }}>
            <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em' }}>
              LIVE PAYLOAD VIEWER
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
              {lastPayload ? 'SYNTAX: VALID' : 'AWAITING INPUT'}
            </Typography>
          </Stack>
          <Box sx={{ p: 2, height: 'calc(100% - 44px)' }}>
            {lastPayload
              ? <JsonViewer data={lastPayload} maxHeight={320} />
              : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
                  <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: theme.palette.custom.muted }}>
                    // waiting for webhook...
                  </Typography>
                </Box>
              )}
          </Box>
        </Paper>
      </Stack>

      {/* Recent History */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}>
          Recent History
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
          View all traffic →
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
        {captures.map((log) => {
          const s = statusStyle[log.status] ?? statusStyle.SENT;
          return (
            <Paper key={log.id} sx={{ flex: 1, border: `1px solid ${alpha(s.color, 0.13)}`, overflow: 'hidden' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1, borderBottom: `1px solid ${alpha(s.color, 0.13)}`, bgcolor: s.bg }}>
                <Box sx={{ px: 0.75, py: 0.2, bgcolor: s.bg, border: `1px solid ${alpha(s.color, 0.27)}`, borderRadius: 0.5 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                  {log.latency != null ? `${log.latency}ms` : '—'}
                </Typography>
              </Stack>
              <Box sx={{ p: 1.5 }}>
                <Typography sx={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, mb: 1 }}>
                  {new Date(log.timestamp).toLocaleString()}
                </Typography>
                <JsonViewer data={JSON.parse(log.payload || '{}')} maxHeight={110} />
              </Box>
            </Paper>
          );
        })}
        {captures.length === 0 && (
          <Paper sx={{ flex: 1, border: `1px solid ${theme.palette.custom.border}`, p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
              // No captures yet. Send a webhook to the endpoint above.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
