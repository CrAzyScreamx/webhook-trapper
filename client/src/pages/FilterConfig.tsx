import { useEffect, useState, useCallback, Fragment } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Button, TextField, Select, MenuItem,
  IconButton, Alert, FormControl, ToggleButton, ToggleButtonGroup, Chip,
  Collapse, Divider, InputLabel, Switch,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EditIcon from '@mui/icons-material/Edit';
import { trappersApi, destinationsApi, Trapper, FilterRule, Destination } from '../api/client';
import JsonTree from '../components/JsonTree';
import Breadcrumb from '../components/Breadcrumb';
import {
  detectFieldType, OPERATORS_BY_TYPE, TYPE_BADGE_COLORS, FieldType,
} from '../utils/fieldType';
import { RuleRow, buildExprText, parseExpressionText } from '../utils/filterExpression';


// ─── Types ────────────────────────────────────────────────────────────────────

type DestForm = {
  destinationUrl: string;
  retryPolicy: string;
  authType: string;
  authValue: string;
  customAuthHeader: string;
  overrideEnabled: boolean;
  overridePayload: string;
  skipTlsVerify: boolean;
};

type SecForm = {
  rateLimit: string | number;
  rateLimitWindowMs: string | number;
  hmacSecret: string;
  hmacHeader: string;
  hmacAlgorithm: 'sha256' | 'sha1';
};

type DestResult = { label: string; url: string; status: number | null; error?: string };
type TestResult = {
  filterPassed: boolean;
  destinations: DestResult[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MONO = 'JetBrains Mono, monospace';


// ─── Shared UI Components ─────────────────────────────────────────────────────

function SectionHeader({
  label, expanded, onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Box
      onClick={onToggle}
      sx={{
        px: 2.5, py: 1.75,
        borderBottom: expanded ? `1px solid ${theme.palette.custom.border}` : 'none',
        bgcolor: theme.palette.custom.inputBg,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.12em' }}>
        {label}
      </Typography>
      {expanded
        ? <ExpandLessIcon sx={{ fontSize: 16, color: theme.palette.custom.muted }} />
        : <ExpandMoreIcon sx={{ fontSize: 16, color: theme.palette.custom.muted }} />}
    </Box>
  );
}

function FieldLabel({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Typography sx={{ fontSize: '0.58rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.5 }}>
      {text}
    </Typography>
  );
}

function SectionLabel({ text, sub }: { text: string; sub?: string }) {
  const theme = useTheme();
  return (
    <Box>
      <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.12em' }}>
        {text}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: '0.7rem', color: theme.palette.custom.muted, mt: 0.25 }}>{sub}</Typography>
      )}
    </Box>
  );
}

function LogicConnector({ logicOp, onToggle }: { logicOp: 'AND' | 'OR'; onToggle: () => void }) {
  const theme = useTheme();
  const color = logicOp === 'OR' ? theme.palette.custom.syntaxBoolean : theme.palette.primary.main;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.25, position: 'relative' }}>
      <Box sx={{ width: 1, height: 1, position: 'absolute', top: 0, borderTop: `1px solid ${theme.palette.custom.border}` }} />
      <Box
        onClick={onToggle}
        sx={{
          position: 'relative', zIndex: 1,
          px: 2.5, py: 0.5, borderRadius: 1, cursor: 'pointer',
          bgcolor: alpha(color, 0.09),
          border: `1px solid ${alpha(color, logicOp === 'OR' ? 0.27 : 0.2)}`,
          userSelect: 'none',
          transition: 'all 0.15s',
          '&:hover': { borderColor: color, bgcolor: alpha(color, 0.13) },
        }}
      >
        <Typography sx={{ fontSize: '0.7rem', fontFamily: MONO, fontWeight: 700, color, letterSpacing: '0.12em' }}>
          {logicOp}
        </Typography>
      </Box>
    </Box>
  );
}


// ─── ValueInput ───────────────────────────────────────────────────────────────

function ValueInput({
  fieldType, operator, value, onChange,
}: {
  fieldType: FieldType;
  operator: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();

  const inputSx = {
    fontFamily: MONO, fontSize: '0.78rem', height: 36,
    bgcolor: theme.palette.custom.inputBg, borderRadius: 1,
  };
  const borderSx = { '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } };

  if (fieldType === 'boolean') {
    return (
      <ToggleButtonGroup
        size="small"
        value={value ?? ''}
        exclusive
        onChange={(_, v) => onChange(v)}
        fullWidth
        sx={{
          height: 36,
          '& .MuiToggleButton-root': {
            fontSize: '0.75rem', fontFamily: MONO, py: 0.4, px: 1.5,
            color: theme.palette.custom.muted, borderColor: theme.palette.custom.border,
            bgcolor: theme.palette.custom.inputBg, borderRadius: 1,
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.09),
              color: 'primary.main',
              borderColor: 'primary.main',
            },
          },
        }}
      >
        <ToggleButton value="true">true</ToggleButton>
        <ToggleButton value="false">false</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  const isListOp = operator === 'in' || operator === 'not_in';
  const placeholder =
    fieldType === 'number' && isListOp ? '1, 2, 3' :
    fieldType === 'object' && operator === 'has_keys' ? '["key1", "key2"]' :
    fieldType === 'number' ? '0' :
    fieldType === 'string' ? 'text value' : 'value';

  return (
    <TextField
      fullWidth
      size="small"
      placeholder={placeholder}
      value={value ?? ''}
      type={fieldType === 'number' && !isListOp ? 'number' : 'text'}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{ sx: inputSx }}
      sx={borderSx}
    />
  );
}


// ─── RuleCard ─────────────────────────────────────────────────────────────────

interface RuleCardProps {
  rule: RuleRow;
  index: number;
  lastPayload: unknown;
  isDropTarget: boolean;
  onUpdate: (i: number, patch: Partial<RuleRow>) => void;
  onRemove: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragLeave: () => void;
  onDrop: (i: number, path: string) => void;
}

function RuleCard({
  rule, index, lastPayload, isDropTarget, onUpdate, onRemove, onDragOver, onDragLeave, onDrop,
}: RuleCardProps) {
  const theme = useTheme();

  const fieldType = detectFieldType(lastPayload, rule.fieldPath);
  const operators = OPERATORS_BY_TYPE[fieldType] ?? OPERATORS_BY_TYPE.unknown;
  const showValue = operators.find((o) => o.value === rule.operator)?.needsValue ?? true;
  const typeColor = TYPE_BADGE_COLORS[fieldType];

  const handleFieldChange = (fp: string) => {
    const ops = OPERATORS_BY_TYPE[detectFieldType(lastPayload, fp)] ?? OPERATORS_BY_TYPE.unknown;
    onUpdate(index, { fieldPath: fp, operator: ops[0].value as FilterRule['operator'], value: '' });
  };

  const handleDrop = (e: React.DragEvent, target?: 'input') => {
    e.preventDefault();
    const path = e.dataTransfer.getData('text/plain');
    if (path) onDrop(index, path);
    if (!target) onDragLeave();
  };

  const borderSx = { '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } };
  const inputSx = { fontFamily: MONO, fontSize: '0.78rem', height: 36, bgcolor: theme.palette.custom.inputBg, borderRadius: 1 };

  return (
    <Paper
      elevation={0}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => handleDrop(e)}
      sx={{
        p: 0, borderRadius: 1.5, position: 'relative', overflow: 'visible',
        transition: 'all 0.2s',
        border: isDropTarget
          ? `1px solid ${alpha(theme.palette.primary.main, 0.33)}`
          : `1px solid ${theme.palette.custom.border}`,
        bgcolor: theme.palette.custom.codeBg,
      }}
    >
      <Box sx={{ p: 2, pt: 2.5 }}>

        {/* Field Path */}
        <Stack direction="row" gap={1} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel text="FIELD PATH" />
            <TextField
              fullWidth size="small"
              placeholder="e.g. data.user.email"
              value={rule.fieldPath}
              onChange={(e) => handleFieldChange(e.target.value)}
              InputProps={{
                sx: inputSx,
                endAdornment: rule.fieldPath && (
                  <Chip
                    label={fieldType}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.6rem', fontFamily: MONO, fontWeight: 700,
                      color: typeColor, bgcolor: alpha(typeColor, 0.09),
                      border: `1px solid ${alpha(typeColor, 0.27)}`, mr: 0.5,
                    }}
                  />
                ),
              }}
              inputProps={{
                onDragOver: (e: React.DragEvent) => e.preventDefault(),
                onDrop: (e: React.DragEvent) => handleDrop(e, 'input'),
              }}
              sx={borderSx}
            />
          </Box>
          <IconButton
            size="small"
            onClick={() => onRemove(index)}
            sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'error.main' }, mt: 1.5, flexShrink: 0 }}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        {/* Operator + Value */}
        <Stack direction="row" gap={1.5} alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <FieldLabel text="OPERATOR" />
            <Select
              fullWidth size="small"
              value={rule.operator}
              onChange={(e) => onUpdate(index, { operator: e.target.value as FilterRule['operator'], value: '' })}
              sx={{
                fontSize: '0.78rem', height: 36, bgcolor: theme.palette.custom.inputBg, borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border },
              }}
            >
              {operators.map((op) => (
                <MenuItem key={op.value} value={op.value} sx={{ fontSize: '0.75rem' }}>{op.label}</MenuItem>
              ))}
            </Select>
          </Box>

          {showValue && (
            <Box sx={{ flex: 1 }}>
              <FieldLabel text="VALUE" />
              <ValueInput
                fieldType={fieldType}
                operator={rule.operator}
                value={rule.value}
                onChange={(v) => onUpdate(index, { value: v })}
              />
            </Box>
          )}
        </Stack>

      </Box>
    </Paper>
  );
}


// ─── TestResultPanel ──────────────────────────────────────────────────────────

function TestResultPanel({ result, expanded, onToggle }: { result: TestResult; expanded: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const passed = result.filterPassed;
  const passColor = passed ? theme.palette.secondary.main : theme.palette.error.main;
  const failedDests = result.destinations.filter((d) => !d.status || d.status < 200 || d.status >= 300);

  return (
    <Paper sx={{ mb: 2, border: `1px solid ${alpha(passColor, 0.27)}`, overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: passColor, boxShadow: `0 0 8px ${passColor}` }} />
          <Typography sx={{ fontSize: '0.75rem', fontFamily: MONO, color: passColor, fontWeight: 700, letterSpacing: '0.08em' }}>
            FILTER: {passed ? 'PASSED' : 'BLOCKED'}
          </Typography>
          {passed && failedDests.length > 0 && (
            <Typography sx={{ fontSize: '0.75rem', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', color: theme.palette.error.main }}>
              — {failedDests.length}/{result.destinations.length} URL{failedDests.length > 1 ? 's' : ''} FAILED
            </Typography>
          )}
        </Stack>
        {passed && result.destinations.length > 0 && (
          <IconButton size="small" onClick={onToggle} sx={{ color: theme.palette.custom.muted }}>
            {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}
      </Stack>

      {passed && result.destinations.length > 0 && (
        <Collapse in={expanded}>
          <Stack gap={0} sx={{ borderTop: `1px solid ${theme.palette.custom.border}` }}>
            {result.destinations.map((d, i) => {
              const ok = d.status != null && d.status >= 200 && d.status < 300;
              const rowColor = ok ? theme.palette.secondary.main : theme.palette.error.main;
              return (
                <Stack key={i} direction="row" alignItems="flex-start" gap={1.5}
                  sx={{ px: 2, py: 1.25, bgcolor: theme.palette.custom.codeBg, borderBottom: i < result.destinations.length - 1 ? `1px solid ${theme.palette.custom.border}` : 'none' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: rowColor, mt: 0.6, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography sx={{ fontSize: '0.72rem', fontFamily: MONO, fontWeight: 700, color: rowColor }}>
                        {d.status === null || d.status === 0 ? 'ERROR' : String(d.status)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary' }}>{d.label}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', fontFamily: MONO, color: theme.palette.custom.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.url}</Typography>
                    </Stack>
                    {d.error && (
                      <Typography sx={{ fontSize: '0.68rem', fontFamily: MONO, color: 'error.main', mt: 0.25 }}>
                        {d.error}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Collapse>
      )}
    </Paper>
  );
}


// ─── FilterConfig (Main) ──────────────────────────────────────────────────────

export default function FilterConfig() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  // Trapper data
  const [trapper, setTrapper] = useState<Trapper | null>(null);
  const [lastPayload, setLastPayload] = useState<unknown>(null);

  // Rules
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [groupOpen, setGroupOpen] = useState<number | null>(null);
  const [groupClose, setGroupClose] = useState<number | null>(null);

  // Forms
  const [destForm, setDestForm] = useState<DestForm>({
    destinationUrl: '', retryPolicy: 'none', authType: 'none', authValue: '', customAuthHeader: 'Authorization', overrideEnabled: false, overridePayload: '', skipTlsVerify: false,
  });
  const [secForm, setSecForm] = useState<SecForm>({
    rateLimit: '', rateLimitWindowMs: '', hmacSecret: '', hmacHeader: '', hmacAlgorithm: 'sha256',
  });

  // Destinations
  const [dests, setDests] = useState<Destination[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'broadcast' | 'fallback'>('broadcast');
  const [showDestForm, setShowDestForm] = useState(false);
  const [newDest, setNewDest] = useState({ label: '', url: '', authType: 'none', authValue: '', customAuthHeader: 'Authorization', skipTlsVerify: false, retryPolicy: 'none' });
  const [newDestErrors, setNewDestErrors] = useState({ label: false, url: false });
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [editDest, setEditDest] = useState({ label: '', url: '', authType: 'none', authValue: '', customAuthHeader: 'Authorization', skipTlsVerify: false, retryPolicy: 'none' });

  // UI: section expansion
  const [rulesExpanded, setRulesExpanded] = useState(true);
  const [destExpanded, setDestExpanded] = useState(false);
  const [secExpanded, setSecExpanded] = useState(false);

  // UI: misc
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  // Test
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testExpanded, setTestExpanded] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Expression editor
  const [exprText, setExprText] = useState('');
  const [exprError, setExprError] = useState<string | null>(null);


  // ─── Data Loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([trappersApi.get(id!), destinationsApi.list(id!)]).then(([t, d]) => {
      setTrapper(t);
      setDeliveryMode(t.deliveryMode ?? 'broadcast');
      setDestForm({ destinationUrl: t.destinationUrl, retryPolicy: t.retryPolicy, authType: t.authType, authValue: t.authValue ?? '', customAuthHeader: t.customAuthHeader ?? 'Authorization', overrideEnabled: !!t.overrideEnabled, overridePayload: t.overridePayload ?? '', skipTlsVerify: !!t.skipTlsVerify });
      setSecForm({
        rateLimit: t.rateLimit ?? '',
        rateLimitWindowMs: t.rateLimitWindowMs ?? '',
        hmacSecret: '',
        hmacHeader: t.hmacHeader ?? '',
        hmacAlgorithm: t.hmacAlgorithm ?? 'sha256',
      });
      setDests(d);
    });

    trappersApi.getRules(id!).then((r) => {
      setRules(r);
      const openIdx = r.findIndex((rule) => (rule.groupBefore ?? 0) > 0);
      const closeIdx = [...r].reverse().findIndex((rule) => (rule.groupAfter ?? 0) > 0);
      if (openIdx >= 0) setGroupOpen(openIdx);
      if (closeIdx >= 0) setGroupClose(r.length - 1 - closeIdx);
    });

    const payloadFromUrl = searchParams.get('payload');
    if (payloadFromUrl) {
      try { setLastPayload(JSON.parse(payloadFromUrl)); } catch { /* ignore */ }
    } else {
      trappersApi.getLogs(id!, { limit: 1 }).then((r) => {
        if (r.rows[0]) { try { setLastPayload(JSON.parse(r.rows[0].payload)); } catch { /* ignore */ } }
      });
    }
  }, [id]);

  const handleAddDest = async () => {
    const errors = { label: !newDest.label.trim(), url: !newDest.url.trim() };
    if (errors.label || errors.url) { setNewDestErrors(errors); return; }
    await destinationsApi.create(id!, {
      label: newDest.label,
      url: newDest.url,
      authType: newDest.authType as Destination['authType'],
      authValue: newDest.authValue || null,
      customAuthHeader: newDest.authType === 'custom' ? (newDest.customAuthHeader || 'Authorization') : null,
      skipTlsVerify: newDest.skipTlsVerify,
      retryPolicy: newDest.retryPolicy as Destination['retryPolicy'],
    });
    setNewDest({ label: '', url: '', authType: 'none', authValue: '', customAuthHeader: 'Authorization', skipTlsVerify: false, retryPolicy: 'none' });
    setNewDestErrors({ label: false, url: false });
    setShowDestForm(false);
    destinationsApi.list(id!).then(setDests);
  };

  const handleDeleteDest = async (destId: string) => {
    await destinationsApi.delete(id!, destId);
    destinationsApi.list(id!).then(setDests);
  };

  const handleEditStart = (dest: Destination) => {
    setEditingDestId(dest.id);
    setEditDest({ label: dest.label, url: dest.url, authType: dest.authType, authValue: dest.authValue ?? '', customAuthHeader: dest.customAuthHeader ?? 'Authorization', skipTlsVerify: !!dest.skipTlsVerify, retryPolicy: dest.retryPolicy });
    setShowDestForm(false);
  };

  const handleEditSave = async () => {
    if (!editingDestId) return;
    await destinationsApi.update(id!, editingDestId, {
      label: editDest.label,
      url: editDest.url,
      authType: editDest.authType as Destination['authType'],
      authValue: editDest.authValue || null,
      customAuthHeader: editDest.authType === 'custom' ? (editDest.customAuthHeader || 'Authorization') : null,
      skipTlsVerify: editDest.skipTlsVerify,
      retryPolicy: editDest.retryPolicy as Destination['retryPolicy'],
    });
    setEditingDestId(null);
    destinationsApi.list(id!).then(setDests);
  };


  // ─── Expression Sync ───────────────────────────────────────────────────────

  useEffect(() => {
    setExprText(buildExprText(rules, lastPayload));
    setExprError(null);
  }, [rules, lastPayload]);

  const applyExpression = useCallback(() => {
    const result = parseExpressionText(exprText);
    if (!result.ok) { setExprError(result.error); return; }
    setRules(result.rules);
    setGroupOpen(result.groupOpen);
    setGroupClose(result.groupClose);
    setExprError(null);
  }, [exprText]);


  // ─── Rule Mutations ────────────────────────────────────────────────────────

  const makeRule = (): RuleRow => ({
    fieldPath: '', operator: 'equals', value: '', order: rules.length, logicOp: 'AND', groupBefore: 0, groupAfter: 0,
  });

  const addRule = useCallback(() => {
    setRules((prev) => [...prev, makeRule()]);
  }, [rules.length]);

  const addGroup = useCallback(() => {
    const r = { ...makeRule(), groupBefore: 1, groupAfter: 1 };
    setRules((prev) => [...prev, r]);
    setGroupOpen(rules.length);
    setGroupClose(rules.length);
  }, [rules.length]);

  const removeRule = useCallback((i: number) => {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
    setGroupOpen((open) => {
      if (open === null) return null;
      if (i === open) return null;
      return i < open ? open - 1 : open;
    });
    setGroupClose((close) => {
      if (close === null) return null;
      if (i === close) return close - 1;
      return i < close ? close - 1 : close;
    });
  }, []);

  const updateRule = useCallback((i: number, patch: Partial<RuleRow>) => {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }, []);

  const handleDrop = useCallback((i: number, path: string) => {
    updateRule(i, { fieldPath: path });
    setDropTarget(null);
  }, [updateRule]);


  // ─── Save & Test ───────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    await trappersApi.setRules(id!, rules.map((r, i) => ({ ...r, order: i })));
    await trappersApi.update(id!, {
      ...destForm,
      deliveryMode,
      customAuthHeader: destForm.authType === 'custom' ? (destForm.customAuthHeader || 'Authorization') : null,
      overrideEnabled: destForm.overrideEnabled,
      overridePayload: destForm.overrideEnabled && destForm.overridePayload ? destForm.overridePayload : null,
      skipTlsVerify: destForm.skipTlsVerify,
      rateLimit: secForm.rateLimit === '' ? null : Number(secForm.rateLimit),
      rateLimitWindowMs: secForm.rateLimitWindowMs === '' ? null : Number(secForm.rateLimitWindowMs),
      hmacHeader: secForm.hmacHeader || null,
      hmacAlgorithm: secForm.hmacAlgorithm,
      ...(secForm.hmacSecret ? { hmacSecret: secForm.hmacSecret } : {}),
    } as Partial<Trapper>);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [id, rules, destForm, secForm]);

  const testRule = useCallback(async () => {
    if (!lastPayload) return;
    setTestLoading(true);
    try {
      const result = await trappersApi.testRules(id!, rules, lastPayload);
      setTestResult(result);
      setTestExpanded(false);
    } catch {
      setTestResult({ filterPassed: false, destinations: [] });
    } finally {
      setTestLoading(false);
    }
  }, [id, rules, lastPayload]);


  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>

      {/* Breadcrumb + Header */}
      <Breadcrumb items={[
        { label: 'Trappers', path: '/trappers' },
        { label: trapper?.trapId ?? '...', path: `/trappers/${id}` },
        { label: 'Configure' },
      ]} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: 'text.primary' }}>
          Configure Rule: {trapper?.name ?? '...'}
        </Typography>
        <Stack direction="row" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon sx={{ fontSize: 14 }} />}
            onClick={testRule}
            disabled={!lastPayload || testLoading}
            sx={{ fontSize: '0.78rem', borderColor: theme.palette.custom.border, color: theme.palette.custom.muted, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
          >
            Test Rule
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
            Save & Activate
          </Button>
        </Stack>
      </Stack>

      {saved && <Alert severity="success" sx={{ mb: 2, fontSize: '0.78rem' }}>Saved & activated successfully.</Alert>}
      {testResult && <TestResultPanel result={testResult} expanded={testExpanded} onToggle={() => setTestExpanded((v) => !v)} />}


      {/* 00 — Source Payload (last execution only) */}
      {lastPayload != null && (
        <Paper sx={{ p: 2.5, mb: 2, border: `1px solid ${theme.palette.custom.border}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <SectionLabel text="LAST EXECUTION PAYLOAD" />
            <Box sx={{ px: 1, py: 0.3, bgcolor: theme.palette.custom.border, borderRadius: 0.5 }}>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: theme.palette.custom.muted }}>
                READ-ONLY
              </Typography>
            </Box>
          </Stack>
          <JsonTree data={lastPayload} />
        </Paper>
      )}


      {/* 01 — Filter Rules */}
      <Paper sx={{ mb: 2, border: `1px solid ${theme.palette.custom.border}`, overflow: 'hidden' }}>
        <SectionHeader label="01. FILTER RULES" expanded={rulesExpanded} onToggle={() => setRulesExpanded((v) => !v)} />

        <Collapse in={rulesExpanded}>
          {rules.length === 0 ? (

            // Empty state
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.72rem', fontFamily: MONO, color: theme.palette.custom.muted, mb: 1.5 }}>
                No rules — all webhooks pass through
              </Typography>
              <Stack direction="row" gap={1} justifyContent="center">
                <Button
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={addRule}
                  sx={{ fontSize: '0.72rem', color: 'primary.main', border: `1px solid ${alpha(theme.palette.primary.main, 0.27)}`, borderRadius: 1, px: 2, py: 0.6, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                >
                  Add First Rule
                </Button>
                <Button
                  startIcon={<FilterAltIcon sx={{ fontSize: 14 }} />}
                  onClick={addGroup}
                  sx={{ fontSize: '0.72rem', color: theme.palette.custom.syntaxNumber, border: `1px solid ${alpha(theme.palette.custom.syntaxNumber, 0.2)}`, borderRadius: 1, px: 2, py: 0.6, '&:hover': { bgcolor: alpha(theme.palette.custom.syntaxNumber, 0.03) } }}
                >
                  Add First Group
                </Button>
              </Stack>
            </Box>

          ) : (

            // Rules list
            <Box sx={{ p: 2 }}>
              {rules.map((rule, i) => {
                const inGroup = groupOpen !== null && groupClose !== null && i >= groupOpen && i <= groupClose;
                const card = (
                  <RuleCard
                    key={i}
                    rule={rule}
                    index={i}
                    lastPayload={lastPayload}
                    isDropTarget={dropTarget === i}
                    onUpdate={updateRule}
                    onRemove={removeRule}
                    onDragOver={setDropTarget}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={handleDrop}
                  />
                );

                return (
                  <Fragment key={i}>
                    {inGroup
                      ? <Box sx={{ ml: 2, pl: 1.5, borderLeft: `2px solid ${alpha(theme.palette.custom.syntaxNumber, 0.2)}` }}>{card}</Box>
                      : card}
                    {i < rules.length - 1 && (
                      <LogicConnector
                        logicOp={rule.logicOp ?? 'AND'}
                        onToggle={() => updateRule(i, { logicOp: rule.logicOp === 'AND' ? 'OR' : 'AND' })}
                      />
                    )}
                  </Fragment>
                );
              })}

              {/* Add buttons */}
              <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
                <Button
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={addRule}
                  sx={{ flex: 1, fontSize: '0.72rem', color: theme.palette.custom.muted, border: `1px dashed ${theme.palette.custom.border}`, borderRadius: 1.5, py: 1, '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.03) } }}
                >
                  Add Rule
                </Button>
                <Button
                  startIcon={<FilterAltIcon sx={{ fontSize: 14 }} />}
                  onClick={addGroup}
                  sx={{ flex: 1, fontSize: '0.72rem', color: theme.palette.custom.syntaxNumber, border: `1px dashed ${alpha(theme.palette.custom.syntaxNumber, 0.2)}`, borderRadius: 1.5, py: 1, '&:hover': { borderColor: theme.palette.custom.syntaxNumber, color: theme.palette.custom.syntaxNumber, bgcolor: alpha(theme.palette.custom.syntaxNumber, 0.03) } }}
                >
                  Add Group
                </Button>
              </Stack>
            </Box>

          )}

          {/* Expression editor — shown only when rules exist */}
          {rules.length > 0 && (
            <Box sx={{ borderTop: `1px solid ${theme.palette.custom.border}`, bgcolor: theme.palette.custom.inputBg, px: 2.5, py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontSize: '0.58rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.1em' }}>
                  EXPRESSION EDITOR
                </Typography>
                {exprError && (
                  <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: 'error.main' }}>
                    {exprError}
                  </Typography>
                )}
              </Stack>
              <TextField
                fullWidth multiline minRows={2}
                value={exprText}
                onChange={(e) => setExprText(e.target.value)}
                onBlur={applyExpression}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applyExpression(); } }}
                placeholder="e.g. (data.type equals webhook AND data.status is_true) OR data.source contains api"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: MONO, fontSize: '0.72rem', color: 'text.primary',
                    bgcolor: theme.palette.custom.codeBg, borderRadius: 1,
                    '& fieldset': { borderColor: theme.palette.custom.border },
                    '&:hover fieldset': { borderColor: theme.palette.custom.hoverBorder },
                  },
                }}
              />
              <Typography sx={{ fontSize: '0.55rem', fontFamily: MONO, color: theme.palette.custom.hoverBorder, mt: 0.5 }}>
                Press Enter or click outside to apply
              </Typography>
            </Box>
          )}

          {/* Rule count badge */}
          {rules.length > 0 && (
            <Box sx={{ borderTop: `1px solid ${theme.palette.custom.border}`, px: 2.5, py: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'secondary.main', boxShadow: `0 0 6px ${theme.palette.secondary.main}` }} />
              <Typography sx={{ fontSize: '0.62rem', fontFamily: MONO, color: 'secondary.main', letterSpacing: '0.06em' }}>
                {rules.length} RULE{rules.length !== 1 ? 'S' : ''} CONFIGURED
              </Typography>
            </Box>
          )}
        </Collapse>
      </Paper>


      {/* 02 — Destinations (merged: endpoint config + fan-out/fallback) */}
      <Paper sx={{ mb: 2, border: `1px solid ${theme.palette.custom.border}` }}>
        <SectionHeader
          label={`02. DESTINATIONS${dests.length > 0 ? ` (${dests.length})` : ''}`}
          expanded={destExpanded}
          onToggle={() => setDestExpanded((v) => !v)}
        />
        <Collapse in={destExpanded}>
          <Box sx={{ p: 2.5 }}>
            <Stack gap={2}>

              {/* ── Delivery Mode ───────────────────────────────────── */}
              <Box>
                <Typography sx={{ fontSize: '0.58rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 1 }}>
                  DELIVERY MODE
                </Typography>
                <Stack direction="row" gap={1.5}>
                  {(['broadcast', 'fallback'] as const).map((mode) => {
                    const active = deliveryMode === mode;
                    const label = mode === 'broadcast' ? 'Broadcast — send to all' : 'Fallback — try in order';
                    const sub = mode === 'broadcast' ? 'All destinations receive every webhook simultaneously' : 'Try first destination; on failure move to next';
                    return (
                      <Box key={mode} onClick={() => setDeliveryMode(mode)} sx={{
                        flex: 1, p: 1.5, borderRadius: 1, cursor: 'pointer',
                        border: `1px solid ${active ? theme.palette.primary.main : theme.palette.custom.border}`,
                        bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : theme.palette.custom.codeBg,
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: active ? 'primary.main' : 'text.primary', mb: 0.25 }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: theme.palette.custom.muted }}>{sub}</Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <Divider sx={{ borderColor: theme.palette.custom.border }} />

              {/* ── Destination list ─────────────────────────────────── */}
              <Stack gap={1}>
                {dests.map((dest, idx) => (
                  editingDestId === dest.id ? (
                    /* Inline edit form */
                    <Stack key={dest.id} gap={1.5} sx={{ p: 2, border: `1px solid ${theme.palette.primary.main}`, borderRadius: 1, bgcolor: theme.palette.custom.inputBg }}>
                      <Stack direction="row" gap={1.5} flexWrap="wrap">
                        <TextField size="small" label="Label" value={editDest.label}
                          onChange={(e) => setEditDest((d) => ({ ...d, label: e.target.value }))}
                          sx={{ width: 150, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                          InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                          InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                        <TextField size="small" label="URL" value={editDest.url}
                          onChange={(e) => setEditDest((d) => ({ ...d, url: e.target.value }))}
                          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                          InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                          InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                      </Stack>
                      <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                          <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Auth Type</InputLabel>
                          <Select label="Auth Type" value={editDest.authType}
                            onChange={(e) => setEditDest((d) => ({ ...d, authType: e.target.value }))}
                            sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}>
                            {['none', 'bearer', 'basic', 'custom'].map((t) => (
                              <MenuItem key={t} value={t} sx={{ fontSize: '0.72rem' }}>{t}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {editDest.authType !== 'none' && (
                          <TextField size="small" label="Auth Value" value={editDest.authValue} type="password"
                            onChange={(e) => setEditDest((d) => ({ ...d, authValue: e.target.value }))}
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                            InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                            InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                        )}
                        {editDest.authType === 'custom' && (
                          <TextField size="small" label="Header Name" value={editDest.customAuthHeader}
                            onChange={(e) => setEditDest((d) => ({ ...d, customAuthHeader: e.target.value }))}
                            placeholder="Authorization"
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                            InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                            InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                        )}
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Retry Policy</InputLabel>
                          <Select label="Retry Policy" value={editDest.retryPolicy}
                            onChange={(e) => setEditDest((d) => ({ ...d, retryPolicy: e.target.value }))}
                            sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}>
                            {['none', 'immediate', 'exponential'].map((t) => (
                              <MenuItem key={t} value={t} sx={{ fontSize: '0.72rem' }}>{t}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Stack direction="row" alignItems="center" gap={0.5}
                          sx={{ px: 1.25, height: 36, border: `1px solid ${theme.palette.custom.border}`, borderRadius: 1, bgcolor: theme.palette.custom.codeBg, cursor: 'pointer' }}
                          onClick={() => setEditDest((d) => ({ ...d, skipTlsVerify: !d.skipTlsVerify }))}>
                          <Switch size="small" checked={editDest.skipTlsVerify} color="warning"
                            onChange={(e) => setEditDest((d) => ({ ...d, skipTlsVerify: e.target.checked }))} />
                          <Typography sx={{ fontSize: '0.65rem', fontFamily: MONO, color: theme.palette.custom.muted, whiteSpace: 'nowrap' }}>Skip TLS</Typography>
                        </Stack>
                        <Stack direction="row" gap={1} ml="auto">
                          <Button variant="contained" size="small" onClick={handleEditSave} sx={{ fontSize: '0.72rem', height: 36 }}>Save</Button>
                          <Button size="small" onClick={() => setEditingDestId(null)} sx={{ fontSize: '0.72rem', height: 36, color: theme.palette.custom.muted }}>Cancel</Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  ) : (
                    /* Read row */
                    <Stack key={dest.id} direction="row" alignItems="center" gap={1.5}
                      sx={{ px: 2, py: 1.25, border: `1px solid ${theme.palette.custom.border}`, borderRadius: 1, bgcolor: theme.palette.custom.codeBg }}>
                      {deliveryMode === 'fallback' && (
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: 'primary.main', fontWeight: 700 }}>{idx + 1}</Typography>
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', mb: 0.25 }}>{dest.label}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontFamily: MONO, color: theme.palette.custom.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest.url}</Typography>
                      </Box>
                      <Chip label={dest.authType} size="small" sx={{ fontSize: '0.58rem', height: 18, fontFamily: MONO }} />
                      {!!dest.skipTlsVerify && <Chip label="TLS skip" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.58rem', height: 18, fontFamily: MONO }} />}
                      <Chip label={dest.retryPolicy} size="small" variant="outlined" sx={{ fontSize: '0.58rem', height: 18, fontFamily: MONO, borderColor: theme.palette.custom.border }} />
                      <IconButton size="small" onClick={() => handleEditStart(dest)} sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'primary.main' } }}>
                        <EditIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteDest(dest.id)} sx={{ color: theme.palette.custom.muted, '&:hover': { color: 'error.main' } }}>
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Stack>
                  )
                ))}
              </Stack>

              {/* Add form */}
              {showDestForm && (
                <Stack gap={1.5} sx={{ p: 2, border: `1px solid ${theme.palette.custom.border}`, borderRadius: 1, bgcolor: theme.palette.custom.inputBg }}>
                  <Stack direction="row" gap={1.5} flexWrap="wrap">
                    <TextField size="small" label="Label" value={newDest.label}
                      onChange={(e) => { setNewDest((d) => ({ ...d, label: e.target.value })); if (newDestErrors.label) setNewDestErrors((e) => ({ ...e, label: false })); }}
                      error={newDestErrors.label}
                      helperText={newDestErrors.label ? 'Required' : undefined}
                      sx={{ width: 150, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                      InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                      InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                    <TextField size="small" label="URL" value={newDest.url}
                      onChange={(e) => { setNewDest((d) => ({ ...d, url: e.target.value })); if (newDestErrors.url) setNewDestErrors((e) => ({ ...e, url: false })); }}
                      error={newDestErrors.url}
                      helperText={newDestErrors.url ? 'Required' : undefined}
                      sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                      InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                      InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                  </Stack>
                  <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Auth Type</InputLabel>
                      <Select label="Auth Type" value={newDest.authType}
                        onChange={(e) => setNewDest((d) => ({ ...d, authType: e.target.value }))}
                        sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}>
                        {['none', 'bearer', 'basic', 'custom'].map((t) => (
                          <MenuItem key={t} value={t} sx={{ fontSize: '0.72rem' }}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {newDest.authType !== 'none' && (
                      <TextField size="small" label="Auth Value" value={newDest.authValue} type="password"
                        onChange={(e) => setNewDest((d) => ({ ...d, authValue: e.target.value }))}
                        sx={{ minWidth: 160, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                        InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                        InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                    )}
                    {newDest.authType === 'custom' && (
                      <TextField size="small" label="Header Name" value={newDest.customAuthHeader}
                        onChange={(e) => setNewDest((d) => ({ ...d, customAuthHeader: e.target.value }))}
                        placeholder="Authorization"
                        sx={{ minWidth: 160, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                        InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                        InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }} />
                    )}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Retry Policy</InputLabel>
                      <Select label="Retry Policy" value={newDest.retryPolicy}
                        onChange={(e) => setNewDest((d) => ({ ...d, retryPolicy: e.target.value }))}
                        sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}>
                        {['none', 'immediate', 'exponential'].map((t) => (
                          <MenuItem key={t} value={t} sx={{ fontSize: '0.72rem' }}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Stack direction="row" alignItems="center" gap={0.5}
                      sx={{ px: 1.25, height: 36, border: `1px solid ${theme.palette.custom.border}`, borderRadius: 1, bgcolor: theme.palette.custom.codeBg, cursor: 'pointer' }}
                      onClick={() => setNewDest((d) => ({ ...d, skipTlsVerify: !d.skipTlsVerify }))}>
                      <Switch size="small" checked={newDest.skipTlsVerify} color="warning"
                        onChange={(e) => setNewDest((d) => ({ ...d, skipTlsVerify: e.target.checked }))} />
                      <Typography sx={{ fontSize: '0.65rem', fontFamily: MONO, color: theme.palette.custom.muted, whiteSpace: 'nowrap' }}>Skip TLS</Typography>
                    </Stack>
                    <Stack direction="row" gap={1} ml="auto">
                      <Button variant="contained" size="small" onClick={handleAddDest} sx={{ fontSize: '0.72rem', height: 36 }}>Add</Button>
                      <Button size="small" onClick={() => { setShowDestForm(false); setNewDestErrors({ label: false, url: false }); }} sx={{ fontSize: '0.72rem', height: 36, color: theme.palette.custom.muted }}>Cancel</Button>
                    </Stack>
                  </Stack>
                </Stack>
              )}

              {/* Always-visible Add Destination button */}
              {!showDestForm && (
                <Button startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setShowDestForm(true); setEditingDestId(null); }}
                  sx={{ fontSize: '0.72rem', color: 'primary.main', border: `1px dashed ${alpha(theme.palette.primary.main, 0.27)}`, borderRadius: 1, px: 2, py: 0.75, alignSelf: 'flex-start', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
                  Add Destination
                </Button>
              )}

              <Divider sx={{ borderColor: theme.palette.custom.border }} />

              {/* ── Payload Override (applies to all destinations) ────── */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.12em' }}>PAYLOAD OVERRIDE</Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: theme.palette.custom.muted, mt: 0.25 }}>Send a static JSON to all destinations instead of the filtered payload</Typography>
                </Box>
                <Switch size="small" checked={destForm.overrideEnabled}
                  onChange={(e) => setDestForm({ ...destForm, overrideEnabled: e.target.checked })} color="primary" />
              </Stack>

              {destForm.overrideEnabled && (
                <Box>
                  <Typography sx={{ fontSize: '0.58rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.5 }}>
                    OVERRIDE JSON
                  </Typography>
                  <TextField fullWidth multiline minRows={4}
                    placeholder={'{\n  "event": "override",\n  "source": "trapper"\n}'}
                    value={destForm.overridePayload}
                    onChange={(e) => setDestForm({ ...destForm, overridePayload: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: MONO, fontSize: '0.72rem', color: 'text.primary',
                        bgcolor: theme.palette.custom.codeBg, borderRadius: 1,
                        '& fieldset': { borderColor: theme.palette.custom.border },
                        '&:hover fieldset': { borderColor: theme.palette.custom.hoverBorder },
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: '0.58rem', fontFamily: MONO, color: theme.palette.custom.hoverBorder, mt: 0.5 }}>
                    Use {'{{'}'field.path'{'}}'}  to inject values from the original payload
                  </Typography>
                  {destForm.overridePayload && !(() => { try { JSON.parse(destForm.overridePayload); return true; } catch { return false; } })() && (
                    <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: 'error.main', mt: 0.5 }}>Invalid JSON</Typography>
                  )}
                </Box>
              )}

            </Stack>
          </Box>
        </Collapse>
      </Paper>


      {/* 03 — Security */}
      <Paper sx={{ mb: 3, border: `1px solid ${theme.palette.custom.border}` }}>
        <SectionHeader label="03. SECURITY" expanded={secExpanded} onToggle={() => setSecExpanded((v) => !v)} />

        <Collapse in={secExpanded}>
          <Box sx={{ p: 2.5 }}>
            <Stack gap={2}>

              <SectionLabel text="RATE LIMITING" />
              <Stack direction="row" gap={2}>
                <TextField
                  label="Max requests" fullWidth size="small" type="number"
                  value={secForm.rateLimit}
                  onChange={(e) => setSecForm({ ...secForm, rateLimit: e.target.value })}
                  placeholder="Unlimited"
                  InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                  InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                />
                <TextField
                  label="Per (ms)" fullWidth size="small" type="number"
                  value={secForm.rateLimitWindowMs}
                  onChange={(e) => setSecForm({ ...secForm, rateLimitWindowMs: e.target.value })}
                  placeholder="60000"
                  InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                  InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                />
              </Stack>

              <Divider sx={{ borderColor: theme.palette.custom.border }} />

              <SectionLabel text="INCOMING HMAC VERIFICATION" />
              <TextField
                label="HMAC Secret" fullWidth size="small" type="password"
                value={secForm.hmacSecret}
                onChange={(e) => setSecForm({ ...secForm, hmacSecret: e.target.value })}
                placeholder={trapper?.hmacConfigured ? '••••••• (configured)' : 'Enter secret'}
                InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
              />
              <Stack direction="row" gap={2}>
                <TextField
                  label="Signature Header" fullWidth size="small"
                  value={secForm.hmacHeader}
                  onChange={(e) => setSecForm({ ...secForm, hmacHeader: e.target.value })}
                  placeholder="x-hub-signature-256"
                  InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                  InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Algorithm</InputLabel>
                  <Select
                    label="Algorithm"
                    value={secForm.hmacAlgorithm}
                    onChange={(e) => setSecForm({ ...secForm, hmacAlgorithm: e.target.value as 'sha256' | 'sha1' })}
                    sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                  >
                    <MenuItem value="sha256" sx={{ fontSize: '0.72rem' }}>sha256</MenuItem>
                    <MenuItem value="sha1" sx={{ fontSize: '0.72rem' }}>sha1</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

            </Stack>
          </Box>
        </Collapse>
      </Paper>

    </Box>
  );
}
