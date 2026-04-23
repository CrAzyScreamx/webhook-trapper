import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider, Stack, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PendingIcon from '@mui/icons-material/Pending';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useThemeContext } from '../context/ThemeContext';

const SIDEBAR_W = 232;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
  { label: 'Trappers', path: '/trappers', icon: <FilterAltIcon sx={{ fontSize: 18 }} /> },
  { label: 'Queue', path: '/queue', icon: <PendingIcon sx={{ fontSize: 18 }} /> },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeContext();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        sx={(theme) => ({
          width: SIDEBAR_W,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.custom.border}`,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
        })}
      >
        {/* Logo */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={(theme) => ({
                width: 28, height: 28, borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.13),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.27)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              })}
            >
              <FilterAltIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            </Box>
            <Typography sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'text.primary', letterSpacing: '0.04em', flexGrow: 1 }}>
              WEBHOOK TRAPPER
            </Typography>
            <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.primary' }}>
              {mode === 'dark' ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Stack>
        </Box>

        <Divider sx={(theme) => ({ borderColor: theme.palette.custom.border })} />

        {/* Nav */}
        <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={(theme) => ({
                borderRadius: 1,
                mb: 0.25,
                py: 0.75,
                color: isActive(item.path) ? 'primary.main' : theme.palette.custom.muted,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.10) },
                },
                '&:hover': { bgcolor: alpha('#ffffff', 0.03), color: 'text.primary' },
              })}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isActive(item.path) ? 600 : 400 }}
              />
            </ListItemButton>
          ))}
        </List>

        {/* Logout */}
        <Box sx={{ p: 1.5, borderTop: (theme) => `1px solid ${theme.palette.custom.border}` }}>
          <ListItemButton
            onClick={() => {
              localStorage.removeItem('trapper_token');
              navigate('/login');
            }}
            sx={(theme) => ({
              borderRadius: 1,
              color: theme.palette.custom.muted,
              '&:hover': { bgcolor: alpha('#ff4444', 0.08), color: '#ff4444' },
            })}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <LogoutIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 400 }}
            />
          </ListItemButton>
        </Box>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, ml: `${SIDEBAR_W}px`, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Page content */}
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}
