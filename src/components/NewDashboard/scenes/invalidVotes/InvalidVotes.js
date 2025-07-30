import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { tokens } from '../../theme';
import Header from '../../newComponents/Header.jsx';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';

const InvalidVotes = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [invalidVotes, setInvalidVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvalidVotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/getInvalidVotes`);

        if (response.data.success) {
          // Add an id field for DataGrid
          const formattedData = response.data.invalidVotes.map((vote, index) => ({
            ...vote,
            id: vote._id || index.toString()
          }));

          setInvalidVotes(formattedData);
        } else {
          setError('Failed to fetch invalid votes');
        }
      } catch (error) {
        console.error('Error fetching invalid votes:', error);
        setError('Error fetching invalid votes');
      } finally {
        setLoading(false);
      }
    };

    fetchInvalidVotes();
  }, []);

  // Format violation type for display
  const formatViolationType = (type) => {
    switch (type) {
      case 'multiple_faces':
        return 'Multiple Faces Detected';
      case 'multiple_voices':
        return 'Multiple Voices Detected';
      case 'fraud_detection':
        return 'Fraud Detection';
      default:
        return 'Other Violation';
    }
  };

  // DataGrid columns
  const columns = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'voterId', headerName: 'Voter ID', flex: 1 },
    { field: 'candidateId', headerName: 'Candidate ID', flex: 1 },
    {
      field: 'violationType',
      headerName: 'Violation Type',
      flex: 1.5,
      renderCell: ({ row }) => (
        <Box
          width="80%"
          m="0 auto"
          p="5px"
          display="flex"
          justifyContent="center"
          backgroundColor={
            row.violationType === 'multiple_faces'
              ? colors.redAccent[600]
              : row.violationType === 'multiple_voices'
              ? colors.redAccent[700]
              : colors.redAccent[800]
          }
          borderRadius="4px"
        >
          <Typography color={colors.grey[100]} sx={{ ml: '5px' }}>
            {formatViolationType(row.violationType)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'violationDetails',
      headerName: 'Details',
      flex: 2
    },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      flex: 1,
      renderCell: ({ row }) => {
        const date = new Date(row.timestamp);
        return date.toLocaleString();
      }
    }
  ];

  return (
    <Box m="20px">
      <Header title="INVALID VOTES" subtitle="List of votes invalidated due to security violations" />

      {error && (
        <Typography color="error" variant="h5" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={invalidVotes}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
    </Box>
  );
};

export default InvalidVotes;
