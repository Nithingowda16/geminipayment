import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Box, 
  Alert, 
  CircularProgress,
  Divider
} from '@mui/material';
import { Edit, Check, Description } from '@mui/icons-material';

export const ReviewPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read draft
    const draftData = sessionStorage.getItem('contract_draft');
    if (!draftData) {
      // If no draft exists, redirect back to form
      navigate('/contract-form');
      return;
    }
    
    try {
      setDraft(JSON.parse(draftData));
    } catch (e) {
      console.error("Failed to load draft details:", e);
      navigate('/contract-form');
    }
  }, [navigate]);

  // Utility to convert Base64 string to Blob/File object
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleConfirmSubmit = async () => {
    if (!draft) return;
    setSubmitting(true);
    setError(null);

    try {
      // Reconstruct file object from cached base64
      const fileObj = dataURLtoFile(draft.fileBase64, draft.fileName);
      
      // Build Multipart Form Data
      const formData = new FormData();
      formData.append('full_name', draft.fullName);
      formData.append('email_address', draft.emailAddress);
      formData.append('phone_number', draft.phoneNumber);
      formData.append('college_name', draft.collegeName);
      formData.append('branch', draft.branch);
      formData.append('year_of_study', draft.yearOfStudy);
      formData.append('registration_number', draft.registrationNumber);
      formData.append('address', draft.address);
      formData.append('digital_signature', draft.digitalSignature);
      formData.append('document', fileObj); // File field

      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        // Success: clear form draft
        sessionStorage.removeItem('contract_draft');
        
        // Go to Payment Page
        navigate('/payment-page');
      } else {
        setError(data.message || 'Failed to submit contract details.');
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError('An error occurred during submission. Check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-1 md:p-4 max-w-3xl mx-auto">
      {/* Title */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Review Submission
        </Typography>
        <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
          Verify your contract information and complete your registration submission.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}

      <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
        <CardContent className="p-6 md:p-8">
          <Typography variant="h6" className="font-semibold text-google-blue mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Application Summary
          </Typography>

          <Grid container spacing={3} className="mb-6">
            {/* Personal Details */}
            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Full Name</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{draft.fullName}</Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Email Address</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{draft.emailAddress}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Phone Number</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{draft.phoneNumber}</Typography>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Academic details */}
            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">College / Institution</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{draft.collegeName}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Branch / Major</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white">{draft.branch}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Year of Study & ID</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white">
                Year {draft.yearOfStudy} ({draft.registrationNumber})
              </Typography>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">Address</Typography>
              <Typography variant="body1" className="font-medium text-google-dark dark:text-white whitespace-pre-wrap">{draft.address}</Typography>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* File upload */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light mb-1">Contract File</Typography>
              <Box className="flex items-center gap-2 text-google-green bg-google-green-light dark:bg-google-green/20 px-4 py-2 rounded-lg w-fit">
                <Description fontSize="small" />
                <Typography variant="body2" className="font-semibold">{draft.fileName}</Typography>
              </Box>
            </Grid>

            {/* Digital signature */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" className="text-google-gray dark:text-google-gray-light mb-1">Digital Signature</Typography>
              <Typography 
                variant="h6" 
                className="text-google-blue font-normal italic select-none"
                style={{ fontFamily: 'Outfit, cursive', letterSpacing: 1 }}
              >
                {draft.digitalSignature}
              </Typography>
            </Grid>
          </Grid>

          <Box className="flex justify-end gap-3 mt-6 border-t pt-6 dark:border-white/5">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/contract-form')}
              startIcon={<Edit />}
              disabled={submitting}
            >
              Edit Details
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmSubmit}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Check />}
              disabled={submitting}
            >
              Confirm and Continue
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
