import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  ArrowBack, 
  Check, 
  Close, 
  Description, 
  OpenInNew, 
  Payment as PayIcon 
} from '@mui/icons-material';

export const AdminReviewPage: React.FC = () => {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secure URL states for rendering images/docs
  const [screenshotBlobUrl, setScreenshotBlobUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  // Dialog actions
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchApplicationDetails = async () => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApp(data);

        // Fetch payment screenshot securely using Authorization header
        const payment = data.payments?.[0];
        if (payment && payment.screenshot_url) {
          fetchSecureImage(payment.screenshot_url);
        }
      } else {
        setError('Application details not found.');
      }
    } catch (err) {
      console.error("Failed to load application details:", err);
      setError('Connection failure loading details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecureImage = async (url: string) => {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setScreenshotBlobUrl(blobUrl);
      }
    } catch (err) {
      console.error("Error loading secure image:", err);
    }
  };

  // Trigger secure document download/open in new tab
  const handleDownloadDoc = async (url: string, name: string) => {
    setDocLoading(true);
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Create link to click and download
        const a = window.document.createElement('a');
        a.href = blobUrl;
        a.download = name;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } else {
        alert("Failed to load secure document.");
      }
    } catch (err) {
      console.error("Doc download failed:", err);
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();

    // Cleanup blob url on unmount
    return () => {
      if (screenshotBlobUrl) URL.revokeObjectURL(screenshotBlobUrl);
    };
  }, [id, token]);

  const handleAction = async (statusInput: 'Approved' | 'Rejected') => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusInput,
          reason: statusInput === 'Rejected' ? rejectReason : ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRejectOpen(false);
        setRejectReason('');
        // Reload details to show updated logs
        fetchApplicationDetails();
      } else {
        setError(data.message || 'Action update failed.');
        setProcessing(false);
      }
    } catch (err) {
      console.error("Action error:", err);
      setError('An error occurred. Check connection settings.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !app) {
    return (
      <Box className="p-4 max-w-md mx-auto text-center py-12">
        <Alert severity="error" className="mb-4">{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/admin')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const payment = app.payments?.[0];

  return (
    <Box className="p-1 md:p-4 max-w-5xl mx-auto">
      {/* Title Header */}
      <Box className="mb-6 flex items-center gap-3">
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate('/admin')} 
          className="border-google-border hover:bg-google-blue-light/10 text-google-dark dark:text-white"
          sx={{ minWidth: 40, p: 0.8, borderRadius: 2 }}
        >
          <ArrowBack fontSize="small" />
        </Button>
        <Box>
          <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Application Review
          </Typography>
          <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
            Verify transaction numbers, review signed contracts, and update status.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Applicant details & documents */}
        <Grid item xs={12} md={7}>
          <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
            <CardContent className="p-6 md:p-8">
              <Box className="flex justify-between items-start mb-4">
                <Typography variant="h6" className="font-semibold text-google-blue" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Applicant Information
                </Typography>
                <Chip 
                  label={app.status} 
                  color={
                    app.status === 'Approved' 
                      ? 'success' 
                      : app.status === 'Rejected' 
                        ? 'error' 
                        : app.status === 'Payment Under Verification' 
                          ? 'warning' 
                          : 'primary'
                  } 
                  size="small" 
                />
              </Box>

              <Grid container spacing={3} className="mb-6">
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Applicant ID / Code</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.application_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Applicant Full Name</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.full_name}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Email Address</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.email_address}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Phone Number</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.phone_number}</Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">College / Institution</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.college_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Branch & Year</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.branch} - Year {app.year_of_study}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Registration Number</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{app.registration_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" className="text-google-gray block">Signature Verification</Typography>
                  <Typography variant="body1" className="font-normal italic text-google-blue dark:text-blue-300 font-serif">{app.digital_signature}</Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" className="text-google-gray block">Permanent Address</Typography>
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white whitespace-pre-wrap">{app.address}</Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* Secure Contract Document Download */}
                <Grid item xs={12}>
                  <Typography variant="body2" className="font-semibold text-google-dark dark:text-white mb-2">Uploaded Contract Document</Typography>
                  {app.documents && app.documents.length > 0 ? (
                    <Box className="flex items-center justify-between border border-google-border dark:border-white/5 p-3 rounded-lg bg-google-gray-bg dark:bg-white/5">
                      <Box className="flex items-center gap-2 text-google-blue">
                        <Description />
                        <Typography variant="body2" className="font-medium truncate max-w-[200px]">{app.documents[0].file_name}</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleDownloadDoc(app.documents[0].file_url, app.documents[0].file_name)}
                        disabled={docLoading}
                        startIcon={docLoading ? <CircularProgress size={16} /> : <OpenInNew />}
                      >
                        Download Doc
                      </Button>
                    </Box>
                  ) : (
                    <Typography variant="body2" className="text-google-gray">No contract document uploaded.</Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Payment Screenshot & Verification tools */}
        <Grid item xs={12} md={5}>
          <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark h-full flex flex-col justify-between">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold text-google-blue mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Payment Proof Details
              </Typography>

              {payment ? (
                <Box className="flex flex-col gap-4">
                  <Box className="flex items-center justify-between border-b pb-2 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">UTR Transaction ID:</Typography>
                    <Typography variant="subtitle2" className="font-semibold text-google-dark dark:text-white font-mono">{payment.utr_number}</Typography>
                  </Box>

                  <Box className="flex items-center justify-between border-b pb-2 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Payment Date:</Typography>
                    <Typography variant="body2" className="text-google-dark dark:text-white">{payment.payment_date}</Typography>
                  </Box>

                  <Box className="flex items-center justify-between border-b pb-2 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Amount Transferred:</Typography>
                    <Typography variant="subtitle2" className="font-semibold text-google-green">₹ {payment.amount.toFixed(2)}</Typography>
                  </Box>

                  <Box className="flex items-center justify-between border-b pb-2 dark:border-white/5">
                    <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Verification State:</Typography>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      payment.verification_status === 'Verified' 
                        ? 'bg-google-green-light text-google-green' 
                        : payment.verification_status === 'Rejected'
                          ? 'bg-google-red/10 text-google-red'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20'
                    }`}>
                      {payment.verification_status}
                    </span>
                  </Box>

                  {/* Payment Screenshot Display */}
                  <Box className="mt-3 text-center border rounded-lg p-2 bg-google-gray-bg dark:bg-white/5">
                    <Typography variant="caption" className="text-google-gray block mb-1.5 font-semibold">Payment Proof Screenshot</Typography>
                    {screenshotBlobUrl ? (
                      <a href={screenshotBlobUrl} target="_blank" rel="noreferrer">
                        <img 
                          src={screenshotBlobUrl} 
                          alt="Transaction Screenshot" 
                          className="w-full h-auto max-h-56 object-contain rounded border hover:scale-102 transition-transform duration-200 bg-white"
                        />
                      </a>
                    ) : (
                      <Box className="py-12 flex justify-center"><CircularProgress size={24} /></Box>
                    )}
                  </Box>

                  {/* Controls - display if status is under verification */}
                  {app.status === 'Payment Under Verification' && (
                    <Box className="flex gap-2 mt-4">
                      <Button
                        variant="contained"
                        color="success"
                        className="bg-google-green hover:bg-google-green/90 text-white"
                        fullWidth
                        startIcon={<Check />}
                        onClick={() => handleAction('Approved')}
                        disabled={processing}
                      >
                        Verify & Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        startIcon={<Close />}
                        onClick={() => setRejectOpen(true)}
                        disabled={processing}
                      >
                        Reject proof
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box className="text-center py-12 text-google-gray dark:text-google-gray-light">
                  <PayIcon fontSize="large" className="opacity-40 mb-2" />
                  <Typography variant="body2">Applicant has not uploaded payment verification details yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reject Reason Dialog */}
      <Dialog 
        open={rejectOpen} 
        onClose={() => setRejectOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: 300, sm: 400 },
            p: 1
          }
        }}
      >
        <DialogTitle className="font-semibold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Reject Payment Proof
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" className="text-google-gray mb-4">
            Provide a feedback reason to explain to the student why their transaction screenshot was rejected.
          </Typography>
          <TextField
            label="Rejection Reason"
            multiline
            rows={3}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={() => handleAction('Rejected')} 
            color="error" 
            variant="contained"
            disabled={!rejectReason || processing}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
