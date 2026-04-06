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

const theme = createTheme({
  palette: {
    mode: 'dark',
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
  },
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

export default theme;
