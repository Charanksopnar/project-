import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';

const steps = [
  'Upload ID Document',
  'Live Video Verification',
  'Verification Complete'
];

const VerificationProgress = ({ currentStep }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Voter Verification Progress
      </Typography>

      <Stepper activeStep={currentStep - 1} alternativeLabel sx={{ mb: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <LinearProgress
        variant="determinate"
        value={(currentStep / 3) * 100}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="body2" align="center" sx={{ mt: 1 }}>
        Step {currentStep} of {steps.length}
      </Typography>
    </Box>
  );
};

export default VerificationProgress;