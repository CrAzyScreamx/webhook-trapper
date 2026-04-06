import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface JsonViewerProps {
  data: unknown;
  maxHeight?: string | number;
}

interface SyntaxColors {
  key: string;
  string: string;
  boolean: string;
  null: string;
  number: string;
}

function colorize(json: string, colors: SyntaxColors): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:${colors.key}">${match}</span>`;
        return `<span style="color:${colors.string}">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span style="color:${colors.boolean}">${match}</span>`;
      if (/null/.test(match)) return `<span style="color:${colors.null}">${match}</span>`;
      return `<span style="color:${colors.number}">${match}</span>`;
    }
  );
}

export default function JsonViewer({ data, maxHeight = 400 }: JsonViewerProps) {
  const theme = useTheme();

  const colors: SyntaxColors = {
    key: theme.palette.primary.main,
    string: theme.palette.secondary.main,
    boolean: theme.palette.custom.syntaxBoolean,
    null: theme.palette.error.main,
    number: theme.palette.custom.syntaxNumber,
  };

  let formatted = '';
  try {
    formatted = JSON.stringify(data, null, 2);
  } catch {
    formatted = String(data);
  }

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.78rem',
        overflowY: 'auto',
        maxHeight,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
      dangerouslySetInnerHTML={{ __html: colorize(formatted, colors) }}
    />
  );
}
