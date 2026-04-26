import { useEffect, useState, useCallback, useReducer } from 'react';
import {
  Box, Typography, Paper, Stack, Grid, Chip, Skeleton, Button, Drawer, Divider, IconButton
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import { queueApi, type FailedJob } from '../api/client';
import LiveDot from '../components/LiveDot';

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return new Date(ms).toLocaleDateString();
}

export default function QueueDashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 });
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FailedJob | null>(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const fetchAll = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([queueApi.getStats(), queueApi.getFailed()]);
      setStats(s);
      setFailedJobs(f);
      setLastUpdated(new Date());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const t = setInterval(() => forceUpdate(), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      await queueApi.retryJob(jobId);
      fetchAll();
    } catch {
      // silently fail
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      for (const job of failedJobs) {
        await queueApi.retryJob(job.jobId);
      }
      await fetchAll();
    } finally {
      setRetryingAll(false);
    }
  };

  const refreshLabel = (() => {
    if (!lastUpdated) return 'Fetching…';
    const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  })();

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={200} height={36} sx={{ bgcolor: alpha(theme.palette.custom.border, 0.4) }} />
      <Skeleton variant="text" width={140} height={18} sx={{ mb: 3, bgcolor: alpha(theme.palette.custom.border, 0.4) }} />
      <Grid container spacing={2} mb={3}>
        {[...Array(5)].map((_, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={i}>
            <Skeleton variant="rounded" height={88} sx={{ bgcolor: alpha(theme.palette.custom.border, 0.4) }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="text" width={160} height={28} sx={{ mb: 2, bgcolor: alpha(theme.palette.custom.border, 0.4) }} />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={110} sx={{ mb: 1.5, bgcolor: alpha(theme.palette.custom.border, 0.4) }} />
      ))}
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontFamily="Space Grotesk, sans-serif" fontWeight={700}>
            Queue Health
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, mt: 0.25 }}>
            Job processing pipeline
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <LiveDot />
          <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: theme.palette.custom.muted }}>
            {refreshLabel}
          </Typography>
        </Stack>
      </Stack>

      {/* Stat Strip */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Waiting', value: stats.waiting, sub: 'in queue', color: theme.palette.primary.main },
          { label: 'Active', value: stats.active, sub: 'in progress', color: theme.palette.secondary.main },
          { label: 'Completed', value: stats.completed, sub: undefined, color: theme.palette.primary.main },
          { label: 'Failed', value: stats.failed, sub: stats.failed > 0 ? 'need attention' : undefined, color: theme.palette.error.main },
          { label: 'Delayed', value: stats.delayed, sub: 'scheduled', color: theme.palette.primary.main },
        ].map(({ label, value, sub, color }) => (
          <Grid item xs={6} sm={4} md={2.4} key={label}>
            <Paper sx={{
              p: 3,
              height: '100%',
              borderLeft: `3px solid ${color}`,
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] },
            }}>
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
          </Grid>
        ))}
      </Grid>

      {/* Failed Jobs Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="1.1rem">
            Failed Jobs
          </Typography>
          {failedJobs.length > 0 && (
            <Chip
              label={failedJobs.length}
              size="small"
              sx={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem',
                fontWeight: 700,
                height: 20,
                bgcolor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.main,
                border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
        </Stack>
        {failedJobs.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ReplayIcon />}
            disabled={retryingAll}
            onClick={handleRetryAll}
            sx={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.75rem',
              borderColor: alpha(theme.palette.error.main, 0.4),
              color: theme.palette.error.main,
              '&:hover': {
                borderColor: theme.palette.error.main,
                bgcolor: alpha(theme.palette.error.main, 0.06),
              },
            }}
          >
            Retry All
          </Button>
        )}
      </Stack>

      {/* Empty State */}
      {failedJobs.length === 0 ? (
        <Paper sx={{
          border: `1px solid ${theme.palette.custom.border}`,
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.secondary.main, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 44, color: alpha(theme.palette.secondary.main, 0.7) }} />
          </Box>
          <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize="1.1rem">
            All clear — no failed jobs
          </Typography>
          <Typography fontSize="0.8rem" color="text.secondary">
            The queue is healthy.
          </Typography>
        </Paper>
      ) : (
        /* Failed Job Cards */
        <Stack spacing={1.5}>
          {failedJobs.map((job) => {
            return (
              <Paper
                key={job.jobId}
                onClick={() => setSelectedJob(job)}
                sx={{
                  borderLeft: `3px solid ${theme.palette.error.main}`,
                  px: 2.5,
                  py: 2,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] },
                }}
              >
                <Stack spacing={1}>
                  {/* Row 1: Identity */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Chip
                      label={job.data?.trapperId ?? '—'}
                      size="small"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.7rem',
                        height: 20,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                    <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: theme.palette.custom.muted, flexGrow: 1 }}>
                      #{job.jobId}
                    </Typography>
                    <Chip
                      label={`ATTEMPTS: ${job.attemptsMade}`}
                      size="small"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.65rem',
                        height: 18,
                        bgcolor: job.attemptsMade > 1 ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.custom.muted, 0.1),
                        color: job.attemptsMade > 1 ? theme.palette.error.main : theme.palette.custom.muted,
                        border: `1px solid ${job.attemptsMade > 1 ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.custom.muted, 0.2)}`,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                    <Stack direction="row" alignItems="center" gap={0.4}>
                      <AccessTimeIcon sx={{ fontSize: '0.7rem', color: theme.palette.custom.muted }} />
                      <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: theme.palette.custom.muted }}>
                        {relativeTime(job.timestamp)}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.65rem', color: theme.palette.custom.muted, ml: 'auto' }}>View details →</Typography>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Drawer
        anchor="left"
        open={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        PaperProps={{
          sx: {
            width: 420,
            bgcolor: 'background.paper',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }
        }}
      >
        {selectedJob && (
          <>
            {/* Drawer header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize="1rem">
                Job Details
              </Typography>
              <IconButton size="small" onClick={() => setSelectedJob(null)}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

            <Divider sx={{ borderColor: theme.palette.custom.border }} />

            {/* Identity */}
            <Stack spacing={1}>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip label={selectedJob.data?.trapperId ?? '—'} size="small" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', height: 20, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, '& .MuiChip-label': { px: 1 } }} />
                <Chip label={`ATTEMPTS: ${selectedJob.attemptsMade}`} size="small" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', height: 20, bgcolor: selectedJob.attemptsMade > 1 ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.custom.muted, 0.1), color: selectedJob.attemptsMade > 1 ? theme.palette.error.main : theme.palette.custom.muted, border: `1px solid ${selectedJob.attemptsMade > 1 ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.custom.muted, 0.2)}`, '& .MuiChip-label': { px: 1 } }} />
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <AccessTimeIcon sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted }} />
                <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: theme.palette.custom.muted }}>
                  {relativeTime(selectedJob.timestamp)} · {new Date(selectedJob.timestamp).toLocaleString()}
                </Typography>
              </Stack>
              <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: theme.palette.custom.muted }}>
                Job ID: #{selectedJob.jobId}
              </Typography>
            </Stack>

            {/* Payload */}
            <Box>
              <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="0.8rem" mb={1}>
                Payload
              </Typography>
              <Box sx={{ bgcolor: theme.palette.custom.codeBg, border: `1px solid ${theme.palette.custom.border}`, borderRadius: 1, p: 1.5, overflowX: 'auto' }}>
                <Typography component="pre" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: theme.palette.text.primary, m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(selectedJob.data?.payload, null, 2)}
                </Typography>
              </Box>
            </Box>

            {/* Error */}
            <Box>
              <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="0.8rem" mb={1}>
                Error
              </Typography>
              <Stack direction="row" alignItems="flex-start" gap={0.75}>
                <ErrorOutlineIcon sx={{ fontSize: '0.9rem', color: 'error.main', mt: '2px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.8rem', color: 'error.main', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                  {selectedJob.failedReason}
                </Typography>
              </Stack>
            </Box>

            {/* Actions */}
            <Box sx={{ mt: 'auto' }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={() => { handleRetry(selectedJob.jobId); setSelectedJob(null); }}
                sx={{ fontFamily: 'Space Grotesk, sans-serif', borderColor: alpha(theme.palette.error.main, 0.4), color: 'error.main', '&:hover': { borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06) } }}
              >
                Retry Job
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}
