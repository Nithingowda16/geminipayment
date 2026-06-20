import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Assignment, 
  Payment, 
  AssignmentTurnedIn, 
  InfoOutlined, 
  Notifications, 
  Description, 
  CheckCircle,
  ErrorOutline,
  HourglassEmpty
} from '@mui/icons-material';

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/applications/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setApp(data.application);
        }
      } catch (err) {
        console.error("Failed to load application status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Determine status color and chip
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Submitted':
        return <Chip label="Contract Submitted" color="primary" variant="outlined" icon={<Assignment />} size="small" />;
      case 'Payment Under Verification':
        return <Chip label="Payment Under Verification" color="warning" icon={<HourglassEmpty />} size="small" />;
      case 'Approved':
        return <Chip label="Approved & Verified" color="success" icon={<CheckCircle />} size="small" />;
      case 'Rejected':
        return <Chip label="Payment Rejected" color="error" icon={<ErrorOutline />} size="small" />;
      default:
        return <Chip label="Draft" color="default" size="small" />;
    }
  };

  return (
    <Box className="p-1 md:p-4">
      {/* Page Title */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
          Manage your contract submissions, verify payments, and download receipts.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Welcome Card */}
        <Grid item xs={12}>
          <Card className="shadow-google-card bg-google-blue-light/50 dark:bg-google-blue/10 border-0">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold text-google-dark dark:text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Welcome back, {user?.name}!
              </Typography>
              <Typography variant="body1" className="text-google-gray dark:text-google-gray-light mb-4">
                {app 
                  ? `Your application ID is ${app.application_id}. Keep track of your progress below.`
                  : "You haven't submitted your contract yet. Complete the pending tasks below to register."}
              </Typography>
              {!app && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/contract-form')}
                  startIcon={<Assignment />}
                >
                  Start Contract Submission
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Application Status Card */}
        <Grid item xs={12} md={7}>
          <Card className="shadow-google-card h-full dark:bg-google-dark border border-google-border/20 dark:border-white/5">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold mb-4 text-google-dark dark:text-white flex items-center gap-2">
                <AssignmentTurnedIn className="text-google-blue" /> Submission Status
              </Typography>

              {app ? (
                <Box className="flex flex-col gap-4">
                  <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
                      Application ID:
                    </Typography>
                    <Typography variant="subtitle2" className="font-semibold text-google-dark dark:text-white">
                      {app.application_id}
                    </Typography>
                  </Box>

                  <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
                      Current Status:
                    </Typography>
                    {getStatusChip(app.status)}
                  </Box>

                  <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
                      Submitted Date:
                    </Typography>
                    <Typography variant="body2" className="text-google-dark dark:text-white">
                      {new Date(app.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box className="flex gap-2 mt-2">
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate('/status-tracking')}
                      fullWidth
                    >
                      Track Progress
                    </Button>
                    
                    {app.status === 'Approved' && (
                      <Button 
                        variant="contained" 
                        color="success"
                        component="a"
                        href={`/api/applications/download-pdf/${app.id}?token=${token}`}
                        target="_blank"
                        className="text-white bg-google-green hover:bg-google-green/90"
                        fullWidth
                      >
                        Download PDF Receipt
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box className="text-center py-8">
                  <InfoOutlined className="text-google-gray text-4xl mb-2" />
                  <Typography variant="body1" className="text-google-gray dark:text-google-gray-light mb-4">
                    No active contract application found.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Action Items / Notifications */}
        <Grid item xs={12} md={5}>
          <Card className="shadow-google-card h-full dark:bg-google-dark border border-google-border/20 dark:border-white/5">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold mb-4 text-google-dark dark:text-white flex items-center gap-2">
                <Notifications className="text-google-blue" /> Action Center
              </Typography>

              <List className="divide-y divide-google-border/30 dark:divide-white/5 p-0">
                {/* Task 1: Submit Contract */}
                <ListItem className="px-0 py-3 flex items-start gap-3">
                  <ListItemIcon className="min-w-0 mt-0.5">
                    <Box className={`w-8 h-8 rounded-full flex items-center justify-center ${app ? 'bg-google-green-light text-google-green dark:bg-google-green/20' : 'bg-google-blue-light text-google-blue dark:bg-google-blue/20'}`}>
                      {app ? <CheckCircle fontSize="small" /> : <Assignment fontSize="small" />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary="1. Submit Contract Form"
                    secondary={app ? "Completed" : "Submit your contract document and personal details."}
                    primaryTypographyProps={{ variant: 'subtitle2', className: 'font-semibold text-google-dark dark:text-white' }}
                  />
                  {!app && (
                    <Button size="small" variant="text" onClick={() => navigate('/contract-form')} className="capitalize font-semibold text-google-blue">
                      Start
                    </Button>
                  )}
                </ListItem>

                {/* Task 2: Payment submission */}
                <ListItem className="px-0 py-3 flex items-start gap-3">
                  <ListItemIcon className="min-w-0 mt-0.5">
                    <Box className={`w-8 h-8 rounded-full flex items-center justify-center ${app?.status === 'Payment Under Verification' || app?.status === 'Approved' ? 'bg-google-green-light text-google-green dark:bg-google-green/20' : 'bg-google-blue-light text-google-blue dark:bg-google-blue/20'}`}>
                      {app?.status === 'Payment Under Verification' || app?.status === 'Approved' ? <CheckCircle fontSize="small" /> : <Payment fontSize="small" />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary="2. Verification Payment"
                    secondary={
                      app?.status === 'Payment Under Verification'
                        ? "Verification Pending"
                        : app?.status === 'Approved'
                          ? "Verified"
                          : "Upload screenshot proof of transaction."
                    }
                    primaryTypographyProps={{ variant: 'subtitle2', className: 'font-semibold text-google-dark dark:text-white' }}
                  />
                  {app && (app.status === 'Submitted' || app.status === 'Rejected') && (
                    <Button size="small" variant="text" onClick={() => navigate('/payment-page')} className="capitalize font-semibold text-google-blue">
                      Pay
                    </Button>
                  )}
                </ListItem>

                {/* Task 3: Approval PDF */}
                <ListItem className="px-0 py-3 flex items-start gap-3">
                  <ListItemIcon className="min-w-0 mt-0.5">
                    <Box className={`w-8 h-8 rounded-full flex items-center justify-center ${app?.status === 'Approved' ? 'bg-google-green-light text-google-green dark:bg-google-green/20' : 'bg-google-gray-light text-google-gray dark:bg-white/10'}`}>
                      {app?.status === 'Approved' ? <CheckCircle fontSize="small" /> : <Description fontSize="small" />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary="3. Download PDF Receipt"
                    secondary={app?.status === 'Approved' ? "Receipt ready for download." : "Unlocked after payment approval."}
                    primaryTypographyProps={{ variant: 'subtitle2', className: 'font-semibold text-google-dark dark:text-white' }}
                  />
                  {app?.status === 'Approved' && (
                    <Button 
                      size="small" 
                      variant="text" 
                      component="a"
                      href={`/api/applications/download-pdf/${app.id}?token=${token}`}
                      target="_blank"
                      className="capitalize font-semibold text-google-blue"
                    >
                      Get PDF
                    </Button>
                  )}
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
