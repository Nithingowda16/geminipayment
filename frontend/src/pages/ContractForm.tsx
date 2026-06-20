import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Grid, 
  Box, 
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload, Description, Assignment } from '@mui/icons-material';

export const ContractForm: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State Fields
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [branch, setBranch] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState('');
  
  // File state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user already has an application
    const checkExistingApplication = async () => {
      try {
        const res = await fetch('/api/applications/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.application) {
            // Already submitted, redirect to dashboard or tracking
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error("Error checking application status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingApplication();

    // Recover draft from sessionStorage if it exists
    const draft = sessionStorage.getItem('contract_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFullName(parsed.fullName || '');
        setEmailAddress(parsed.emailAddress || '');
        setPhoneNumber(parsed.phoneNumber || '');
        setCollegeName(parsed.collegeName || '');
        setBranch(parsed.branch || '');
        setYearOfStudy(parsed.yearOfStudy || '');
        setRegistrationNumber(parsed.registrationNumber || '');
        setAddress(parsed.address || '');
        setAgreement(parsed.agreement || false);
        setDigitalSignature(parsed.digitalSignature || '');
      } catch (e) {
        console.error("Failed to parse draft details", e);
      }
    }
  }, [token, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Extension validation
      const allowedExts = ['pdf', 'doc', 'docx'];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(fileExt)) {
        setValidationErrors(prev => ({ ...prev, document: 'Only PDF, DOC, or DOCX files are allowed.' }));
        setDocumentFile(null);
        setDocumentName('');
        return;
      }

      // Max file size check (16MB)
      if (file.size > 16 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, document: 'File size exceeds maximum limit of 16MB.' }));
        setDocumentFile(null);
        setDocumentName('');
        return;
      }

      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.document;
        return copy;
      });
      setDocumentFile(file);
      setDocumentName(file.name);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};

    // Validate inputs
    if (!fullName) errors.fullName = 'Full Name is required';
    if (!emailAddress) errors.emailAddress = 'Email Address is required';
    if (!phoneNumber) errors.phoneNumber = 'Phone Number is required';
    if (!collegeName) errors.collegeName = 'College Name is required';
    if (!branch) errors.branch = 'Branch is required';
    if (!yearOfStudy) errors.yearOfStudy = 'Year of Study is required';
    if (!registrationNumber) errors.registrationNumber = 'Registration Number is required';
    if (!address) errors.address = 'Address is required';
    if (!agreement) errors.agreement = 'You must agree to the contract terms';
    if (!digitalSignature) errors.digitalSignature = 'Digital signature text is required';
    if (!documentFile) errors.document = 'Contract document upload is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please review the form. Highlighted fields are incomplete or invalid.');
      return;
    }

    setValidationErrors({});
    
    const fileToRead = documentFile;
    if (!fileToRead) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const draftData = {
        fullName,
        emailAddress,
        phoneNumber,
        collegeName,
        branch,
        yearOfStudy,
        registrationNumber,
        address,
        agreement,
        digitalSignature,
        fileName: documentName,
        fileBase64: fileReader.result as string, // Persistence for Review Page
        fileType: fileToRead.type
      };
      sessionStorage.setItem('contract_draft', JSON.stringify(draftData));
      
      // Route to Review Page
      navigate('/review-page');
    };
    fileReader.readAsDataURL(fileToRead);
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
          Contract Submission
        </Typography>
        <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
          Please enter your official contract details and upload the signed document agreement.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" className="mb-6 rounded-lg">
          {error}
        </Alert>
      )}

      <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleFormSubmit}>
            <Grid container spacing={3}>
              {/* Personal Details */}
              <Grid item xs={12}>
                <Typography variant="h6" className="font-semibold text-google-blue mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Personal Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={!!validationErrors.fullName}
                  helperText={validationErrors.fullName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  error={!!validationErrors.emailAddress}
                  helperText={validationErrors.emailAddress}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  error={!!validationErrors.phoneNumber}
                  helperText={validationErrors.phoneNumber}
                />
              </Grid>

              {/* Academic Details */}
              <Grid item xs={12} className="mt-2">
                <Typography variant="h6" className="font-semibold text-google-blue mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Academic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="College/Institution Name"
                  fullWidth
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  error={!!validationErrors.collegeName}
                  helperText={validationErrors.collegeName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Branch / Major"
                  fullWidth
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  error={!!validationErrors.branch}
                  helperText={validationErrors.branch}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Year of Study (e.g. 1st, 2nd, 3rd, 4th)"
                  fullWidth
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  error={!!validationErrors.yearOfStudy}
                  helperText={validationErrors.yearOfStudy}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Registration / Student ID Number"
                  fullWidth
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  error={!!validationErrors.registrationNumber}
                  helperText={validationErrors.registrationNumber}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12} className="mt-2">
                <Typography variant="h6" className="font-semibold text-google-blue mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Address Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Permanent Address"
                  multiline
                  rows={3}
                  fullWidth
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={!!validationErrors.address}
                  helperText={validationErrors.address}
                />
              </Grid>

              {/* File Upload */}
              <Grid item xs={12} className="mt-2">
                <Typography variant="h6" className="font-semibold text-google-blue mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Upload Contract Document
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                    validationErrors.document 
                      ? 'border-google-red bg-google-red/5' 
                      : documentFile
                        ? 'border-google-green bg-google-green-light/20 dark:bg-google-green/10'
                        : 'border-google-border dark:border-white/10 hover:border-google-blue hover:bg-google-blue-light/10'
                  }`}
                  onClick={() => document.getElementById('contract-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="contract-upload" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileChange}
                  />
                  <CloudUpload className={`text-4xl mb-2 ${documentFile ? 'text-google-green' : 'text-google-gray'}`} />
                  <Typography variant="body1" className="font-medium text-google-dark dark:text-white">
                    {documentFile ? 'Document Uploaded' : 'Drag & Drop or Click to Upload'}
                  </Typography>
                  <Typography variant="caption" className="text-google-gray block mt-1">
                    Allowed formats: PDF, DOC, DOCX. Max file size: 16MB.
                  </Typography>

                  {documentName && (
                    <Box className="mt-3 flex items-center justify-center gap-1.5 text-google-green bg-google-green-light dark:bg-google-green/20 px-3 py-1 rounded-full w-fit mx-auto">
                      <Description fontSize="small" />
                      <Typography variant="body2" className="font-semibold">{documentName}</Typography>
                    </Box>
                  )}
                </Box>
                {validationErrors.document && (
                  <FormHelperText error className="mx-2 mt-1">{validationErrors.document}</FormHelperText>
                )}
              </Grid>

              {/* Agreement Checkbox */}
              <Grid item xs={12} className="mt-3">
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={agreement} 
                      onChange={(e) => setAgreement(e.target.checked)} 
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-google-dark dark:text-white">
                      I hereby declare that the details provided are true and I agree to the terms in the contract.
                    </Typography>
                  }
                />
                {validationErrors.agreement && (
                  <FormHelperText error className="mx-2">{validationErrors.agreement}</FormHelperText>
                )}
              </Grid>

              {/* Digital Signature */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Type Digital Signature (Your Full Name)"
                  fullWidth
                  value={digitalSignature}
                  onChange={(e) => setDigitalSignature(e.target.value)}
                  error={!!validationErrors.digitalSignature}
                  helperText={validationErrors.digitalSignature}
                />
                
                {/* Script font preview card */}
                {digitalSignature && (
                  <Box className="mt-3 p-4 bg-google-gray-bg dark:bg-white/5 border border-google-border dark:border-white/10 rounded-lg">
                    <Typography variant="caption" className="text-google-gray block mb-1">Signature Preview:</Typography>
                    <Typography 
                      variant="h5" 
                      className="text-google-blue dark:text-blue-400 font-normal italic select-none"
                      style={{ fontFamily: 'Outfit, cursive', letterSpacing: 1 }}
                    >
                      {digitalSignature}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} className="mt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Assignment />}
                >
                  Continue to Review
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
