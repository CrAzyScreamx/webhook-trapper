import { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Stack, Table, TableHead, TableRow,
  TableCell, TableBody, Collapse, IconButton, TextField, Select,
  MenuItem, FormControl, Pagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { trappersApi, Trapper, WebhookLog } from '../api/client';
import JsonViewer from '../components/JsonViewer';
import Breadcrumb from '../components/Breadcrumb';

export default function TrapperDetail() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trapper, setTrapper] = useState<Trapper | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const limit = 10;


  const statusChip = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      SENT:     { label: 'SENT',      color: theme.palette.secondary.main, bg: alpha(theme.palette.secondary.main, 0.09) },
      FILTERED: { label: 'FILTERING', color: theme.palette.primary.main,   bg: alpha(theme.palette.primary.main, 0.09) },
      REJECTED: { label: 'REJECTED',  color: theme.palette.error.main,     bg: alpha(theme.palette.error.main, 0.09) },
    };
    const s = map[status] ?? { label: status, color: '#888', bg: alpha('#888888', 0.09) };
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: 0.5, bgcolor: s.bg, border: `1px solid ${alpha(s.color, 0.2)}` }}>
        <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 600, letterSpacing: '0.06em' }}>
          {s.label}
        </Typography>
      </Box>
    );
  };

  const loadTrapper = () => trappersApi.get(id!).then(setTrapper);
  const loadLogs = () =>
    trappersApi.getLogs(id!, { page, limit, search: search || undefined, status: statusFilter || undefined })
      .then((r) => { setLogs(r.rows); setTotal(r.total); });

  useEffect(() => { loadTrapper(); }, [id]);
  useEffect(() => { loadLogs(); }, [id, page, search, statusFilter]);

  const handleToggle = async () => {
    if (!trapper) return;
    await trappersApi.setStatus(trapper.id, trapper.status === 'active' ? 'paused' : 'active');
    loadTrapper();
  };

  const handleDelete = async () => {
    await trappersApi.delete(id!);
    navigate('/trappers');
  };

  const handleCopyRaw = async (log: WebhookLog) => {
    await navigator.clipboard.writeText(log.payload || '{}');
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sentCount = logs.filter((l) => l.status === 'SENT').length;
  const efficiency = logs.length ? Math.round((sentCount / logs.length) * 100) : 0;
  const latencies = logs.filter((l) => l.latency != null);
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + (b.latency ?? 0), 0) / latencies.length) : null;

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Trappers', path: '/trappers' },
        { label: trapper?.trapId ?? '...' },
      ]} />

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
            <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.7rem', color: 'text.primary' }}>
              {trapper?.name ?? '...'}
            </Typography>
            {trapper && (
              <Box sx={{
                px: 1, py: 0.3,
                bgcolor: trapper.status === 'active' ? alpha(theme.palette.secondary.main, 0.09) : alpha(theme.palette.custom.muted, 0.09),
                border: `1px solid ${trapper.status === 'active' ? alpha(theme.palette.secondary.main, 0.27) : alpha(theme.palette.custom.muted, 0.27)}`,
                borderRadius: 0.5,
              }}>
                <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: trapper.status === 'active' ? 'secondary.main' : theme.palette.custom.muted, letterSpacing: '0.08em' }}>
                  {trapper.status === 'active' ? '● LIVE' : '○ PAUSED'}
                </Typography>
              </Box>
            )}
          </Stack>
          {trapper?.description && (
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.custom.muted, mb: 0.5 }}>{trapper.description}</Typography>
          )}
          <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
            Active since Dec 2023
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button size="small" startIcon={<SettingsIcon />} onClick={() => navigate(`/trappers/${id}/configure`)}
            sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, borderColor: theme.palette.custom.border, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }} variant="outlined">
            Configure
          </Button>
          <Button size="small" startIcon={trapper?.status === 'active' ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={handleToggle} variant="outlined"
            sx={{ fontSize: '0.75rem', color: theme.palette.custom.muted, borderColor: theme.palette.custom.border, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
            {trapper?.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
          <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={handleDelete}
            sx={{ fontSize: '0.75rem', borderColor: alpha(theme.palette.error.main, 0.2), '&:hover': { borderColor: 'error.main' } }} variant="outlined">
            Delete
          </Button>
        </Stack>
      </Stack>

      {/* Stat cards */}
      <Stack direction="row" gap={2} mb={3}>
        {[
          { label: 'EFFICIENCY', value: `${efficiency}%`, sub: 'sent / total' },
          { label: 'TRAPPED TODAY', value: sentCount.toLocaleString(), sub: `${total} total in view` },
          { label: 'AVG LATENCY', value: avgLatency != null ? `${avgLatency}ms` : '—', sub: 'forward time' },
        ].map((card) => (
          <Paper key={card.label} sx={{ flex: 1, p: 2.5, border: `1px solid ${theme.palette.custom.border}`, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 60, height: 60, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.024), transform: 'translate(20px, 20px)' }} />
            <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.75 }}>
              {card.label}
            </Typography>
            <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', color: 'text.primary', lineHeight: 1, mb: 0.5 }}>
              {card.value}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
              {card.sub}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Execution history */}
      <Paper sx={{ border: `1px solid ${theme.palette.custom.border}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.custom.border}` }}>
          <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>
            Execution History
          </Typography>
          <Stack direction="row" gap={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Filter with regex..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ sx: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', height: 32 } }}
              sx={{ width: 200, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
            />
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                displayEmpty
                sx={{ fontSize: '0.75rem', height: 32, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
              >
                <MenuItem value=""><Typography sx={{ fontSize: '0.75rem' }}>All Status</Typography></MenuItem>
                <MenuItem value="SENT"><Typography sx={{ fontSize: '0.75rem' }}>SENT</Typography></MenuItem>
                <MenuItem value="FILTERED"><Typography sx={{ fontSize: '0.75rem' }}>FILTERED</Typography></MenuItem>
                <MenuItem value="REJECTED"><Typography sx={{ fontSize: '0.75rem' }}>REJECTED</Typography></MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { borderColor: theme.palette.custom.border, py: 0.75 } }}>
              <TableCell width={36} />
              <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TIMESTAMP</TableCell>
              <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>MESSAGE SNIPPET</TableCell>
              <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>DESTINATION</TableCell>
              <TableCell sx={{ color: theme.palette.custom.muted, fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>STATUS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <Fragment key={log.id}>
                <TableRow
                  sx={{ '& .MuiTableCell-root': { borderColor: expanded === log.id ? theme.palette.custom.border : alpha(theme.palette.custom.border, 0.09), py: 1 }, cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) } }}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                >
                  <TableCell>
                    <IconButton size="small" sx={{ color: theme.palette.custom.muted }}>
                      {expanded === log.id ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.hoverBorder }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.errorMessage ?? `${log.method} from ${log.sourceIp}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.destinationLabel ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{statusChip(log.status)}</TableCell>
                </TableRow>
                <TableRow sx={{ '& .MuiTableCell-root': { p: 0, borderColor: theme.palette.custom.border } }}>
                  <TableCell colSpan={5}>
                    <Collapse in={expanded === log.id} unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: theme.palette.custom.codeBg, borderTop: `1px solid ${theme.palette.custom.border}` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.1em' }}>
                            FULL JSON PAYLOAD
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleCopyRaw(log); }}
                            sx={{ color: copiedId === log.id ? theme.palette.secondary.main : theme.palette.custom.muted }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                            <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: 'inherit', letterSpacing: '0.06em', ml: 0.5 }}>
                              {copiedId === log.id ? 'Copied!' : 'Copy Raw'}
                            </Typography>
                          </IconButton>
                        </Stack>
                        <JsonViewer data={JSON.parse(log.payload || '{}')} maxHeight={300} />
                        {log.errorMessage && (
                          <Typography sx={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: 'error.main', mt: 1 }}>
                            ✕ {log.errorMessage}
                          </Typography>
                        )}
                        <Stack direction="row" justifyContent="flex-end" mt={1.5}>
                          <Button
                            variant="contained" size="small"
                            startIcon={<CodeIcon sx={{ fontSize: 14 }} />}
                            onClick={() => navigate(`/trappers/${id}/configure?payload=${encodeURIComponent(log.payload || '{}')}`)}
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                          >
                            Configure with this execution
                          </Button>
                        </Stack>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ borderColor: theme.palette.custom.border, py: 4, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
                    No execution records yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${theme.palette.custom.border}` }}>
          <Typography sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
            TOTAL: {total} EXECUTIONS
          </Typography>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={(_, v) => setPage(v)}
            size="small"
            sx={{ '& .MuiPaginationItem-root': { fontSize: '0.7rem', color: theme.palette.custom.muted, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.09), color: 'primary.main' } } }}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
