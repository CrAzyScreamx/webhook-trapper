import { useEffect, useState, useCallback, useReducer } from 'react';
import {
  Box, Typography, Paper, Stack, Grid, Chip, Skeleton, Button, Drawer, Divider, IconButton,
  Tabs, Tab, LinearProgress, Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { queueApi, type QueueJob } from '../api/client';
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
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<QueueJob | null>(null);
  const [activeTab, setActiveTab] = useState<'failed' | 'waiting' | 'active' | 'delayed'>('failed');
  const [paused, setPaused] = useState(false);
  const [payloadExpanded, setPayloadExpanded] = useState(false);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const fetchAll = useCallback(async () => {
    try {
      const [s, j] = await Promise.all([
        queueApi.getStats(),
        activeTab === 'failed' ? queueApi.getFailed() : queueApi.getJobs(activeTab),
      ]);
      setStats(s);
      setJobs(j as QueueJob[]);
      setLastUpdated(new Date());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setJobs([]);
    setLoading(true);
    fetchAll();
  }, [activeTab]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll, paused]);

  useEffect(() => {
    const t = setInterval(() => forceUpdate(), 1000);
    return () => clearInterval(t);
  }, []);

  const tabColor = (tab: string) => {
    if (tab === 'failed') return theme.palette.error.main;
    if (tab === 'active') return theme.palette.secondary.main;
    return theme.palette.primary.main;
  };
  const cardAccent = tabColor(activeTab);

  const handleRetry = async (jobId: string) => {
    try { await queueApi.retryJob(jobId); fetchAll(); } catch { /* silent */ }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    try { for (const job of jobs) { await queueApi.retryJob(job.jobId); } await fetchAll(); }
    finally { setRetryingAll(false); }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try { await queueApi.clearAllFailed(); await fetchAll(); }
    finally { setClearingAll(false); }
  };

  const handleDeleteJob = async (jobId: string) => {
    setDeletingJob(true);
    try { await queueApi.deleteJob(jobId); setSelectedJob(null); await fetchAll(); }
    finally { setDeletingJob(false); }
  };

  const handleCopyPayload = (job: QueueJob) => {
    const text = JSON.stringify(job.data?.payload, null, 2);
    navigator.clipboard.writeText(text).catch(() => { /* silent */ });
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
          <Typography variant="h5" fontFamily="Space Grotesk, sans-serif" fontWeight={700}>Queue Health</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, mt: 0.25 }}>
            Job processing pipeline
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Tooltip title={paused ? 'Resume auto-refresh' : 'Pause auto-refresh'}>
            <IconButton size="small" onClick={() => setPaused(p => !p)} sx={{ p: 0.5 }}>
              {paused
                ? <PlayCircleOutlined sx={{ fontSize: 16, color: theme.palette.custom.muted }} />
                : <PauseCircleOutlined sx={{ fontSize: 16, color: theme.palette.custom.muted }} />}
            </IconButton>
          </Tooltip>
          <Box sx={{ opacity: paused ? 0.3 : 1, display: 'flex', alignItems: 'center' }}>
            <LiveDot />
          </Box>
          <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: theme.palette.custom.muted }}>
            {paused ? 'paused' : refreshLabel}
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
              <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
              <Typography variant="h4" fontFamily="Space Grotesk, sans-serif" fontWeight={700}>{value}</Typography>
              {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tab Strip */}
      <Box sx={{ mb: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setSelectedJob(null); }}
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': { height: 2 },
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.75,
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
            },
          }}
        >
          {(['failed', 'waiting', 'active', 'delayed'] as const).map((tab) => (
            <Tab
              key={tab}
              value={tab}
              label={
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <span style={{ textTransform: 'capitalize' }}>{tab}</span>
                  {stats[tab] > 0 && (
                    <Box component="span" sx={{
                      fontSize: '0.65rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      px: 0.75,
                      py: 0.125,
                      borderRadius: 1,
                      bgcolor: alpha(tabColor(tab), 0.12),
                      color: tabColor(tab),
                      fontWeight: 700,
                    }}>
                      {stats[tab]}
                    </Box>
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>
        <Divider sx={{ borderColor: theme.palette.custom.border }} />
      </Box>

      {/* Tab actions row (only for failed tab) */}
      {activeTab === 'failed' && jobs.length > 0 && (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} mb={2}>
          <Button
            size="small" variant="outlined" startIcon={<ReplayIcon />}
            disabled={retryingAll} onClick={handleRetryAll}
            sx={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem',
              borderColor: alpha(theme.palette.error.main, 0.4), color: 'error.main',
              '&:hover': { borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06) },
            }}
          >
            Retry All
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<DeleteOutlineIcon />}
            disabled={clearingAll} onClick={handleClearAll}
            sx={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem',
              borderColor: alpha(theme.palette.error.main, 0.4), color: 'error.main',
              '&:hover': { borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06) },
            }}
          >
            Clear All
          </Button>
        </Stack>
      )}

      {/* Empty state */}
      {jobs.length === 0 ? (
        <Paper sx={{
          border: `1px solid ${theme.palette.custom.border}`, p: 6,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%',
            bgcolor: alpha(theme.palette.secondary.main, 0.12),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 44, color: alpha(theme.palette.secondary.main, 0.7) }} />
          </Box>
          <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize="1.1rem">
            No {activeTab} jobs
          </Typography>
          <Typography fontSize="0.8rem" color="text.secondary">
            {activeTab === 'failed' ? 'The queue is healthy.' : `No jobs in ${activeTab} state.`}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {jobs.map((job) => (
            <Paper
              key={job.jobId}
              onClick={() => { setSelectedJob(job); setPayloadExpanded(false); }}
              sx={{
                borderLeft: `3px solid ${cardAccent}`, px: 2.5, py: 2,
                transition: 'all 0.2s ease', cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] },
              }}
            >
              {/* Row 1: trapper chip, job id, attempts, time */}
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Chip
                  label={job.data?.trapperId ?? '—'}
                  size="small"
                  sx={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', height: 20,
                    bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
                <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: theme.palette.custom.muted, flexGrow: 1 }}>
                  #{job.jobId}
                </Typography>
                <Chip
                  label={job.maxAttempts != null ? `${job.attemptsMade} / ${job.maxAttempts}` : `${job.attemptsMade} attempts`}
                  size="small"
                  sx={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', height: 18,
                    bgcolor: job.attemptsMade > 1 ? alpha(cardAccent, 0.1) : alpha(theme.palette.custom.muted, 0.1),
                    color: job.attemptsMade > 1 ? cardAccent : theme.palette.custom.muted,
                    border: `1px solid ${job.attemptsMade > 1 ? alpha(cardAccent, 0.2) : alpha(theme.palette.custom.muted, 0.2)}`,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
                <Stack direction="row" alignItems="center" gap={0.4}>
                  <AccessTimeIcon sx={{ fontSize: '0.7rem', color: theme.palette.custom.muted }} />
                  <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: theme.palette.custom.muted }}>
                    {relativeTime(job.timestamp)}
                  </Typography>
                </Stack>
              </Stack>

              {/* Row 2: destination URL */}
              {job.data?.destinationUrl && (
                <Typography sx={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                  color: theme.palette.custom.muted, mt: 0.75,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  → {job.data.destinationUrl}
                </Typography>
              )}

              {/* Row 3: error preview (failed tab only) */}
              {job.failedReason && (
                <Typography sx={{
                  fontSize: '0.68rem', color: theme.palette.error.main,
                  mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85,
                }}>
                  {job.failedReason}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        PaperProps={{
          sx: {
            width: 440, maxWidth: '100vw', bgcolor: 'background.paper',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          },
        }}
      >
        {selectedJob && (
          <>
            {/* Drawer header */}
            <Box sx={{ p: 3, pb: 0, flexShrink: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize="1rem">Job Details</Typography>
                <IconButton size="small" onClick={() => setSelectedJob(null)}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
              <Divider sx={{ borderColor: theme.palette.custom.border }} />
              <Stack spacing={1} mt={2}>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip
                    label={selectedJob.data?.trapperId ?? '—'}
                    size="small"
                    sx={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', height: 20,
                      bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
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
            </Box>

            {/* Drawer scrollable body */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              {/* Attempt progress */}
              {selectedJob.maxAttempts != null && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="0.8rem">Attempts</Typography>
                    <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: theme.palette.custom.muted }}>
                      {selectedJob.attemptsMade} / {selectedJob.maxAttempts}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedJob.attemptsMade / selectedJob.maxAttempts) * 100}
                    sx={{
                      height: 4, borderRadius: 2,
                      bgcolor: alpha(cardAccent, 0.12),
                      '& .MuiLinearProgress-bar': { bgcolor: cardAccent, borderRadius: 2 },
                    }}
                  />
                </Box>
              )}

              {/* Destination URL */}
              {selectedJob.data?.destinationUrl && (
                <Box>
                  <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="0.8rem" mb={0.75}>
                    Destination
                  </Typography>
                  <Stack direction="row" alignItems="center" gap={0.5} sx={{
                    bgcolor: theme.palette.custom.codeBg,
                    border: `1px solid ${theme.palette.custom.border}`,
                    borderRadius: 1, p: 1.25,
                  }}>
                    <OpenInNewIcon sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, flexShrink: 0 }} />
                    <Typography sx={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
                      color: theme.palette.text.primary,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1,
                    }}>
                      {selectedJob.data.destinationUrl}
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Payload — compact collapsible */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                  <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="0.8rem">Payload</Typography>
                  <Tooltip title="Copy payload">
                    <IconButton size="small" onClick={() => handleCopyPayload(selectedJob)} sx={{ p: 0.5 }}>
                      <ContentCopyIcon sx={{ fontSize: 14, color: theme.palette.custom.muted }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{
                  position: 'relative',
                  bgcolor: theme.palette.custom.codeBg,
                  border: `1px solid ${theme.palette.custom.border}`,
                  borderRadius: 1, overflow: 'hidden',
                }}>
                  <Box sx={{ p: 1.5, maxHeight: payloadExpanded ? 'none' : '4.5rem', overflow: 'hidden', overflowX: 'auto' }}>
                    <Typography component="pre" sx={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
                      color: theme.palette.text.primary, m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {JSON.stringify(selectedJob.data?.payload, null, 2)}
                    </Typography>
                  </Box>
                  {!payloadExpanded && (
                    <Box sx={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
                      background: `linear-gradient(transparent, ${theme.palette.custom.codeBg})`,
                      pointerEvents: 'none',
                    }} />
                  )}
                </Box>
                <Typography
                  component="button"
                  onClick={() => setPayloadExpanded(e => !e)}
                  sx={{
                    mt: 0.5, fontSize: '0.7rem', fontFamily: 'Space Grotesk, sans-serif',
                    color: theme.palette.primary.main, cursor: 'pointer',
                    background: 'none', border: 'none', p: 0,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {payloadExpanded ? 'Collapse' : 'Expand'}
                </Typography>
              </Box>

              {/* Error — only for failed jobs */}
              {selectedJob.failedReason && (
                <Box>
                  <Typography fontFamily="Space Grotesk, sans-serif" fontWeight={600} fontSize="0.8rem" mb={0.75}>Error</Typography>
                  <Stack direction="row" alignItems="flex-start" gap={0.75}>
                    <ErrorOutlineIcon sx={{ fontSize: '0.9rem', color: 'error.main', mt: '2px', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.8rem', color: 'error.main', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                      {selectedJob.failedReason}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Drawer footer */}
            <Box sx={{ p: 3, pt: 0, flexShrink: 0 }}>
              <Stack direction="row" gap={1}>
                {activeTab === 'failed' && (
                  <Button
                    fullWidth variant="outlined" startIcon={<ReplayIcon />}
                    onClick={() => { handleRetry(selectedJob.jobId); setSelectedJob(null); }}
                    sx={{
                      fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.8rem',
                      borderColor: alpha(theme.palette.error.main, 0.4), color: 'error.main',
                      '&:hover': { borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06) },
                    }}
                  >
                    Retry
                  </Button>
                )}
                <Button
                  fullWidth variant="outlined" startIcon={<DeleteOutlineIcon />}
                  disabled={deletingJob}
                  onClick={() => handleDeleteJob(selectedJob.jobId)}
                  sx={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.8rem',
                    borderColor: alpha(theme.palette.custom.muted, 0.3), color: theme.palette.custom.muted,
                    '&:hover': { borderColor: theme.palette.custom.muted, bgcolor: alpha(theme.palette.custom.muted, 0.06) },
                  }}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}
