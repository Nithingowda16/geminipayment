import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Logout, 
  Person, 
  Settings 
} from '@mui/icons-material';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, darkMode } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: darkMode ? '#202124' : '#FFFFFF',
        color: darkMode ? '#E8EAED' : '#202124',
        boxShadow: 'none',
        borderBottom: `1px solid ${darkMode ? '#3C4043' : '#DADCE0'}`
      }}
    >
      <Toolbar className="px-4 flex justify-between">
        <Box className="flex items-center gap-3">
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="menu" 
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <MenuIcon />
          </IconButton>
          
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Google Gemini" className="h-8 w-auto object-contain" />
            <Typography 
              variant="h6" 
              noWrap 
              className="font-semibold text-google-dark dark:text-white"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Gemini <span className="text-google-blue">Student Portal</span>
            </Typography>
          </Link>
        </Box>

        <Box className="flex items-center gap-2">
          {/* User Avatar Menu */}
          {user && (
            <>
              <IconButton 
                onClick={handleMenuOpen} 
                size="small" 
                className="ml-2 focus:outline-none"
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#1A73E8', 
                    width: 36, 
                    height: 36,
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  {getInitials(user.name)}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    border: darkMode ? '1px solid #3C4043' : '1px solid #DADCE0'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box className="px-4 py-3">
                  <Typography variant="subtitle2" className="font-semibold text-google-dark dark:text-white">
                    {user.name}
                  </Typography>
                  <Typography variant="body2" className="text-google-gray dark:text-google-gray-light leading-none mt-0.5">
                    {user.email}
                  </Typography>
                  <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-google-blue-light text-google-blue dark:bg-google-blue/20 dark:text-blue-300">
                    {user.role}
                  </span>
                </Box>
                
                <Divider />
                
                <MenuItem onClick={handleProfileClick} className="py-2.5">
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="My Profile" />
                </MenuItem>
                
                <MenuItem onClick={handleSettingsClick} className="py-2.5">
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={handleLogoutClick} className="py-2.5 text-google-red">
                  <ListItemIcon>
                    <Logout fontSize="small" className="text-google-red" />
                  </ListItemIcon>
                  <ListItemText primary="Sign Out" />
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
