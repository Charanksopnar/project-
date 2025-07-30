import React, { useState, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  ProgressBar,
  Table,
  Spinner
} from 'react-bootstrap';
import { FaUpload, FaEye, FaCheckCircle, FaExclamationTriangle, FaRobot } from 'react-icons/fa';

const DocumentClassifier = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const fileInputRef = useRef(null);

  const DOCUMENT_TYPE_LABELS = {
    aadhar: 'Aadhar Card',
    voter_id: 'Voter ID',
    driving_license: 'Driving License',
    passport: 'Passport',
    pan_card: 'PAN Card',
    bank_statement: 'Bank Statement',
    utility_bill: 'Utility Bill',
    unknown: 'Unknown Document'
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert('danger', 'Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showAlert('danger', 'File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear previous results
      setClassificationResult(null);
    }
  };

  const classifyDocument = async () => {
    if (!selectedFile) {
      showAlert('warning', 'Please select a document image first');
      return;
    }

    setIsClassifying(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await fetch('/api/ml-documents/classify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setClassificationResult(data);
        showAlert('success', 'Document classified successfully!');
      } else {
        showAlert('danger', `Classification failed: ${data.error}`);
      }
    } catch (error) {
      showAlert('danger', `Error classifying document: ${error.message}`);
    } finally {
      setIsClassifying(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setClassificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  const getAuthenticityBadge = (validation) => {
    if (!validation) return null;
    
    return validation.isAuthentic ? (
      <Badge bg="success" className="d-flex align-items-center">
        <FaCheckCircle className="me-1" />
        Authentic
      </Badge>
    ) : (
      <Badge bg="danger" className="d-flex align-items-center">
        <FaExclamationTriangle className="me-1" />
        Suspicious
      </Badge>
    );
  };

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center">
            <FaRobot className="me-2" />
            Document Classifier
          </h2>
          <p className="text-muted">
            Upload a document image to classify its type and validate its authenticity using machine learning
          </p>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </Alert>
      )}

      <Row>
        {/* Upload Section */}
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Upload Document</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Select Document Image</Form.Label>
                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <Form.Text className="text-muted">
                  Supported formats: JPG, PNG, GIF (Max size: 10MB)
                </Form.Text>
              </Form.Group>

              {selectedFile && (
                <div className="mb-3">
                  <strong>Selected File:</strong>
                  <div className="mt-2">
                    <Badge bg="secondary">{selectedFile.name}</Badge>
                    <Badge bg="info" className="ms-2">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={classifyDocument}
                  disabled={!selectedFile || isClassifying}
                >
                  {isClassifying ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Classifying...
                    </>
                  ) : (
                    <>
                      <FaEye className="me-2" />
                      Classify Document
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={clearSelection}
                  disabled={isClassifying}
                >
                  Clear
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Image Preview */}
          {previewUrl && (
            <Card>
              <Card.Header>
                <h5>Document Preview</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <img
                  src={previewUrl}
                  alt="Document preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Results Section */}
        <Col lg={6}>
          {classificationResult && (
            <>
              {/* Classification Results */}
              <Card className="mb-4">
                <Card.Header>
                  <h5>Classification Results</h5>
                </Card.Header>
                <Card.Body>
                  {classificationResult.classification.success ? (
                    <>
                      <div className="mb-3">
                        <h6>Document Type:</h6>
                        <h4>
                          <Badge bg="primary">
                            {DOCUMENT_TYPE_LABELS[classificationResult.classification.documentType] || 
                             classificationResult.classification.documentType}
                          </Badge>
                        </h4>
                      </div>

                      <div className="mb-3">
                        <h6>Confidence Score:</h6>
                        <ProgressBar
                          variant={getConfidenceColor(classificationResult.classification.confidence)}
                          now={classificationResult.classification.confidence * 100}
                          label={`${(classificationResult.classification.confidence * 100).toFixed(1)}%`}
                        />
                      </div>

                      <div className="mb-3">
                        <h6>All Probabilities:</h6>
                        <Table size="sm">
                          <thead>
                            <tr>
                              <th>Document Type</th>
                              <th>Probability</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(classificationResult.classification.probabilities)
                              .sort(([,a], [,b]) => b - a)
                              .map(([type, prob]) => (
                                <tr key={type}>
                                  <td>{DOCUMENT_TYPE_LABELS[type] || type}</td>
                                  <td>
                                    <Badge bg={prob === Math.max(...Object.values(classificationResult.classification.probabilities)) ? 'success' : 'secondary'}>
                                      {(prob * 100).toFixed(1)}%
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <Alert variant="danger">
                      Classification failed: {classificationResult.classification.error}
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Authenticity Validation */}
              {classificationResult.validation && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5>Authenticity Validation</h5>
                  </Card.Header>
                  <Card.Body>
                    {classificationResult.validation.success ? (
                      <>
                        <div className="mb-3 d-flex align-items-center">
                          <h6 className="me-3">Status:</h6>
                          {getAuthenticityBadge(classificationResult.validation)}
                        </div>

                        <div className="mb-3">
                          <h6>Authenticity Score:</h6>
                          <ProgressBar
                            variant={classificationResult.validation.isAuthentic ? 'success' : 'danger'}
                            now={classificationResult.validation.authenticity_score * 100}
                            label={`${(classificationResult.validation.authenticity_score * 100).toFixed(1)}%`}
                          />
                        </div>

                        {classificationResult.validation.risk_factors && 
                         classificationResult.validation.risk_factors.length > 0 && (
                          <div className="mb-3">
                            <h6>Risk Factors:</h6>
                            <ul className="list-unstyled">
                              {classificationResult.validation.risk_factors.map((factor, index) => (
                                <li key={index}>
                                  <Badge bg="warning" className="me-2">!</Badge>
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <Alert variant="warning">
                        Validation failed: {classificationResult.validation.error}
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Feature Analysis */}
              {classificationResult.features && classificationResult.features.success && (
                <Card>
                  <Card.Header>
                    <h5>Feature Analysis</h5>
                  </Card.Header>
                  <Card.Body>
                    {classificationResult.features.textFeatures && (
                      <div className="mb-3">
                        <h6>Text Features Detected:</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(classificationResult.features.textFeatures)
                            .filter(([key, value]) => value === true)
                            .map(([key]) => (
                              <Badge key={key} bg="info">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {classificationResult.features.layoutFeatures && (
                      <div className="mb-3">
                        <h6>Layout Analysis:</h6>
                        <Table size="sm">
                          <tbody>
                            <tr>
                              <td>Dimensions:</td>
                              <td>{classificationResult.features.layoutFeatures.width} × {classificationResult.features.layoutFeatures.height}</td>
                            </tr>
                            <tr>
                              <td>Aspect Ratio:</td>
                              <td>{classificationResult.features.layoutFeatures.aspectRatio?.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Brightness:</td>
                              <td>{classificationResult.features.layoutFeatures.brightness?.toFixed(1)}</td>
                            </tr>
                            <tr>
                              <td>Contrast:</td>
                              <td>{classificationResult.features.layoutFeatures.contrast?.toFixed(1)}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    )}

                    {classificationResult.features.extractedText && (
                      <div className="mb-3">
                        <h6>Extracted Text (Sample):</h6>
                        <div className="bg-light p-2 rounded" style={{ maxHeight: '150px', overflow: 'auto' }}>
                          <small>{classificationResult.features.extractedText.substring(0, 500)}
                            {classificationResult.features.extractedText.length > 500 && '...'}
                          </small>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          {!classificationResult && !isClassifying && (
            <Card>
              <Card.Body className="text-center text-muted">
                <FaUpload size={48} className="mb-3" />
                <p>Upload a document image to see classification results</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DocumentClassifier;
