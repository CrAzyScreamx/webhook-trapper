import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Stack } from '@mui/material';
import { queueApi, type FailedJob } from '../api/client';
import StatCard from '../components/StatCard';

export default function QueueDashboard() {
  const [stats, setStats] = useState({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 });
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [s, f] = await Promise.all([queueApi.getStats(), queueApi.getFailed()]);
      setStats(s);
      setFailedJobs(f);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      await queueApi.retryJob(jobId);
      fetchAll();
    } catch {
      // silently fail
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontFamily="Space Grotesk, sans-serif" fontWeight={700}>
        Queue Health
      </Typography>

      <Stack direction="row" spacing={2}>
        <Box sx={{ flex: 1 }}><StatCard label="Waiting" value={stats.waiting} /></Box>
        <Box sx={{ flex: 1 }}><StatCard label="Active" value={stats.active} /></Box>
        <Box sx={{ flex: 1 }}><StatCard label="Completed" value={stats.completed} /></Box>
        <Box sx={{ flex: 1 }}><StatCard label="Failed" value={stats.failed} /></Box>
      </Stack>

      <Typography variant="h6" fontFamily="Space Grotesk, sans-serif" fontWeight={600} sx={{ mt: 2 }}>
        Failed Jobs
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Trapper ID</TableCell>
              <TableCell>Payload</TableCell>
              <TableCell>Error</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {failedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                  No failed jobs
                </TableCell>
              </TableRow>
            ) : (
              failedJobs.map((job) => (
                <TableRow key={job.jobId}>
                  <TableCell>{job.data?.trapperId ?? '—'}</TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.7rem',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {JSON.stringify(job.data?.payload ?? '')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.failedReason}
                  </TableCell>
                  <TableCell>{job.attemptsMade}</TableCell>
                  <TableCell>{new Date(job.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => handleRetry(job.jobId!)}>
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
