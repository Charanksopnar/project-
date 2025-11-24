import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { tokens, ColorModeContext, useMode } from '../../theme';
import Header from '../../newComponents/Header.jsx';
import Topbar from '../global/Topbar';
import Sidebar from '../global/Sidebar';
import axios from 'axios';
import { BASE_URL } from '../../../../helper';
import io from 'socket.io-client';

const InvalidVotesContent = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [invalidVotes, setInvalidVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVotes, setFilteredVotes] = useState([]);

  useEffect(() => {
    const fetchInvalidVotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/getInvalidVotes`);

        if (response.data.success) {
          // Add an id field for DataGrid
          const formattedData = response.data.invalidVotes.map((vote, index) => ({
            ...vote,
            id: vote._id || index.toString()
          }));

          setInvalidVotes(formattedData);
          setFilteredVotes(formattedData);
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

    // Socket connection for live updates
    const socket = io(BASE_URL);

    socket.on('connect', () => {
      console.log('Connected to socket server for invalid votes updates');
    });

    socket.on('admin:security-alert', (alert) => {
      if (alert.type === 'VOTING_VIOLATION') {
        setInvalidVotes((prevVotes) => {
          // Create new vote object from alert data
          const newVote = {
            id: `live_${Date.now()}`, // Temporary ID until refresh
            voterId: alert.voterId,
            candidateId: 'N/A', // Not usually in alert but consistent with schema
            violationType: alert.violationType,
            violationDetails: alert.message,
            timestamp: alert.timestamp
          };

          const updatedVotes = [...prevVotes, newVote];
          // Also update filtered votes if no search query is active
          setFilteredVotes((prevFiltered) => {
            if (searchQueryRef.current === '') {
              return [...prevFiltered, newVote];
            }
            return prevFiltered;
          });

          return updatedVotes;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Ref to keep track of search query inside socket callback
  const searchQueryRef = React.useRef('');

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredVotes(invalidVotes);
    } else {
      const filtered = invalidVotes.filter((vote) =>
        vote.voterId?.toLowerCase().includes(query.toLowerCase()) ||
        vote.candidateId?.toLowerCase().includes(query.toLowerCase()) ||
        vote.violationType?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredVotes(filtered);
    }
  };

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

  // Handle refresh functionality
  const handleRefresh = () => {
    setLoading(true);
    window.location.reload();
  };

  // Handle export to CSV
  const handleExport = () => {
    try {
      const headers = ['ID', 'Voter ID', 'Candidate ID', 'Violation Type', 'Details', 'Timestamp'];
      const csvData = filteredVotes.map(vote => [
        vote.id,
        vote.voterId,
        vote.candidateId,
        formatViolationType(vote.violationType),
        vote.violationDetails,
        new Date(vote.timestamp).toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      element.setAttribute('download', 'invalid_votes.csv');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting data:', error);
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
          rows={filteredVotes}
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

const InvalidVotes = () => {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="appNew">
          <Sidebar />
          <main className="content">
            <Topbar />
            <InvalidVotesContent />
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default InvalidVotes;
