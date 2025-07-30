import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  ProgressBar,
  Badge,
  Table,
  Modal,
  Spinner
} from 'react-bootstrap';
import { FaUpload, FaPlay, FaStop, FaHistory, FaRobot, FaChartLine } from 'react-icons/fa';

const MLDocumentTraining = () => {
  const [trainingSession, setTrainingSession] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [datasetType, setDatasetType] = useState('training');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2
  });

  // Available document types
  const DOCUMENT_TYPES = {
    aadhar: 'Aadhar Card',
    voter_id: 'Voter ID',
    driving_license: 'Driving License',
    passport: 'Passport',
    pan_card: 'PAN Card',
    bank_statement: 'Bank Statement',
    utility_bill: 'Utility Bill'
  };

  useEffect(() => {
    fetchDocumentTypes();
    fetchTrainingHistory();
    fetchSessionStats();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch('/api/ml-documents/document-types');
      const data = await response.json();
      if (data.success) {
        setDocumentTypes(data.supportedTypes);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const fetchTrainingHistory = async () => {
    try {
      const response = await fetch('/api/ml-documents/training/history');
      const data = await response.json();
      if (data.success) {
        setTrainingHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching training history:', error);
    }
  };

  const fetchSessionStats = async () => {
    try {
      const response = await fetch('/api/ml-documents/training/session/stats');
      const data = await response.json();
      if (data.success) {
        setSessionStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const initializeTrainingSession = async () => {
    try {
      const response = await fetch('/api/ml-documents/training/session/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: trainingConfig })
      });

      const data = await response.json();
      if (data.success) {
        setTrainingSession(data.session);
        showAlert('success', 'Training session initialized successfully!');
        fetchSessionStats();
      } else {
        showAlert('danger', `Error: ${data.error}`);
      }
    } catch (error) {
      showAlert('danger', `Error initializing training session: ${error.message}`);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadFiles(files);
  };

  const uploadTrainingSamples = async () => {
    if (uploadFiles.length === 0) {
      showAlert('warning', 'Please select files to upload');
      return;
    }

    if (!selectedDocumentType) {
      showAlert('warning', 'Please select a document type');
      return;
    }

    try {
      const formData = new FormData();
      
      // Add files
      uploadFiles.forEach(file => {
        formData.append('samples', file);
      });

      // Add document types (same type for all files in this simple implementation)
      const documentTypesArray = new Array(uploadFiles.length).fill(selectedDocumentType);
      formData.append('documentTypes', JSON.stringify(documentTypesArray));
      formData.append('datasetType', datasetType);

      const response = await fetch('/api/ml-documents/training/samples/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        showAlert('success', `Successfully uploaded ${data.samplesAdded} training samples!`);
        setUploadFiles([]);
        document.getElementById('fileInput').value = '';
        fetchSessionStats();
      } else {
        showAlert('danger', `Error: ${data.error}`);
      }
    } catch (error) {
      showAlert('danger', `Error uploading samples: ${error.message}`);
    }
  };

  const startTraining = async () => {
    if (!sessionStats || sessionStats.datasetStats.training === 0) {
      showAlert('warning', 'Please upload training samples before starting training');
      return;
    }

    setIsTraining(true);
    try {
      const response = await fetch('/api/ml-documents/training/start', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        showAlert('success', 'Training completed successfully!');
        fetchTrainingHistory();
        fetchSessionStats();
      } else {
        showAlert('danger', `Training failed: ${data.error}`);
      }
    } catch (error) {
      showAlert('danger', `Error starting training: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const clearSession = async () => {
    try {
      const response = await fetch('/api/ml-documents/training/session/clear', {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setTrainingSession(null);
        setSessionStats(null);
        showAlert('success', 'Training session cleared successfully!');
      } else {
        showAlert('danger', `Error: ${data.error}`);
      }
    } catch (error) {
      showAlert('danger', `Error clearing session: ${error.message}`);
    }
  };

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center">
            <FaRobot className="me-2" />
            ML Document Training System
          </h2>
          <p className="text-muted">
            Train machine learning models to identify and classify different types of documents
          </p>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false })}>
          {alert.message}
        </Alert>
      )}

      <Row>
        {/* Training Configuration */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Training Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Epochs</Form.Label>
                      <Form.Control
                        type="number"
                        value={trainingConfig.epochs}
                        onChange={(e) => setTrainingConfig({
                          ...trainingConfig,
                          epochs: parseInt(e.target.value)
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Batch Size</Form.Label>
                      <Form.Control
                        type="number"
                        value={trainingConfig.batchSize}
                        onChange={(e) => setTrainingConfig({
                          ...trainingConfig,
                          batchSize: parseInt(e.target.value)
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Learning Rate</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.001"
                        value={trainingConfig.learningRate}
                        onChange={(e) => setTrainingConfig({
                          ...trainingConfig,
                          learningRate: parseFloat(e.target.value)
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Validation Split</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={trainingConfig.validationSplit}
                        onChange={(e) => setTrainingConfig({
                          ...trainingConfig,
                          validationSplit: parseFloat(e.target.value)
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button
                  variant="primary"
                  onClick={initializeTrainingSession}
                  disabled={isTraining}
                  className="w-100"
                >
                  Initialize Training Session
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Session Status */}
          {sessionStats && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Session Status</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Session ID:</strong> {sessionStats.sessionId}
                </div>
                <div className="mb-3">
                  <strong>Status:</strong>{' '}
                  <Badge bg={sessionStats.status === 'completed' ? 'success' : 
                             sessionStats.status === 'training' ? 'warning' : 'secondary'}>
                    {sessionStats.status}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Dataset Statistics:</strong>
                  <ul className="mt-2">
                    <li>Training: {sessionStats.datasetStats.training} samples</li>
                    <li>Validation: {sessionStats.datasetStats.validation} samples</li>
                    <li>Test: {sessionStats.datasetStats.test} samples</li>
                  </ul>
                </div>
                {sessionStats.progress && (
                  <div className="mb-3">
                    <strong>Training Progress:</strong>
                    <ProgressBar
                      now={(sessionStats.progress.currentEpoch / sessionStats.progress.totalEpochs) * 100}
                      label={`${sessionStats.progress.currentEpoch}/${sessionStats.progress.totalEpochs}`}
                      className="mt-2"
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Upload and Training */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Upload Training Data</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Document Type</Form.Label>
                    <Form.Select
                      value={selectedDocumentType}
                      onChange={(e) => setSelectedDocumentType(e.target.value)}
                    >
                      <option value="">Select document type...</option>
                      {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dataset Type</Form.Label>
                    <Form.Select
                      value={datasetType}
                      onChange={(e) => setDatasetType(e.target.value)}
                    >
                      <option value="training">Training</option>
                      <option value="validation">Validation</option>
                      <option value="test">Test</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Select Images</Form.Label>
                <Form.Control
                  id="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Form.Text className="text-muted">
                  Select multiple image files for training. Supported formats: JPG, PNG, GIF
                </Form.Text>
              </Form.Group>
              {uploadFiles.length > 0 && (
                <div className="mb-3">
                  <strong>Selected Files:</strong>
                  <ul className="mt-2">
                    {uploadFiles.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  onClick={uploadTrainingSamples}
                  disabled={isTraining || uploadFiles.length === 0}
                >
                  <FaUpload className="me-2" />
                  Upload Samples
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Training Controls */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Training Controls</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-2 mb-3">
                <Button
                  variant="primary"
                  onClick={startTraining}
                  disabled={isTraining || !sessionStats || sessionStats.datasetStats.training === 0}
                >
                  {isTraining ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Training...
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-2" />
                      Start Training
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={clearSession}
                  disabled={isTraining}
                >
                  Clear Session
                </Button>
                <Button
                  variant="outline-info"
                  onClick={() => setShowHistoryModal(true)}
                >
                  <FaHistory className="me-2" />
                  View History
                </Button>
              </div>
              {isTraining && (
                <Alert variant="info">
                  <Spinner size="sm" className="me-2" />
                  Training in progress... This may take several minutes depending on the dataset size and configuration.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Training History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Training History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {trainingHistory.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Start Time</th>
                  <th>Status</th>
                  <th>Final Accuracy</th>
                  <th>Samples</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {trainingHistory.map((session, index) => (
                  <tr key={index}>
                    <td>{session.id.substring(0, 8)}...</td>
                    <td>{new Date(session.startTime).toLocaleString()}</td>
                    <td>
                      <Badge bg={session.status === 'completed' ? 'success' : 
                                 session.status === 'failed' ? 'danger' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </td>
                    <td>{session.finalAccuracy ? (session.finalAccuracy * 100).toFixed(2) + '%' : 'N/A'}</td>
                    <td>{session.sampleCount}</td>
                    <td>{session.trainingTime ? Math.round(session.trainingTime / 1000) + 's' : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No training history available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MLDocumentTraining;
