import { useState, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../../../helper';

export const useVerification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stepResults, setStepResults] = useState({ id: null, video: null });
  const [similarityPercentage, setSimilarityPercentage] = useState(null);

  const verifyIdDocument = useCallback(async (idImage) => {
    if (!idImage) {
      setError('Please upload an ID image first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('idImage', idImage);
      formData.append('step', 'id');

      console.log('Verifying ID...');

      const response = await axios.post(`${BASE_URL}/verify-voter-step`, formData);

      if (response.data.success) {
        setStepResults(prev => ({ ...prev, id: response.data }));
        console.log('ID verification successful:', response.data);
        return response.data;
      } else {
        setError(response.data.message || 'ID verification failed. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('ID verification error:', error);
      const errorMessage = error.response?.data?.message || 'ID verification failed. Please try again.';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyVideoFrame = useCallback(async (videoFrame, idImage) => {
    if (!videoFrame) {
      setError('Please capture a video frame first');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('videoFrame', videoFrame);
      formData.append('idImage', idImage);
      formData.append('step', 'video');

      console.log('Verifying video frame...');

      const response = await axios.post(`${BASE_URL}/verify-voter-step`, formData);

      if (response.data.success) {
        console.log('✅ Video verification successful:', response.data);
        setStepResults(prev => ({ ...prev, video: response.data }));
        setSimilarityPercentage(response.data.similarityPercentage);
        return response.data;
      } else {
        console.log('❌ Video verification failed:', response.data);
        setError(response.data.message || 'Video verification failed. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Video verification error:', error);
      const errorMessage = error.response?.data?.message || 'Video verification failed. Please try again.';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeVerification = useCallback((finalResult) => {
    console.log('🎉 completeVerification called with:', finalResult);

    setSimilarityPercentage(finalResult.similarityPercentage);

    console.log('📋 Verification ID received:', finalResult.verificationId);
    console.log('📊 Similarity percentage:', finalResult.similarityPercentage);

    const successMessage = `Verification completed successfully! Overall similarity: ${finalResult.similarityPercentage}%`;
    alert(successMessage);

    return finalResult.verificationId;
  }, []);

  const resetVerification = useCallback(() => {
    setError(null);
    setSimilarityPercentage(null);
    setStepResults({ id: null, video: null });
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    stepResults,
    similarityPercentage,
    verifyIdDocument,
    verifyVideoFrame,
    completeVerification,
    resetVerification,
    setError
  };
};