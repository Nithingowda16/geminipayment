import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Grid, 
  Box, 
  Alert, 
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { CloudUpload, Payment as PayIcon, Image as ImageIcon } from '@mui/icons-material';

export const PaymentPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [amount] = useState('3199.00'); // Locked to QR Code amount
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch('/api/applications/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApp(data.application);
          
          if (!data.application) {
            // No application exists, redirect to form
            navigate('/contract-form');
          } else if (data.application.status !== 'Submitted' && data.application.status !== 'Rejected') {
            // Already submitted payment, go to tracking
            navigate('/status-tracking');
          }
        }
      } catch (err) {
        console.error("Failed to load application detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [token, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // File extension validation
      const allowedExts = ['png', 'jpg', 'jpeg'];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(fileExt)) {
        setValidationErrors(prev => ({ ...prev, screenshot: 'Only PNG, JPG, or JPEG images are allowed.' }));
        setScreenshotFile(null);
        setScreenshotPreview(null);
        return;
      }

      // Max size validation (16MB)
      if (file.size > 16 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, screenshot: 'Screenshot exceeds maximum limit of 16MB.' }));
        setScreenshotFile(null);
        setScreenshotPreview(null);
        return;
      }

      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.screenshot;
        return copy;
      });
      setScreenshotFile(file);

      // Render image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};

    const fileToUpload = screenshotFile;
    if (!utrNumber) errors.utrNumber = 'UTR / Transaction ID is required';
    if (!paymentDate) errors.paymentDate = 'Payment Date is required';
    if (!fileToUpload) errors.screenshot = 'Payment screenshot proof is required';

    if (Object.keys(errors).length > 0 || !fileToUpload) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('utr_number', utrNumber);
      formData.append('payment_date', paymentDate);
      formData.append('screenshot', fileToUpload); // File field

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        // Success, redirect to status tracking
        navigate('/status-tracking');
      } else {
        setError(data.message || 'Failed to submit payment details.');
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setError('An error occurred during submission. Check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-1 md:p-4 max-w-4xl mx-auto">
      {/* Title */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Payment Portal
        </Typography>
        <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
          Scan the QR Code to complete the fee payment, then upload your transaction receipt details below.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}

      {app?.status === 'Rejected' && (
        <Alert severity="warning" className="mb-6 rounded-lg">
          Your previous payment proof was rejected by the admin. Please upload the correct details again.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* UPI QR Code Block */}
        <Grid item xs={12} md={5}>
          <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark text-center h-full flex flex-col justify-between">
            <CardContent className="p-6 flex flex-col items-center">
              <Typography variant="h6" className="font-semibold mb-1 text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                UPI QR Code
              </Typography>
              <Typography variant="caption" className="text-google-gray mb-4 block">
                Scan using Google Pay, PhonePe, Paytm or BHIM
              </Typography>

              {/* QR Image Frame */}
              <Box className="bg-white p-3 rounded-xl shadow-inner border inline-block mb-3">
                <img 
                  src="/qr_code.jpg" 
                  alt="Payment QR Code" 
                  className="w-48 h-auto object-contain mx-auto"
                  onError={(e) => {
                    // Fallback to placeholder if not copied yet
                    (e.target as HTMLImageElement).src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=studentportal@okaxis%26am=3199.00%26cu=INR";
                  }}
                />
              </Box>

              <Typography variant="h5" className="font-bold text-google-blue mb-1">
                INR 3,199.00
              </Typography>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light max-w-[240px]">
                Please pay the exact amount to prevent verification delays.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Form Block */}
        <Grid item xs={12} md={7}>
          <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark h-full">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold text-google-blue mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Verify Transaction Details
              </Typography>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField
                  label="Payment Amount (INR)"
                  value={`₹ ${amount}`}
                  disabled
                  fullWidth
                />

                <TextField
                  label="UTR Number / Transaction ID"
                  placeholder="Enter 12-digit transaction number"
                  fullWidth
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  error={!!validationErrors.utrNumber}
                  helperText={validationErrors.utrNumber || "Double check transaction numbers to ensure fast approval."}
                  disabled={submitting}
                />

                <TextField
                  label="Payment Date"
                  type="date"
                  fullWidth
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  error={!!validationErrors.paymentDate}
                  helperText={validationErrors.paymentDate}
                  disabled={submitting}
                  InputLabelProps={{ shrink: true }}
                />

                {/* Screenshot File Upload */}
                <Box>
                  <Typography variant="body2" className="font-semibold text-google-dark dark:text-white mb-2">
                    Upload Payment Screenshot Proof
                  </Typography>
                  
                  <Box 
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-200 ${
                      validationErrors.screenshot 
                        ? 'border-google-red bg-google-red/5' 
                        : screenshotFile
                          ? 'border-google-green bg-google-green-light/20 dark:bg-google-green/10'
                          : 'border-google-border dark:border-white/10 hover:border-google-blue hover:bg-google-blue-light/10'
                    }`}
                    onClick={() => document.getElementById('screenshot-upload')?.click()}
                  >
                    <input 
                      type="file" 
                      id="screenshot-upload" 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    <CloudUpload className={`text-3xl mb-1.5 ${screenshotFile ? 'text-google-green' : 'text-google-gray'}`} />
                    <Typography variant="body2" className="font-semibold text-google-dark dark:text-white">
                      {screenshotFile ? 'Screenshot Attached' : 'Attach Screenshot File'}
                    </Typography>
                    <Typography variant="caption" className="text-google-gray block mt-0.5">
                      Allowed Formats: PNG, JPG, JPEG. Max size: 16MB.
                    </Typography>
                  </Box>
                  {validationErrors.screenshot && (
                    <FormHelperText error className="mx-2 mt-1">{validationErrors.screenshot}</FormHelperText>
                  )}
                </Box>

                {/* Upload Image Preview Box */}
                {screenshotPreview && (
                  <Box className="border border-google-border dark:border-white/10 rounded-lg p-2 bg-google-gray-bg dark:bg-white/5 flex flex-col items-center max-w-[200px] mx-auto">
                    <Typography variant="caption" className="text-google-gray mb-1.5 flex items-center gap-1">
                      <ImageIcon fontSize="inherit" /> Screen Preview
                    </Typography>
                    <img 
                      src={screenshotPreview} 
                      alt="Screenshot Preview" 
                      className="w-full h-auto max-h-36 object-contain rounded border bg-white"
                    />
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PayIcon />}
                  className="mt-2"
                >
                  {submitting ? 'Submitting Details...' : 'Submit Verification Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
