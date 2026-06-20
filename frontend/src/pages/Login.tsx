import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  CircularProgress,
  Box,
  Link
} from '@mui/material';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple Validations
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);

    if (result.success) {
      // Redirect based on role
      // We refetch stored user state to route correctly
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } else {
      setError(result.message || 'Login failed. Invalid credentials.');
    }
  };

  return (
    <Box 
      className="min-h-screen w-screen flex flex-col justify-center items-center px-4"
      sx={{ 
        background: '#FFFFFF'
      }}
    >
      {/* Branding Header */}
      <Box className="flex items-center gap-2 mb-6 animate-fade-in">
        <img src="/logo.png" alt="Google Gemini" className="h-10 w-auto object-contain" />
        <Typography 
          variant="h4" 
          className="font-bold text-google-dark dark:text-white"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Gemini <span className="text-google-blue">Student Portal</span>
        </Typography>
      </Box>

      {/* Login Card */}
      <Card 
        className="w-full max-w-[420px] border border-google-border/50"
        sx={{ 
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
        }}
      >
        <CardContent className="p-8">
          <Typography 
            variant="h5" 
            className="text-center font-bold mb-6 text-google-dark dark:text-white"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" className="mb-4 rounded-lg">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <TextField
              label="Email address"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              size="medium"
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              size="medium"
            />

            <Box className="flex items-center justify-between mt-1">
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
                    Remember me
                  </Typography>
                }
              />
              <Link 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Please contact your portal administrator to reset your password."); }} 
                variant="body2" 
                className="text-google-blue hover:underline"
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              className="py-2.5 mt-2 bg-google-blue hover:bg-google-blue-hover text-white capitalize font-medium rounded-full shadow-none"
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} className="text-white" /> : 'Next'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Help links */}
      <Box className="mt-8 flex gap-4 text-xs text-google-gray dark:text-google-gray-light">
        <Link href="#" className="hover:underline">Privacy Policy</Link>
        <span>•</span>
        <Link href="#" className="hover:underline">Terms of Service</Link>
        <span>•</span>
        <Link href="#" className="hover:underline">Help Support</Link>
      </Box>
    </Box>
  );
};
