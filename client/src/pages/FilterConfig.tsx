import { useEffect, useState, useCallback, Fragment } from 'react';
import { useParams } from 'react-router-dom';
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
import { trappersApi, Trapper, FilterRule } from '../api/client';
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
  overrideEnabled: boolean;
  overridePayload: string;
};

type SecForm = {
  rateLimit: string | number;
  rateLimitWindowMs: string | number;
  hmacSecret: string;
  hmacHeader: string;
  hmacAlgorithm: 'sha256' | 'sha1';
};

type TestResult = {
  filterPassed: boolean;
  destination?: { status: number; body: unknown; error?: string };
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
  const destStatus = result.destination?.status;
  const destOk = destStatus && destStatus >= 200 && destStatus < 300;

  // Pre-compute body as string so `unknown` never flows into JSX children
  const bodyText: string | null = result.destination?.body != null
    ? (typeof result.destination.body === 'string'
        ? result.destination.body
        : JSON.stringify(result.destination.body, null, 2))
    : null;

  return (
    <Paper sx={{ mb: 2, border: `1px solid ${alpha(passColor, 0.27)}`, overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: passColor, boxShadow: `0 0 8px ${passColor}` }} />
          <Typography sx={{ fontSize: '0.75rem', fontFamily: MONO, color: passColor, fontWeight: 700, letterSpacing: '0.08em' }}>
            FILTER: {passed ? 'PASSED' : 'BLOCKED'}
          </Typography>
          {result.destination && (
            <Typography sx={{
              fontSize: '0.75rem', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em',
              color: destOk ? theme.palette.secondary.main : theme.palette.error.main,
            }}>
              DEST: {destStatus === 0 ? 'ERROR' : `${destStatus}`}
            </Typography>
          )}
        </Stack>
        <IconButton size="small" onClick={onToggle} sx={{ color: theme.palette.custom.muted }}>
          {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Stack>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, bgcolor: theme.palette.custom.codeBg, borderTop: `1px solid ${theme.palette.custom.border}` }}>
          {result.destination?.error && (
            <Typography sx={{ fontSize: '0.7rem', fontFamily: MONO, color: 'error.main', mb: 1 }}>
              ✕ {result.destination.error}
            </Typography>
          )}
          {bodyText != null && (
            <>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.5 }}>
                DESTINATION RESPONSE
              </Typography>
              <Box sx={{
                p: 1.5, borderRadius: 1, border: `1px solid ${theme.palette.custom.border}`,
                bgcolor: theme.palette.custom.inputBg, maxHeight: 200, overflow: 'auto',
              }}>
                <Typography sx={{ fontSize: '0.72rem', fontFamily: MONO, color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                  {bodyText}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}


// ─── FilterConfig (Main) ──────────────────────────────────────────────────────

export default function FilterConfig() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();

  // Trapper data
  const [trapper, setTrapper] = useState<Trapper | null>(null);
  const [lastPayload, setLastPayload] = useState<unknown>(null);

  // Rules
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [groupOpen, setGroupOpen] = useState<number | null>(null);
  const [groupClose, setGroupClose] = useState<number | null>(null);

  // Forms
  const [destForm, setDestForm] = useState<DestForm>({
    destinationUrl: '', retryPolicy: 'none', authType: 'none', authValue: '', overrideEnabled: false, overridePayload: '',
  });
  const [secForm, setSecForm] = useState<SecForm>({
    rateLimit: '', rateLimitWindowMs: '', hmacSecret: '', hmacHeader: '', hmacAlgorithm: 'sha256',
  });

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
    trappersApi.get(id!).then((t) => {
      setTrapper(t);
      setDestForm({ destinationUrl: t.destinationUrl, retryPolicy: t.retryPolicy, authType: t.authType, authValue: t.authValue ?? '', overrideEnabled: t.overrideEnabled ?? false, overridePayload: t.overridePayload ?? '' });
      setSecForm({
        rateLimit: t.rateLimit ?? '',
        rateLimitWindowMs: t.rateLimitWindowMs ?? '',
        hmacSecret: '',
        hmacHeader: t.hmacHeader ?? '',
        hmacAlgorithm: t.hmacAlgorithm ?? 'sha256',
      });
    });

    trappersApi.getRules(id!).then((r) => {
      setRules(r);
      const openIdx = r.findIndex((rule) => (rule.groupBefore ?? 0) > 0);
      const closeIdx = [...r].reverse().findIndex((rule) => (rule.groupAfter ?? 0) > 0);
      if (openIdx >= 0) setGroupOpen(openIdx);
      if (closeIdx >= 0) setGroupClose(r.length - 1 - closeIdx);
    });

    trappersApi.getLogs(id!, { limit: 1 }).then((r) => {
      if (r.rows[0]) { try { setLastPayload(JSON.parse(r.rows[0].payload)); } catch { /* ignore */ } }
    });
  }, [id]);


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
      overrideEnabled: destForm.overrideEnabled,
      overridePayload: destForm.overrideEnabled && destForm.overridePayload ? destForm.overridePayload : null,
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
      setTestResult({ filterPassed: false, destination: { status: 0, body: null, error: 'Failed to run test' } });
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


      {/* 02 — Destination Endpoint */}
      <Paper sx={{ mb: 2, border: `1px solid ${theme.palette.custom.border}` }}>
        <SectionHeader label="02. DESTINATION ENDPOINT" expanded={destExpanded} onToggle={() => setDestExpanded((v) => !v)} />

        <Collapse in={destExpanded}>
          <Box sx={{ p: 2.5 }}>
            <Stack gap={2}>

              <TextField
                label="Destination URL" fullWidth size="small"
                value={destForm.destinationUrl}
                onChange={(e) => setDestForm({ ...destForm, destinationUrl: e.target.value })}
                placeholder="https://example.com/webhook"
                InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
              />

              <Divider sx={{ borderColor: theme.palette.custom.border }} />

              <Stack direction="row" gap={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Retry Policy</InputLabel>
                  <Select
                    label="Retry Policy"
                    value={destForm.retryPolicy}
                    onChange={(e) => setDestForm({ ...destForm, retryPolicy: e.target.value })}
                    sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                  >
                    <MenuItem value="none" sx={{ fontSize: '0.72rem' }}>None</MenuItem>
                    <MenuItem value="immediate" sx={{ fontSize: '0.72rem' }}>Immediate</MenuItem>
                    <MenuItem value="exponential" sx={{ fontSize: '0.72rem' }}>Exponential Backoff</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: MONO, fontSize: '0.72rem' }}>Auth Type</InputLabel>
                  <Select
                    label="Auth Type"
                    value={destForm.authType}
                    onChange={(e) => setDestForm({ ...destForm, authType: e.target.value })}
                    sx={{ fontSize: '0.72rem', fontFamily: MONO, height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                  >
                    <MenuItem value="none" sx={{ fontSize: '0.72rem' }}>None</MenuItem>
                    <MenuItem value="bearer" sx={{ fontSize: '0.72rem' }}>Bearer Token</MenuItem>
                    <MenuItem value="basic" sx={{ fontSize: '0.72rem' }}>Basic</MenuItem>
                    <MenuItem value="hmac" sx={{ fontSize: '0.72rem' }}>HMAC</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {destForm.authType !== 'none' && (
                <TextField
                  label="Auth Value" fullWidth size="small" type="password"
                  value={destForm.authValue}
                  onChange={(e) => setDestForm({ ...destForm, authValue: e.target.value })}
                  InputProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem', height: 36 } }}
                  InputLabelProps={{ sx: { fontFamily: MONO, fontSize: '0.72rem' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.border } }}
                />
              )}

              <Divider sx={{ borderColor: theme.palette.custom.border }} />

              {/* Destination Override */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.12em' }}>
                    PAYLOAD OVERRIDE
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: theme.palette.custom.muted, mt: 0.25 }}>
                    Send a static JSON instead of the filtered payload
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={destForm.overrideEnabled}
                  onChange={(e) => setDestForm({ ...destForm, overrideEnabled: e.target.checked })}
                  color="primary"
                />
              </Stack>

              {destForm.overrideEnabled && (
                <Box>
                  <Typography sx={{ fontSize: '0.58rem', fontFamily: MONO, color: theme.palette.custom.muted, letterSpacing: '0.1em', mb: 0.5 }}>
                    OVERRIDE JSON
                  </Typography>
                  <TextField
                    fullWidth multiline minRows={4}
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
                  {destForm.overridePayload && !(() => { try { JSON.parse(destForm.overridePayload); return true; } catch { return false; } })() && (
                    <Typography sx={{ fontSize: '0.6rem', fontFamily: MONO, color: 'error.main', mt: 0.5 }}>
                      Invalid JSON
                    </Typography>
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
