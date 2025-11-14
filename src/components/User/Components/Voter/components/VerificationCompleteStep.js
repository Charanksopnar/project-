import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const VerificationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
}));

const SimilarityMeter = styled(Box)(({ theme, percentage }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: '5px',
  backgroundColor:
    percentage >= 60 && percentage <= 80
      ? theme.palette.success.light
      : theme.palette.error.light,
  color:
    percentage >= 60 && percentage <= 80
      ? theme.palette.success.dark
      : theme.palette.error.dark,
  textAlign: 'center',
  fontWeight: 'bold'
}));

const VerificationCompleteStep = ({ similarityPercentage, verificationId }) => {
  return (
    <VerificationPaper>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom color="success.main">
          🎉 Verification Complete!
        </Typography>
        <Typography variant="body1" paragraph>
          All verification steps have been completed successfully.
        </Typography>

        {similarityPercentage && (
          <SimilarityMeter percentage={similarityPercentage}>
            <Typography variant="body1">
              Overall Face Similarity: {similarityPercentage}%
            </Typography>
            <Typography variant="body2">
              {similarityPercentage >= 60 && similarityPercentage <= 80
                ? 'Match is within acceptable range (60%-80%)'
                : 'Match is outside acceptable range (60%-80%)'}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={similarityPercentage}
              color={similarityPercentage >= 60 && similarityPercentage <= 80 ? "success" : "error"}
              sx={{ mt: 1, height: 10, borderRadius: 5 }}
            />
          </SimilarityMeter>
        )}

        <Box sx={{ mt: 3 }}>
          <Alert severity="success">
            You can now proceed to vote!
          </Alert>
        </Box>

        {verificationId && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Verification ID: {verificationId}
          </Typography>
        )}
      </Box>
    </VerificationPaper>
  );
};

export default VerificationCompleteStep;