import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { BASE_URL } from '../../helper';

function formatDate(ts) {
    try { return new Date(ts).toLocaleString(); } catch (e) { return ts; }
}

export default function AuditLogs() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchList();
    }, []);

    async function fetchList() {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/audit/list`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('fetch failed');
            const data = await res.json();
            setAudits(data.audits || []);
        } catch (err) {
            console.error('Failed to fetch audits', err);
        } finally { setLoading(false); }
    }

    async function downloadFile(videoRef) {
        if (!videoRef) return;
        try {
            const token = localStorage.getItem('adminToken');
            // videoRef is like /uploads/audits/<filename>
            const filename = videoRef.split('/').pop();
            const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/audit/download/${encodeURIComponent(filename)}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('download failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('download error', err);
            alert('Download failed. Check admin token and server.');
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Audit Records</Typography>
            <Paper sx={{ p: 2, mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Voter</TableCell>
                            <TableCell>Election</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Video</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {audits.map(a => (
                            <TableRow key={a.id}>
                                <TableCell>{a.id}</TableCell>
                                <TableCell>{a.voterId || 'N/A'}</TableCell>
                                <TableCell>{a.electionId || 'N/A'}</TableCell>
                                <TableCell>{formatDate(a.timestamp)}</TableCell>
                                <TableCell>{a.videoRef ? a.videoRef.split('/').pop() : '—'}</TableCell>
                                <TableCell>
                                    {a.videoRef && (
                                        <Button variant="contained" size="small" onClick={() => downloadFile(a.videoRef)}>Download</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
