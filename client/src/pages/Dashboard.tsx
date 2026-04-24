import { useEffect, useState, useRef } from 'react';
import { Box, Grid, Typography, Paper, Stack, Table, TableHead, TableRow, TableCell, TableBody, Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts';
import LiveDot from '../components/LiveDot';
import { statsApi, trappersApi, logsApi, Stats, Trapper, WebhookLog } from '../api/client';

export default function Dashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [trappers, setTrappers] = useState<Trapper[]>([]);
  const [feed, setFeed] = useState<(WebhookLog & { trapperName?: string })[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const statusChip = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      SENT:     { label: 'ROUTE',  color: theme.palette.secondary.main, bg: alpha(theme.palette.secondary.main, 0.09) },
      FILTERED: { label: 'FILTER', color: theme.palette.primary.main,   bg: alpha(theme.palette.primary.main, 0.09) },
      REJECTED: { label: 'REJECT', color: theme.palette.error.main,     bg: alpha(theme.palette.error.main, 0.09) },
    };
    const s = map[status] ?? { label: status, color: '#888', bg: alpha('#888888', 0.09) };
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: 0.5, bgcolor: s.bg, border: `1px solid ${alpha(s.color, 0.2)}` }}>
        <Typography sx={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 600, letterSpacing: '0.06em' }}>
          {s.label}
        </Typography>
      </Box>
    );
  };

  useEffect(() => {
    statsApi.get().then(setStats);
    trappersApi.list().then((list) => {
      setTrappers(list);
      logsApi.list({ limit: 30 }).then((r) => {
        const enriched = r.rows.map((log) => {
          const trapper = list.find((t) => t.id === log.trapperId);
          return { ...log, trapperName: trapper?.name };
        });
        setFeed(enriched.reverse());
      });
    });

    const es = new EventSource('/api/sse/feed');
    esRef.current = es;
    es.onmessage = (e) => {
      const log = JSON.parse(e.data);
      setFeed((prev) => [log, ...prev].slice(0, 30));
      setStats((prev) => prev ? { ...prev, totalToday: prev.totalToday + 1 } : prev);
    };
    return () => es.close();
  }, []);

  const handleToggle = async (t: Trapper) => {
    await trappersApi.setStatus(t.id, t.status === 'active' ? 'paused' : 'active');
    trappersApi.list().then(setTrappers);
  };

  const hours = stats?.hourly.map((h) => `${String(h.hour).padStart(2, '0')}:00`) ?? [];
  const sentData = stats?.hourly.map((h) => h.sent) ?? [];
  const filteredData = stats?.hourly.map((h) => h.filtered) ?? [];

  return (
    <Box>
      {/* Throughput + Stats row */}
      <Grid container spacing={2} mb={2.5}>
        {/* Chart area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 220, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at 20% 50%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.12em', mb: 0.5 }}>
              TODAY'S THROUGHPUT
            </Typography>
            <Stack direction="row" alignItems="baseline" gap={1.5} mb={1}>
              <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.2rem', color: 'text.primary', lineHeight: 1 }}>
                {stats?.totalToday.toLocaleString() ?? '—'}
              </Typography>
              {stats && (
                <Typography sx={{ fontSize: '0.78rem', color: 'secondary.main', fontFamily: 'JetBrains Mono, monospace' }}>
                  +{stats.sent.toLocaleString()}
                </Typography>
              )}
            </Stack>
            {stats ? (
              <BarChart
                xAxis={[{ scaleType: 'band', data: hours, tickLabelStyle: { fontSize: 9, fill: theme.palette.custom.muted, fontFamily: 'JetBrains Mono, monospace' } }]}
                yAxis={[{ tickLabelStyle: { fontSize: 9, fill: theme.palette.custom.muted } }]}
                series={[
                  { data: sentData, label: 'Routed', color: alpha(theme.palette.primary.main, 0.27), stack: 'a' },
                  { data: filteredData, label: 'Filtered', color: alpha(theme.palette.primary.main, 0.13), stack: 'a' },
                ]}
                height={130}
                margin={{ top: 4, bottom: 28, left: 28, right: 8 }}
                sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
              />
            ) : (
              <Box sx={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: theme.palette.custom.muted, fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>Loading...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Stat cards */}
        <Grid item xs={12} md={4}>
          <Stack gap={2} height="100%">
            <Paper sx={{ p: 2.5, flex: 1, position: 'relative', overflow: 'hidden', border: `1px solid ${theme.palette.custom.border}` }}>
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: 0.5, bgcolor: alpha(theme.palette.secondary.main, 0.09), border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.6rem', color: 'secondary.main' }}>↑</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.5 }}>ROUTED</Typography>
              <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.9rem', color: 'text.primary', lineHeight: 1 }}>
                {stats?.sent.toLocaleString() ?? '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: theme.palette.custom.muted, mt: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>Events Forwarded</Typography>
            </Paper>
            <Paper sx={{ p: 2.5, flex: 1, position: 'relative', overflow: 'hidden', border: `1px solid ${theme.palette.custom.border}` }}>
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.09), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.6rem', color: 'primary.main' }}>⊘</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.5 }}>FILTERED</Typography>
              <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.9rem', color: 'text.primary', lineHeight: 1 }}>
                {stats?.filtered.toLocaleString() ?? '—'}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: theme.palette.custom.muted, mt: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>Events Dropped</Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Active Trappers + Live Feed */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ border: `1px solid ${theme.palette.custom.border}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.custom.border}` }}>
              <Typography sx={{ fontSize: '0.72rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.06em', color: 'text.primary' }}>
                Active Trappers
              </Typography>
              <Box sx={{ px: 1, py: 0.25, bgcolor: alpha(theme.palette.secondary.main, 0.09), border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`, borderRadius: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: 'secondary.main' }}>
                  {trappers.filter((t) => t.status === 'active').length} ACTIVE
                </Typography>
              </Box>
            </Stack>
            <Box>
              {trappers.slice(0, 6).map((t, i) => (
                <Box
                  key={t.id}
                  sx={{
                    px: 2.5, py: 1.5,
                    borderBottom: i < Math.min(trappers.length, 6) - 1 ? `1px solid ${theme.palette.custom.border}` : 'none',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                  }}
                >
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.06), border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'primary.main' }}>
                      {t.name.slice(0, 2).toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                      /h/{t.trapId}
                    </Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={t.status === 'active'}
                    onChange={() => handleToggle(t)}
                    sx={{
                      '& .MuiSwitch-track': { bgcolor: t.status === 'active' ? `${alpha(theme.palette.secondary.main, 0.27)} !important` : `${theme.palette.custom.border} !important` },
                      '& .MuiSwitch-thumb': { bgcolor: t.status === 'active' ? theme.palette.secondary.main : theme.palette.custom.muted },
                    }}
                  />
                </Box>
              ))}
              {trappers.length === 0 && (
                <Box sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                    No trappers configured
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Live Feed */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ border: `1px solid ${theme.palette.custom.border}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.custom.border}` }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <LiveDot />
                <Typography sx={{ fontSize: '0.72rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.06em', color: 'text.primary' }}>
                  Live Feed
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                View All Logs →
              </Typography>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { borderColor: theme.palette.custom.border, py: 0.75 } }}>
                  <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>METHOD</TableCell>
                  <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TRAPPER</TableCell>
                  <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TIME</TableCell>
                  <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feed.map((log) => (
                  <TableRow key={log.id} sx={{ '& .MuiTableCell-root': { borderColor: alpha(theme.palette.custom.border, 0.06), py: 0.9 }, '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) } }}>
                    <TableCell>
                      <Box sx={{ px: 0.75, py: 0.2, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 0.5, display: 'inline-block' }}>
                        <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 600 }}>
                          {log.method}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
                        {(log as any).trapperName ?? log.trapperId.slice(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{statusChip(log.status)}</TableCell>
                  </TableRow>
                ))}
                {feed.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ borderColor: theme.palette.custom.border, py: 3, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                        Waiting for incoming webhooks...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
