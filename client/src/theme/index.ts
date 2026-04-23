import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      muted: string;
      border: string;
      codeBg: string;
      hoverBorder: string;
      inputBg: string;
      syntaxNumber: string;
      syntaxBoolean: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      muted?: string;
      border?: string;
      codeBg?: string;
      hoverBorder?: string;
      inputBg?: string;
      syntaxNumber?: string;
      syntaxBoolean?: string;
    };
  }
}

const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#a6c8ff', dark: '#3192fc' },
  secondary: { main: '#51df8e' },
  error: { main: '#ffb4ab' },
  background: { default: '#0b1323', paper: '#141b2c' },
  text: { primary: '#dbe2f9' },
  custom: {
    muted: '#4a6280',
    border: '#1a2540',
    codeBg: '#080f1c',
    hoverBorder: '#2a3a5a',
    inputBg: '#0d1929',
    syntaxNumber: '#f4c96e',
    syntaxBoolean: '#bcc2ff',
  },
};

const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#1565c0', dark: '#0d47a1' },
  secondary: { main: '#2e7d32' },
  error: { main: '#c62828' },
  background: { default: '#f4f6fa', paper: '#ffffff' },
  text: { primary: '#1a2540' },
  custom: {
    muted: '#6b7fa3',
    border: '#d0d8e8',
    codeBg: '#eef1f7',
    hoverBorder: '#9badc8',
    inputBg: '#f0f3f9',
    syntaxNumber: '#b45309',
    syntaxBoolean: '#4338ca',
  },
};

export function getTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: mode === 'dark' ? darkPalette : lightPalette,
    typography: {
      fontFamily: 'Inter, sans-serif',
      h1: { fontFamily: 'Space Grotesk, sans-serif' },
      h2: { fontFamily: 'Space Grotesk, sans-serif' },
      h3: { fontFamily: 'Space Grotesk, sans-serif' },
      h4: { fontFamily: 'Space Grotesk, sans-serif' },
      h5: { fontFamily: 'Space Grotesk, sans-serif' },
      h6: { fontFamily: 'Space Grotesk, sans-serif' },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontFamily: 'JetBrains Mono, monospace' },
        },
      },
    },
  });
}

export default getTheme('dark');
