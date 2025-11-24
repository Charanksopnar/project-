import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Grid,
  InputLabel,
  FormHelperText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { BASE_URL } from '../../helper';

const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  border: '2px dashed #999',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: '#f9f9f9',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: '#f0f7ff'
  }
}));

const FileInput = styled('input')({
  display: 'none'
});

const KYCVerification = ({ voterId, initialData, onSkip, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    voterId: initialData?.voterId || '',
    fullName: initialData?.fullName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    address: initialData?.address || ''
  });

  const [files, setFiles] = useState({
    idDocument: null,
    idBackside: null,
    selfie: null
  });

  const [fileNames, setFileNames] = useState({
    idDocument: '',
    idBackside: '',
    selfie: ''
  });

  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [fileType]: 'Please upload a valid image (JPG, PNG) or PDF file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [fileType]: 'File size must be less than 5MB'
        }));
        return;
      }

      setFiles(prev => ({
        ...prev,
        [fileType]: file
      }));
      setFileNames(prev => ({
        ...prev,
        [fileType]: file.name
      }));
      // Clear error for this field
      if (errors[fileType]) {
        setErrors(prev => ({
          ...prev,
          [fileType]: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.voterId.trim()) {
      newErrors.voterId = 'Voter ID is required';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!files.idDocument) {
      newErrors.idDocument = 'ID document is required';
    }
    if (!files.selfie) {
      newErrors.selfie = 'Selfie is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    setErrorMessage('');
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('voterId', formData.voterId);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('address', formData.address);

      // Append files
      if (files.idDocument) {
        formDataToSend.append('idDocument', files.idDocument);
      }
      if (files.idBackside) {
        formDataToSend.append('idBackside', files.idBackside);
      }
      if (files.selfie) {
        formDataToSend.append('selfie', files.selfie);
      }

      const response = await axios.post(
        `${BASE_URL}/submitKYC/${voterId}`,
        formDataToSend
      );

      if (response.data.success) {
        setSuccess(true);
        if (onSubmit) {
          onSubmit(response.data);
        }
      } else {
        setErrorMessage(response.data.message || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      setErrorMessage(error.response?.data?.message || 'Error submitting KYC. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (success) {
    return (
      <Card sx={{ maxWidth: 600, margin: '0 auto', mt: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main' }}>
            KYC Submitted Successfully!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            Your KYC documents have been submitted and are pending admin review.
            You will be able to vote once your verification is approved.
          </Typography>
          <Typography variant="body2" sx={{ color: 'info.main' }}>
            Submission Attempts: {submitLoading ? '...' : 'Recorded'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 700, margin: '0 auto', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
          📋 KYC / Verification (Know Your Customer)
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Complete this form to verify your identity. All information must be accurate and match your government-issued ID.
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Voter Information Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Voter ID"
                  name="voterId"
                  value={formData.voterId}
                  onChange={handleInputChange}
                  error={!!errors.voterId}
                  helperText={errors.voterId}
                  placeholder="e.g., VOTER123456"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  placeholder="As per ID"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={!!errors.address}
                  helperText={errors.address}
                  placeholder="Complete address"
                  variant="outlined"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Document Upload Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📸 Document Upload
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Upload clear, legible images of your ID documents. Accepted formats: JPG, PNG (max 5MB each)
            </Typography>

            {/* ID Document Upload */}
            <Box sx={{ mb: 3 }}>
              <InputLabel sx={{ mb: 1, fontWeight: 'bold' }}>
                Government ID (Front Side) *
              </InputLabel>
              <UploadBox
                component="label"
                sx={{
                  borderColor: errors.idDocument ? '#d32f2f' : '#999',
                  backgroundColor: files.idDocument ? '#e8f5e9' : '#f9f9f9'
                }}
              >
                <FileInput
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={(e) => handleFileChange(e, 'idDocument')}
                />
                <Box sx={{ py: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {fileNames.idDocument ? fileNames.idDocument : 'Click to upload or drag and drop'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Passport, Driver's License, or National ID Card
                  </Typography>
                </Box>
              </UploadBox>
              {errors.idDocument && (
                <FormHelperText error>
                  {errors.idDocument}
                </FormHelperText>
              )}
            </Box>

            {/* ID Backside Upload (Optional) */}
            <Box sx={{ mb: 3 }}>
              <InputLabel sx={{ mb: 1, fontWeight: 'bold' }}>
                Government ID (Back Side) <Typography variant="caption" sx={{ color: 'text.secondary' }}>(Optional)</Typography>
              </InputLabel>
              <UploadBox
                component="label"
                sx={{
                  borderColor: errors.idBackside ? '#d32f2f' : '#999',
                  backgroundColor: files.idBackside ? '#e8f5e9' : '#f9f9f9'
                }}
              >
                <FileInput
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={(e) => handleFileChange(e, 'idBackside')}
                />
                <Box sx={{ py: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {fileNames.idBackside ? fileNames.idBackside : 'Click to upload or drag and drop'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    If applicable
                  </Typography>
                </Box>
              </UploadBox>
              {errors.idBackside && (
                <FormHelperText error>
                  {errors.idBackside}
                </FormHelperText>
              )}
            </Box>

            {/* Selfie Upload */}
            <Box sx={{ mb: 3 }}>
              <InputLabel sx={{ mb: 1, fontWeight: 'bold' }}>
                Live Selfie / Photo *
              </InputLabel>
              <UploadBox
                component="label"
                sx={{
                  borderColor: errors.selfie ? '#d32f2f' : '#999',
                  backgroundColor: files.selfie ? '#e8f5e9' : '#f9f9f9'
                }}
              >
                <FileInput
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                />
                <Box sx={{ py: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {fileNames.selfie ? fileNames.selfie : 'Click to upload or drag and drop'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Clear, well-lit photo of your face
                  </Typography>
                </Box>
              </UploadBox>
              {errors.selfie && (
                <FormHelperText error>
                  {errors.selfie}
                </FormHelperText>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onSkip}
              disabled={submitLoading || isLoading}
            >
              ⏭️ Skip Verification for Now
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitLoading || isLoading}
              sx={{ minWidth: 180 }}
            >
              {submitLoading || isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                '✓ Complete Verification'
              )}
            </Button>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', textAlign: 'center' }}>
            Your information is encrypted and stored securely. It will only be used for verification purposes.
          </Typography>
        </form>
      </CardContent>
    </Card>
  );
};

export default KYCVerification;
