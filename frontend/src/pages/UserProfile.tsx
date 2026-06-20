import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Box, 
  Grid, 
  Divider 
} from '@mui/material';
import { AccountCircle, Shield, AlternateEmail, CalendarToday } from '@mui/icons-material';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box className="p-1 md:p-4 max-w-3xl mx-auto">
      {/* Title */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          User Profile
        </Typography>
        <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
          Review your account registration profile and security role credentials.
        </Typography>
      </Box>

      <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
        <CardContent className="p-6 md:p-8">
          <Box className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <Avatar 
              sx={{ 
                bgcolor: '#1A73E8', 
                width: 80, 
                height: 80,
                fontSize: '2rem',
                fontWeight: 600
              }}
            >
              {user ? getInitials(user.name) : ''}
            </Avatar>
            <Box className="text-center md:text-left">
              <Typography variant="h5" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.name}
              </Typography>
              <Typography variant="body1" className="text-google-gray dark:text-google-gray-light mb-2">
                {user?.email}
              </Typography>
              <span className="inline-block text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-google-blue-light text-google-blue dark:bg-google-blue/20 dark:text-blue-300">
                {user?.role} Access
              </span>
            </Box>
          </Box>

          <Divider className="my-6" />

          <Typography variant="h6" className="font-semibold mb-4 text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Account Metadata
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box className="flex items-center gap-3">
                <AccountCircle className="text-google-gray" />
                <Box>
                  <Typography variant="caption" className="text-google-gray block">Full Name</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{user?.name}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="flex items-center gap-3">
                <AlternateEmail className="text-google-gray" />
                <Box>
                  <Typography variant="caption" className="text-google-gray block">Email Address</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{user?.email}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="flex items-center gap-3">
                <Shield className="text-google-gray" />
                <Box>
                  <Typography variant="caption" className="text-google-gray block">Access Authorization Level</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white capitalize">{user?.role} Portal User</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="flex items-center gap-3">
                <CalendarToday className="text-google-gray" />
                <Box>
                  <Typography variant="caption" className="text-google-gray block">Account Created On</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
