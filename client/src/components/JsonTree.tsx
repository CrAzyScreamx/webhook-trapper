import { useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface JsonTreeProps {
  data: unknown;
}

interface NodeProps {
  keyName: string;
  value: unknown;
  path: string;
  depth: number;
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value.length > 30 ? value.slice(0, 30) + '…' : value}"`;
  if (typeof value === 'object') return Array.isArray(value) ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`;
  return String(value);
}

function isLeaf(value: unknown): boolean {
  return value === null || typeof value !== 'object';
}

function Node({ keyName, value, path, depth }: NodeProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(depth < 2);
  const isObj = value !== null && typeof value === 'object';
  const isArr = Array.isArray(value);
  const entries: [string, unknown][] = isObj
    ? isArr
      ? (value as unknown[]).map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>)
    : [];

  const getTypeColor = (val: unknown): string => {
    if (val === null) return theme.palette.error.main;
    const map: Record<string, string> = {
      string: theme.palette.secondary.main,
      number: theme.palette.custom.syntaxNumber,
      boolean: theme.palette.custom.syntaxBoolean,
    };
    return map[typeof val] ?? theme.palette.text.primary;
  };

  const handleDragStart = (e: React.DragEvent, dragPath: string) => {
    e.dataTransfer.setData('text/plain', dragPath);
    e.dataTransfer.effectAllowed = 'copy';
    e.stopPropagation();
  };

  return (
    <Box>
      <Box
        draggable
        onDragStart={(e) => handleDragStart(e, path)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          pl: depth * 1.5,
          py: 0.3,
          borderRadius: 0.5,
          cursor: 'grab',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '&:hover .drag-handle': { opacity: 1 },
          '&:active': { cursor: 'grabbing', bgcolor: alpha(theme.palette.primary.main, 0.08) },
        }}
        onClick={() => isObj && setOpen((o) => !o)}
      >
        <Box sx={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', color: theme.palette.custom.muted }}>
          {isObj && entries.length > 0
            ? open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />
            : null}
        </Box>

        <Typography sx={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', flexShrink: 0 }}>
          {keyName}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, flexShrink: 0, mx: 0.25 }}>:</Typography>

        <Typography sx={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: getTypeColor(value), flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isObj && !open ? formatValue(value) : isLeaf(value) ? formatValue(value) : ''}
        </Typography>

        <Box
          className="drag-handle"
          draggable
          onDragStart={(e) => handleDragStart(e, path)}
          onClick={(e) => e.stopPropagation()}
          title={`Drag to rule → path: ${path}`}
          sx={{
            opacity: 0, cursor: 'grab',
            color: theme.palette.custom.muted, display: 'flex', alignItems: 'center',
            px: 0.5, borderRadius: 0.5, flexShrink: 0,
            transition: 'opacity 0.15s',
            '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.09) },
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 14 }} />
        </Box>
      </Box>

      {isObj && open && entries.length > 0 && (
        <Box>
          {entries.map(([k, v]) => (
            <Node
              key={k}
              keyName={isArr ? `[${k}]` : k}
              value={v}
              path={isArr ? `${path}[${k}]` : path ? `${path}.${k}` : k}
              depth={depth + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function JsonTree({ data }: JsonTreeProps) {
  const theme = useTheme();

  if (!data || typeof data !== 'object') {
    return (
      <Box sx={{ bgcolor: theme.palette.custom.codeBg, borderRadius: 1, p: 2, border: `1px solid ${theme.palette.custom.border}` }}>
        <Typography sx={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted }}>
          // No payload received yet — send a webhook to capture a sample
        </Typography>
      </Box>
    );
  }

  const isArr = Array.isArray(data);
  const entries: [string, unknown][] = isArr
    ? (data as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(data as Record<string, unknown>);

  return (
    <Box sx={{ bgcolor: theme.palette.custom.codeBg, borderRadius: 1, p: 1.5, border: `1px solid ${theme.palette.custom.border}`, maxHeight: 260, overflowY: 'auto' }}>
      <Stack direction="row" alignItems="center" gap={0.75} mb={1} sx={{ px: 0.5, opacity: 0.6 }}>
        <DragIndicatorIcon sx={{ fontSize: 12, color: theme.palette.custom.muted }} />
        <Typography sx={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: theme.palette.custom.muted, letterSpacing: '0.08em' }}>
          HOVER A FIELD AND DRAG IT TO A RULE ROW
        </Typography>
      </Stack>
      {entries.map(([k, v]) => (
        <Node key={k} keyName={k} value={v} path={k} depth={0} />
      ))}
    </Box>
  );
}
