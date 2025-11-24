import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const VerificationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
}));

const ImagePreview = styled('img')({
  width: '100%',
  maxHeight: '200px',
  objectFit: 'contain',
  marginTop: '10px',
  borderRadius: '5px'
});

const IdUploadStep = ({ onVerificationComplete, onNext }) => {
  const [idImage, setIdImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateImageFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return 'Please upload a valid image file (JPEG, PNG, etc.)';
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
    }

    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return 'Invalid file name';
    }

    return null;
  };

  const handleIdImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIdImage(file);
      setError(null);
    }
  };

  const handleVerification = async () => {
    if (!idImage) {
      setError('Please upload an ID image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here you would call the verification API using the hook
      // For now, we'll simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      onVerificationComplete({
        success: true,
        similarityPercentage: 75,
        verificationId: 'id_' + Date.now()
      });
    } catch (error) {
      setError('ID verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VerificationPaper>
      <Typography variant="h6" gutterBottom>
        Upload Your ID Document
      </Typography>
      <Typography variant="body2" paragraph color="text.secondary">
        Please upload a government-issued ID (Aadhar or Voter ID).
        Make sure the photo on your ID is clearly visible.
      </Typography>

      <Box>
        {idImage ? (
          <ImagePreview src={URL.createObjectURL(idImage)} alt="ID preview" />
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #ccc',
              borderRadius: '5px'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No ID uploaded yet
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            component="label"
            disabled={loading}
          >
            {idImage ? 'Change ID' : 'Upload ID'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleIdImageChange}
            />
          </Button>

          {idImage && (
            <Button
              variant="contained"
              onClick={handleVerification}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Verify ID'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </VerificationPaper>
  );
};

export default IdUploadStep;