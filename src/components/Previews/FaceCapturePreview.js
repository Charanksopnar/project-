import React, { useState } from 'react';
import FaceCapture from '../Common/FaceCapture';
import { Box, Typography, Container, Card, CardMedia, CardContent } from '@mui/material';
import Nav_bar from '../Navbar/Navbar';

const FaceCapturePreview = () => {
    const [capturedFile, setCapturedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleCapture = (file, url) => {
        console.log("Captured file:", file);
        setCapturedFile(file);
        setPreviewUrl(url);
    };

    return (
        <Box>
            <Nav_bar />
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Face Collection Preview
                </Typography>
                <Typography variant="body1" paragraph align="center" color="textSecondary">
                    This is a preview of the facial data collection interface.
                    In the final implementation, this will be part of the registration or verification process.
                </Typography>

                <Box sx={{ mb: 4 }}>
                    <FaceCapture onCapture={handleCapture} />
                </Box>

                {previewUrl && (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Card sx={{ maxWidth: 345 }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={previewUrl}
                                alt="Captured Face"
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    Captured Data
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    File Name: {capturedFile?.name}<br />
                                    Size: {(capturedFile?.size / 1024).toFixed(2)} KB<br />
                                    Type: {capturedFile?.type}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default FaceCapturePreview;
