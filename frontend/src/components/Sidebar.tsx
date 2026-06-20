import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Box, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { 
  Dashboard, 
  Description, 
  Payment, 
  TrackChanges, 
  Person, 
  Settings, 
  Security 
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const adminLinks = [
    { text: 'Dashboard', path: '/admin', icon: <Dashboard /> },
    { text: 'Audit Logs', path: '/admin/audit-logs', icon: <Security /> },
    { text: 'My Profile', path: '/profile', icon: <Person /> },
    { text: 'Settings', path: '/settings', icon: <Settings /> }
  ];

  const studentLinks = [
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Contract Submission', path: '/contract-form', icon: <Description /> },
    { text: 'Payment Portal', path: '/payment-page', icon: <Payment /> },
    { text: 'Status Tracking', path: '/status-tracking', icon: <TrackChanges /> },
    { text: 'My Profile', path: '/profile', icon: <Person /> },
    { text: 'Settings', path: '/settings', icon: <Settings /> }
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const drawerContent = (
    <Box sx={{ overflow: 'auto', mt: isMdUp ? 2 : 0 }}>
      <List className="px-3 gap-1 flex flex-col">
        {links.map((link) => (
          <ListItem key={link.text} disablePadding>
            <ListItemButton
              component={NavLink as any}
              to={link.path}
              onClick={() => {
                if (!isMdUp) onClose();
              }}
              {...({
                className: ({ isActive }: { isActive: boolean }) => 
                  `rounded-lg py-2.5 transition-colors ${
                    isActive 
                      ? 'active-nav-item' 
                      : 'text-google-gray hover:bg-google-gray-light/50 dark:text-google-gray-light dark:hover:bg-white/5'
                  }`
              } as any)}
              sx={{ borderRadius: '8px' }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {link.icon}
              </ListItemIcon>
              <ListItemText 
                primary={link.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: 240 }, shrink: { md: 0 } }}>
      {/* Mobile Drawer (Responsive Temporary Sidebar) */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // Better mobile performance
        PaperProps={{
          sx: {
            width: 240,
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 240 }
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar (Permanent Desktop Sidebar) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            width: 240, 
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.default'
          }
        }}
        open
      >
        <Toolbar />
        {drawerContent}
      </Drawer>
    </Box>
  );
};
