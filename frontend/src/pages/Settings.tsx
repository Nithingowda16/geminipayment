import React from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Button, 
  Divider,
  Alert
} from '@mui/material';
import { Cached, DeleteSweep } from '@mui/icons-material';

export const Settings: React.FC = () => {
  const handleClearDrafts = () => {
    sessionStorage.removeItem('contract_draft');
    alert("Contract application drafts cleared successfully.");
  };

  return (
    <Box className="p-1 md:p-4 max-w-3xl mx-auto">
      {/* Title */}
      <Box className="mb-6">
        <Typography variant="h4" className="font-bold text-google-dark dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Portal Settings
        </Typography>
        <Typography variant="body2" className="text-google-gray dark:text-google-gray-light">
          Configure portal settings, clear application caches, and check security parameters.
        </Typography>
      </Box>

      <Card className="shadow-google-card border border-google-border/20 dark:border-white/5 dark:bg-google-dark">
        <CardContent className="p-6 md:p-8 flex flex-col gap-6">
          
          {/* Section 2: Application Data */}
          <Box>
            <Typography variant="h6" className="font-semibold text-google-dark dark:text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              System Storage & Cache
            </Typography>
            <Typography variant="body2" className="text-google-gray dark:text-google-gray-light mb-4">
              Manage temporary form entries stored on this browser.
            </Typography>

            <Box className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteSweep />}
                onClick={handleClearDrafts}
              >
                Clear Form Draft Cache
              </Button>
              
              <Button 
                variant="outlined" 
                color="inherit" 
                startIcon={<Cached />}
                onClick={() => {
                  window.location.reload();
                }}
              >
                Sync Session State
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Section 3: Connection Status */}
          <Box>
            <Typography variant="h6" className="font-semibold text-google-dark dark:text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Security Parameters
            </Typography>
            <Alert severity="info" className="rounded-xl">
              Your session uses OAuth 2.0 Web Tokens (JWT) stored locally with SHA-256 signature hashes to communicate with servers securely.
            </Alert>
          </Box>
          
        </CardContent>
      </Card>
    </Box>
  );
};
