import React, { useState } from 'react';
import { Box, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useRealtime } from '../../context/RealtimeContext';
import { BASE_URL } from '../../helper';

const regions = ['Village', 'City', 'Taluk', 'District', 'State', 'Nation'];

const RegionElectionConfig = () => {
    const { electionsData, emitElectionRegionUpdate } = useRealtime();
    const [selectedElectionId, setSelectedElectionId] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [enabled, setEnabled] = useState(false);

    const handleSave = async () => {
        if (!selectedElectionId) return;

        try {
            // 1. Update MongoDB via API
            const response = await fetch(`${BASE_URL}/api/updateElectionRegion/${selectedElectionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header if needed, assuming admin token is stored
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ region: selectedRegion })
            });

            const data = await response.json();

            if (data.success) {
                // 2. Emit socket event for real-time update
                emitElectionRegionUpdate(selectedElectionId, selectedRegion);
                alert('Region configuration saved successfully!');

                // Reset UI
                setSelectedElectionId('');
                setSelectedRegion('');
                setEnabled(false);
            } else {
                alert('Failed to save configuration: ' + data.message);
            }
        } catch (error) {
            console.error('Error saving region config:', error);
            alert('Error saving configuration');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Region Election Configuration
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="election-select-label">Election</InputLabel>
                <Select
                    labelId="election-select-label"
                    value={selectedElectionId}
                    label="Election"
                    onChange={(e) => setSelectedElectionId(e.target.value)}
                >
                    {electionsData.map((el) => (
                        <MenuItem key={el._id} value={el._id}>
                            {el.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="region-select-label">Region</InputLabel>
                <Select
                    labelId="region-select-label"
                    value={selectedRegion}
                    label="Region"
                    onChange={(e) => setSelectedRegion(e.target.value)}
                >
                    {regions.map((r) => (
                        <MenuItem key={r} value={r}>
                            {r}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControlLabel
                control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Enable Election for this Region"
                sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handleSave} disabled={!selectedElectionId || !selectedRegion}>
                Save Configuration
            </Button>
        </Box>
    );
};

export default RegionElectionConfig;
