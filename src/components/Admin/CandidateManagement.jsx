import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Typography,
    Autocomplete,
    Card,
    CardContent,
    CardHeader,
    Chip,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Badge,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    HowToVote as VoteIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useRealtime } from '../../context/RealtimeContext';
import { BASE_URL } from '../../helper';

const CandidateManagement = () => {
    const { electionsData, candidatesData, emitAddCandidateToElection } = useRealtime();
    const [selectedElectionId, setSelectedElectionId] = useState('');
    const [selectedCandidates, setSelectedCandidates] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const MAX_CANDIDATES = 6;

    // Fetch all candidates on mount
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await fetch(`${BASE_URL}/getCandidate`);
                const data = await response.json();
                if (data.success) {
                    setSearchResults(data.candidate || []);
                }
            } catch (error) {
                console.error("Error fetching candidates:", error);
            }
        };
        fetchCandidates();
    }, [candidatesData]);

    const handleAddCandidates = async () => {
        if (!selectedElectionId || selectedCandidates.length === 0) {
            setSnackbar({ open: true, message: 'Please select an election and at least one candidate', severity: 'warning' });
            return;
        }

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const candidate of selectedCandidates) {
            try {
                const response = await fetch(`${BASE_URL}/api/addCandidateToElection/${selectedElectionId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ candidateId: candidate._id })
                });

                const data = await response.json();

                if (data.success) {
                    // Emit socket event for real-time update
                    emitAddCandidateToElection(selectedElectionId, candidate);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error('Error adding candidate:', error);
                failCount++;
            }
        }

        setLoading(false);
        setSelectedCandidates([]);

        if (successCount > 0) {
            setSnackbar({
                open: true,
                message: `Successfully added ${successCount} candidate(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
                severity: successCount === selectedCandidates.length ? 'success' : 'warning'
            });
        } else {
            setSnackbar({ open: true, message: 'Failed to add candidates', severity: 'error' });
        }
    };

    const handleRemoveCandidate = async (electionId, candidateId) => {
        try {
            const response = await fetch(`${BASE_URL}/api/removeCandidateFromElection/${electionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ candidateId })
            });

            const data = await response.json();

            if (data.success) {
                setSnackbar({ open: true, message: 'Candidate removed successfully', severity: 'success' });
                // Real-time update will be handled by socket
            } else {
                setSnackbar({ open: true, message: 'Failed to remove candidate', severity: 'error' });
            }
        } catch (error) {
            console.error('Error removing candidate:', error);
            setSnackbar({ open: true, message: 'Error removing candidate', severity: 'error' });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'current': return '#4caf50';
            case 'upcoming': return '#2196f3';
            case 'completed': return '#9e9e9e';
            default: return '#757575';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'current': return '🗳️';
            case 'upcoming': return '📅';
            case 'completed': return '✅';
            default: return '📊';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Candidate Management
            </Typography>

            {/* Add Candidates Section */}
            <Card sx={{ mb: 4, boxShadow: 3 }}>
                <CardHeader
                    title="Add Candidates to Election"
                    sx={{ bgcolor: 'primary.main', color: 'white' }}
                    avatar={<PersonIcon />}
                />
                <CardContent>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="election-select-label">Select Election</InputLabel>
                        <Select
                            labelId="election-select-label"
                            value={selectedElectionId}
                            label="Select Election"
                            onChange={(e) => setSelectedElectionId(e.target.value)}
                        >
                            {electionsData.map((el) => (
                                <MenuItem key={el._id} value={el._id}>
                                    {getStatusIcon(el.status)} {el.name || el.title} ({el.status})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Autocomplete
                        multiple
                        options={searchResults}
                        getOptionLabel={(option) => `${option.firstName} (${option.party})`}
                        value={selectedCandidates}
                        onChange={(event, newValue) => {
                            if (newValue.length <= MAX_CANDIDATES) {
                                setSelectedCandidates(newValue);
                            } else {
                                setSnackbar({
                                    open: true,
                                    message: `Maximum ${MAX_CANDIDATES} candidates can be selected at once`,
                                    severity: 'warning'
                                });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={`Search & Select Candidates (Max ${MAX_CANDIDATES})`}
                                variant="outlined"
                                fullWidth
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    key={option._id}
                                    label={`${option.firstName} (${option.party})`}
                                    {...getTagProps({ index })}
                                    color="primary"
                                    icon={<PersonIcon />}
                                />
                            ))
                        }
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddCandidates}
                            disabled={!selectedElectionId || selectedCandidates.length === 0 || loading}
                            startIcon={<CheckCircleIcon />}
                            size="large"
                        >
                            {loading ? 'Adding...' : `Add Selected Candidates (${selectedCandidates.length})`}
                        </Button>
                        {selectedCandidates.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                {selectedCandidates.length} of {MAX_CANDIDATES} selected
                            </Typography>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Display All Elections with Candidates */}
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                All Elections & Their Candidates
            </Typography>

            {electionsData.length === 0 ? (
                <Alert severity="info">No elections found. Create an election first.</Alert>
            ) : (
                electionsData.map((election) => {
                    const candidateCount = election.candidateDetails?.length || 0;
                    return (
                        <Accordion key={election._id} sx={{ mb: 2, boxShadow: 2 }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    bgcolor: getStatusColor(election.status) + '20',
                                    '&:hover': { bgcolor: getStatusColor(election.status) + '30' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                        {getStatusIcon(election.status)} {election.name || election.title}
                                    </Typography>
                                    <Chip
                                        label={election.status.toUpperCase()}
                                        size="small"
                                        sx={{
                                            bgcolor: getStatusColor(election.status),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Badge badgeContent={candidateCount} color="primary">
                                        <VoteIcon />
                                    </Badge>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                {candidateCount > 0 ? (
                                    <List>
                                        {election.candidateDetails.map((candidate, index) => (
                                            <ListItem
                                                key={candidate._id || index}
                                                sx={{
                                                    bgcolor: index % 2 === 0 ? 'grey.50' : 'white',
                                                    borderRadius: 1,
                                                    mb: 1
                                                }}
                                            >
                                                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                                                <ListItemText
                                                    primary={candidate.name || candidate.firstName}
                                                    secondary={`Party: ${candidate.party}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={() => handleRemoveCandidate(election._id, candidate._id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">No candidates added to this election yet.</Alert>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CandidateManagement;
