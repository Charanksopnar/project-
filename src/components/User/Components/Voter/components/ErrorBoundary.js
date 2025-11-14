import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

const ErrorContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '10px',
  border: `1px solid ${theme.palette.error.light}`,
  backgroundColor: theme.palette.error.light + '10'
}));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <ErrorContainer>
          <Typography variant="h6" color="error" gutterBottom>
            ⚠️ Something went wrong
          </Typography>

          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              There was an error during the verification process. This might be due to:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Camera access issues</li>
              <li>Face detection model loading problems</li>
              <li>Network connectivity issues</li>
              <li>Browser compatibility issues</li>
            </ul>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please try refreshing the page or check your camera permissions.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="caption" color="error">
                <strong>Development Error Details:</strong>
              </Typography>
              <Typography variant="caption" component="pre" sx={{
                display: 'block',
                backgroundColor: '#f5f5f5',
                padding: 1,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.75rem'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;