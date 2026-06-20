import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  Alert, 
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import { StatusTimeline } from '../components/StatusTimeline';
import { 
  ArrowBack, 
  CheckCircle, 
  HourglassEmpty, 
  ErrorOutline, 
  Payment,
  Description
} from '@mui/icons-material';

export const StatusTracking: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplicationStatus = async () => {
    try {
      const res = await fetch('/api/applications/my', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  useEffect(() => {
    fetchApplicationStatus();
  }, [token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!app) {
    return (
      <Box className="p-4 max-w-md mx-auto text-center py-12">
        <ErrorOutline className="text-google-gray text-5xl mb-3" />
        <Typography variant="h5" className="font-bold mb-2">No Application Found</Typography>
        <Typography variant="body2" className="text-google-gray mb-6">
          You haven't submitted your contract details yet. Please complete this step to begin.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/contract-form')}>
          Start Submission
        </Button>
      </Box>
    );
  }

  // Generate Alert boxes based on status
  const renderAlertBox = () => {
    switch (app.status) {
      case 'Submitted':
        return (
          <Alert 
            severity="warning" 
            className="rounded-lg"
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/payment-page')} startIcon={<Payment />}>
                Pay Now
              </Button>
            }
          >
            <strong>Contract Form Received!</strong> Your payment details are pending. Please transfer the registration fees and upload proof to complete.
          </Alert>
        );
      case 'Payment Under Verification':
        return (
          <Alert severity="info" icon={<HourglassEmpty />} className="rounded-lg">
            <strong>Payment Under Verification.</strong> Our administrator is currently verifying your UTR number (<strong>{app.payments?.[0]?.utr_number}</strong>) and payment screenshot. This usually takes between 1-3 hours.
          </Alert>
        );
      case 'Approved':
        return (
          <Alert 
            severity="success" 
            icon={<CheckCircle />} 
            className="rounded-lg"
            action={
              <Button 
                color="inherit" 
                size="small" 
                component="a"
                href={`/api/applications/download-pdf/${app.id}?token=${token}`}
                target="_blank"
                startIcon={<Description />}
              >
                Download Receipt
              </Button>
            }
          >
            <strong>Application Approved!</strong> Your registration contract and payment details have been successfully verified and approved.
          </Alert>
        );
      case 'Rejected':
        return (
          <Alert 
            severity="error" 
            icon={<ErrorOutline />} 
            className="rounded-lg"
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/payment-page')} startIcon={<Payment />}>
                Resubmit
              </Button>
            }
          >
            <strong>Verification Failed.</strong> Admin rejected your payment proof. Please review details, enter the correct UTR transaction number, and upload a valid screenshot.
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box className="p-1 md:p-4 max-w-4xl mx-auto">
      {/* Title */}
      <Box className="mb-6 flex items-center gap-3">
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate('/dashboard')} 
          className="border-google-border hover:bg-google-blue-light/10 text-google-dark dark:text-white"
          sx={{ minWidth: 40, p: 0.8, borderRadius: 2 }}
        >
          <ArrowBack fontSize="small" />
        </Button>
        <Box>
          <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Application Tracking
          </Typography>
          <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
            Monitor the verification workflow stage of your registration application.
          </Typography>
        </Box>
      </Box>

      {/* Info message */}
      <Box className="mb-6">
        {renderAlertBox()}
      </Box>

      <Grid container spacing={3}>
        {/* Step tracker card */}
        <Grid item xs={12} md={5}>
          <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark h-full">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold text-google-dark dark:text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Progression Pipeline
              </Typography>
              <StatusTimeline status={app.status} />
            </CardContent>
          </Card>
        </Grid>

        {/* Application details breakdown */}
        <Grid item xs={12} md={7}>
          <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark h-full">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold text-google-blue mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Application Details
              </Typography>

              <Box className="flex flex-col gap-4">
                <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                  <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Application ID:</Typography>
                  <Typography variant="subtitle2" className="font-semibold text-google-dark dark:text-white">{app.application_id}</Typography>
                </Box>

                <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                  <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Registered Applicant:</Typography>
                  <Typography variant="body2" className="text-google-dark dark:text-white">{app.full_name}</Typography>
                </Box>

                <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                  <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">College & Reg Number:</Typography>
                  <Typography variant="body2" className="text-google-dark dark:text-white">{app.college_name} ({app.registration_number})</Typography>
                </Box>

                {app.payments && app.payments.length > 0 && (
                  <>
                    <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                      <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">UTR Transaction ID:</Typography>
                      <Typography variant="body2" className="font-mono font-semibold text-google-dark dark:text-white">{app.payments[0].utr_number}</Typography>
                    </Box>

                    <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                      <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Verification Status:</Typography>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        app.payments[0].verification_status === 'Verified' 
                          ? 'bg-google-green-light text-google-green' 
                          : app.payments[0].verification_status === 'Rejected'
                            ? 'bg-google-red/10 text-google-red'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {app.payments[0].verification_status}
                      </span>
                    </Box>
                  </>
                )}

                <Box className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                  <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Submission Timeline:</Typography>
                  <Typography variant="body2" className="text-google-dark dark:text-white">{new Date(app.created_at).toLocaleString()}</Typography>
                </Box>
              </Box>

              <Divider className="my-6" />

              {/* Action Buttons */}
              <Box className="flex justify-end gap-2">
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard Overview
                </Button>
                {app.status === 'Approved' && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    component="a"
                    href={`/api/applications/download-pdf/${app.id}?token=${token}`}
                    target="_blank"
                    startIcon={<Description />}
                  >
                    View Receipt PDF
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
