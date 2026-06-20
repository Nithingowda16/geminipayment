import React from 'react';
import { Stepper, Step, StepLabel, Box, Typography } from '@mui/material';
import { CheckCircle, HourglassEmpty, Check, ErrorOutline } from '@mui/icons-material';

interface StatusTimelineProps {
  status: 'Submitted' | 'Payment Under Verification' | 'Approved' | 'Rejected';
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  const steps = [
    { label: 'Contract Submitted', key: 'Submitted', desc: 'Contract files and details received.' },
    { label: 'Payment Verification', key: 'Payment Under Verification', desc: 'Admin verifying UTR and screenshot proof.' },
    { label: 'Approval Status', key: 'Approved', desc: 'Final review status of application.' }
  ];

  // Helper to determine step index based on status
  const getActiveStep = () => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Payment Under Verification':
        return 1;
      case 'Approved':
      case 'Rejected':
        return 2;
      default:
        return 0;
    }
  };

  const activeStep = getActiveStep();

  // Helper to get step status properties
  const getStepIcon = (index: number) => {
    if (index < activeStep) {
      return (
        <Box className="w-8 h-8 rounded-full bg-google-green text-white flex items-center justify-center">
          <Check fontSize="small" />
        </Box>
      );
    }
    
    if (index === activeStep) {
      if (status === 'Rejected') {
        return (
          <Box className="w-8 h-8 rounded-full bg-google-red text-white flex items-center justify-center">
            <ErrorOutline fontSize="small" />
          </Box>
        );
      }
      if (status === 'Approved') {
        return (
          <Box className="w-8 h-8 rounded-full bg-google-green text-white flex items-center justify-center">
            <CheckCircle fontSize="small" />
          </Box>
        );
      }
      return (
        <Box className="w-8 h-8 rounded-full bg-google-blue text-white flex items-center justify-center animate-pulse">
          <HourglassEmpty fontSize="small" />
        </Box>
      );
    }

    return (
      <Box className="w-8 h-8 rounded-full bg-google-border dark:bg-white/10 text-google-gray dark:text-google-gray-light flex items-center justify-center">
        {index + 1}
      </Box>
    );
  };

  return (
    <Box className="w-full py-6">
      <Stepper 
        activeStep={activeStep} 
        orientation="vertical"
        sx={{
          '& .MuiStepConnector-line': {
            borderColor: 'divider',
            minHeight: '40px',
            borderLeftWidth: '2px',
            marginLeft: '4px'
          }
        }}
      >
        {steps.map((step, index) => {
          let stepLabelProps: any = {};
          
          // Customize Step Label Color based on progress
          if (index === 2 && status === 'Rejected') {
            stepLabelProps.error = true;
          }

          return (
            <Step key={step.label} expanded>
              <StepLabel 
                icon={getStepIcon(index)}
                {...stepLabelProps}
              >
                <Typography 
                  variant="subtitle1" 
                  className={`font-semibold ${
                    index === activeStep 
                      ? status === 'Rejected' 
                        ? 'text-google-red'
                        : status === 'Approved'
                          ? 'text-google-green'
                          : 'text-google-blue'
                      : 'text-google-dark dark:text-white'
                  }`}
                >
                  {index === 2 && status === 'Rejected' ? 'Application Rejected' : step.label}
                </Typography>
                
                <Typography variant="body2" className="text-google-gray dark:text-google-gray-light mt-0.5">
                  {index === 2 && status === 'Rejected' 
                    ? 'Payment proof verification failed. Please check notes and resubmit.' 
                    : index === 2 && status === 'Approved'
                      ? 'Contract and payment approved successfully! PDF receipt is ready.'
                      : step.desc}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
