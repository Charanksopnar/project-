
import React, { useState } from 'react';
import axios from 'axios';
import "./IdVerification.css";
import UserNavbar from "../Navbar/UserNavbar";

const IdVerification = () => {
    const [idImage, setIdImage] = useState(null);
    const [faceImage, setFaceImage] = useState(null);
    const [idType, setIdType] = useState('aadhar');
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);

    const handleIdImageChange = (e) => {
        setIdImage(e.target.files[0]);
    };

    const handleFaceImageChange = (e) => {
        setFaceImage(e.target.files[0]);
    };

    const handleIdTypeChange = (e) => {
        setIdType(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setVerificationResult(null);

        if (!idImage) {
            setError("ID image is required.");
            return;
        }

        const formData = new FormData();
        formData.append('idImage', idImage);
        formData.append('idType', idType);
        if (faceImage) {
            formData.append('faceImage', faceImage);
        }

        try {
            const res = await axios.post('/api/security/verify-id', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setVerificationResult(res.data);
        } catch (err) {
            setError(err.response ? err.response.data.message : "An error occurred.");
        }
    };

    return (
        <div>
            <UserNavbar />
            <div className="id-verification-container">
                <h2>ID Verification</h2>
                <form onSubmit={handleSubmit} className="id-verification-form">
                    <div className="form-group">
                        <label htmlFor="idType">ID Type</label>
                        <select id="idType" value={idType} onChange={handleIdTypeChange}>
                            <option value="aadhar">Aadhar</option>
                            <option value="voter">Voter ID</option>
                            <option value="driving">Driving License</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="idImage">ID Image</label>
                        <input type="file" id="idImage" onChange={handleIdImageChange} accept="image/*" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="faceImage">Face Image (Optional)</label>
                        <input type="file" id="faceImage" onChange={handleFaceImageChange} accept="image/*" />
                    </div>
                    <button type="submit" className="submit-btn">Verify</button>
                </form>

                {error && <div className="error-message">{error}</div>}

                {verificationResult && (
                    <div className="verification-result">
                        <h3>Verification Result</h3>
                        <p>ID Verification Valid: {verificationResult.idVerification.isValid ? 'Yes' : 'No'}</p>
                        <p>ID Type: {verificationResult.idVerification.idType}</p>
                        <p>ID Number: {verificationResult.idVerification.idNumber}</p>
                        {verificationResult.faceMatch && (
                            <div>
                                <p>Face Match: {verificationResult.faceMatch.isMatch ? 'Yes' : 'No'}</p>
                                <p>Confidence: {verificationResult.faceMatch.confidence}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IdVerification;
