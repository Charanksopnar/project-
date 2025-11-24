
import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataTeam } from "../../data/mockData";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import axios from 'axios';
import {BASE_URL} from '../../../../helper'


const NewCandidates = () => {
    const [theme, colorMode] = useMode();
    const [candidate, setCandidate] = useState([]);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [editData, setEditData] = useState({
        fullName: '',
        bio: '',
        party: '',
        age: ''
    });
    const colors = tokens(theme.palette.mode);

    // Handle opening edit dialog
    const handleEditClick = (row) => {
        setSelectedCandidate(row);
        setEditData({
            fullName: row.fullName,
            bio: row.bio,
            party: row.party,
            age: row.age
        });
        setOpenEditDialog(true);
    };

    // Handle closing edit dialog
    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setSelectedCandidate(null);
        setEditData({
            fullName: '',
            bio: '',
            party: '',
            age: ''
        });
    };

    // Handle saving candidate changes
    const handleSaveChanges = async () => {
        try {
            await axios.put(`${BASE_URL}/updateCandidate/${selectedCandidate._id}`, {
                fullName: editData.fullName,
                bio: editData.bio,
                party: editData.party,
                age: editData.age
            });
            
            // Update local state
            setCandidate(candidate.map(cand => 
                cand._id === selectedCandidate._id 
                    ? { ...cand, ...editData }
                    : cand
            ));
            
            handleCloseEditDialog();
            alert('Candidate updated successfully!');
        } catch (error) {
            console.error('Error updating candidate:', error);
            alert('Error updating candidate. Please try again.');
        }
    };
    const columns = [
        {
            field: "image",
            headerName: "PHOTO",
            width: 100,
            renderCell: ({ row }) => {
                const imagePath = row.image.startsWith('default')
                    ? '/assets/default-candidate.jpg'
                    : `${BASE_URL}/uploads/${row.image}`;

                return (
                    <Box
                        width="60%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                    >
                        <img
                            src={imagePath}
                            alt={row.fullName}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "symbol",
            headerName: "PARTY SYMBOL",
            width: 100,
            renderCell: ({ row }) => {
                const symbolPath = row.symbol.startsWith('default')
                    ? '/assets/default-symbol.jpg'
                    : `${BASE_URL}/uploads/${row.symbol}`;

                return (
                    <Box
                        width="60%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                    >
                        <img
                            src={symbolPath}
                            alt={`${row.party} symbol`}
                            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "fullName",
            headerName: "CANDIDATE NAME",
            cellClassName: "name-column--cell",
        },
        {
            field: "bio",
            headerName: "CANDIDATE BIO",
            cellClassName: "name-column--cell",
            // flex:1
        },
        {
            field: "party",
            headerName: "PARTY",
            cellClassName: "name-column--cell",
        },
        {
            field: "age",
            headerName: "AGE",
            type: "number",
            headerAlign: "left",
            align: "left",
        },
        {
            headerName: "ACTION",
            flex: 1,
            renderCell: ({ row }) => {
                return (
                    <Box sx={{ display: 'flex', gap: '8px' }}>
                        <Button 
                            variant="contained" 
                            sx={{ 
                                backgroundColor: colors.blueAccent[600], 
                                color: 'white',
                                padding: '6px 16px',
                                fontSize: '12px',
                                '&:hover': {
                                    backgroundColor: colors.blueAccent[700],
                                }
                            }}
                            onClick={() => handleEditClick(row)}
                        >
                            Edit
                        </Button>
                        <Tooltip title="Delete candidate permanently" arrow>
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: colors.redAccent[600], 
                                    color: 'white',
                                    padding: '6px 16px',
                                    fontSize: '12px',
                                    '&:hover': {
                                        backgroundColor: colors.redAccent[700],
                                    }
                                }}
                                onClick={() => deleteCandidate(row._id)}
                            >
                                Delete
                            </Button>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];
    const deleteCandidate = async (id) => {
        const cand = candidate.find(c => c._id === id);
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${cand?.fullName}"?\n\nThis action cannot be undone.`
        );
        if (!confirmDelete) return;
        
        try {
            await axios.delete(`${BASE_URL}/deleteCandidate/${id}`);
            setCandidate(candidate.filter(candidate => candidate._id !== id));
            console.log(`✅ Candidate "${cand?.fullName}" deleted successfully`);
        } catch (error) {
            console.error('Error deleting candidate', error);
            alert('Error deleting candidate. Please try again.');
        }
    };
    useEffect(() =>{
        axios.get(`${BASE_URL}/getCandidate`)
        .then((response) => setCandidate(response.data.candidate))
        .catch(err => console.error("Error fetching data: ", err));
    },[])
    return (<ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="appNew">
                <Sidebar />
                <main className="content">
                    <Topbar />
                    <Box m="0px 20px">
                        <Header title="CANDIDATES INFORMATION" subtitle="Managing the Candidates" />
                        <Box
                            m="20px 0 0 0"
                            height="70vh"
                            // width="160vh"
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
                            <DataGrid rows={candidate} columns={columns} getRowId={(row) => row._id} />
                        </Box>
                    </Box>

                    {/* Edit Candidate Dialog */}
                    <Dialog 
                        open={openEditDialog} 
                        onClose={handleCloseEditDialog} 
                        maxWidth="sm" 
                        fullWidth
                        PaperProps={{
                            sx: {
                                backgroundColor: colors.primary[400],
                                zIndex: 1300
                            }
                        }}
                    >
                        <DialogTitle sx={{ 
                            backgroundColor: colors.blueAccent[700], 
                            color: colors.grey[100],
                            fontSize: '18px',
                            fontWeight: '600',
                            paddingBottom: '16px'
                        }}>
                            ✏️ Edit Candidate: {selectedCandidate?.fullName}
                        </DialogTitle>
                        <DialogContent sx={{ 
                            backgroundColor: colors.primary[400], 
                            pt: 3,
                            pb: 2
                        }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box>
                                    <Box sx={{ 
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.grey[300],
                                        textTransform: 'uppercase',
                                        mb: 1,
                                        letterSpacing: '0.5px'
                                    }}>
                                        Full Name
                                    </Box>
                                    <TextField
                                        value={editData.fullName}
                                        onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                        fullWidth
                                        placeholder="Enter candidate name"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: colors.grey[100],
                                                backgroundColor: colors.primary[500],
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.primary[300],
                                            },
                                            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.blueAccent[500],
                                            },
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Box sx={{ 
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.grey[300],
                                        textTransform: 'uppercase',
                                        mb: 1,
                                        letterSpacing: '0.5px'
                                    }}>
                                        Bio
                                    </Box>
                                    <TextField
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                        fullWidth
                                        placeholder="Enter candidate bio"
                                        multiline
                                        rows={3}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: colors.grey[100],
                                                backgroundColor: colors.primary[500],
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.primary[300],
                                            },
                                            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.blueAccent[500],
                                            },
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Box sx={{ 
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.grey[300],
                                        textTransform: 'uppercase',
                                        mb: 1,
                                        letterSpacing: '0.5px'
                                    }}>
                                        Party
                                    </Box>
                                    <TextField
                                        value={editData.party}
                                        onChange={(e) => setEditData({ ...editData, party: e.target.value })}
                                        fullWidth
                                        placeholder="Enter party name"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: colors.grey[100],
                                                backgroundColor: colors.primary[500],
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.primary[300],
                                            },
                                            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.blueAccent[500],
                                            },
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Box sx={{ 
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.grey[300],
                                        textTransform: 'uppercase',
                                        mb: 1,
                                        letterSpacing: '0.5px'
                                    }}>
                                        Age
                                    </Box>
                                    <TextField
                                        type="number"
                                        value={editData.age}
                                        onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                                        fullWidth
                                        placeholder="Enter age"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: colors.grey[100],
                                                backgroundColor: colors.primary[500],
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.primary[300],
                                            },
                                            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                                borderColor: colors.blueAccent[500],
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ 
                            backgroundColor: colors.primary[400], 
                            p: '16px',
                            gap: 1,
                            borderTop: `1px solid ${colors.primary[300]}`
                        }}>
                            <Button 
                                onClick={handleCloseEditDialog}
                                sx={{ 
                                    color: colors.grey[100],
                                    padding: '8px 20px'
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSaveChanges}
                                variant="contained"
                                sx={{ 
                                    backgroundColor: colors.greenAccent[600],
                                    color: 'white',
                                    padding: '8px 24px',
                                    fontWeight: '600',
                                    '&:hover': {
                                        backgroundColor: colors.greenAccent[700],
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </DialogActions>
                    </Dialog>
                </main>
            </div>
        </ThemeProvider>
    </ColorModeContext.Provider>

    )

};

export default NewCandidates;
