
import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Tooltip, Chip, Button, IconButton, Checkbox, Menu } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataTeam } from "../../data/mockData";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import axios from 'axios';
import {BASE_URL} from '../../../../helper'
import { useRealtime } from '../../../../context/RealtimeContext';


const Team = () => {
    const [theme, colorMode] = useMode();
    const [voters, setVoters] = useState([]);
    const [openBlockDialog, setOpenBlockDialog] = useState(false);
    const [selectedVoter, setSelectedVoter] = useState(null);
    const [blockData, setBlockData] = useState({ blockedReason: '', violationDescription: '', blockExpiryDate: '', reviewDate: '' });
    const [selectedRows, setSelectedRows] = useState([]);
    const [openBulkBlockDialog, setOpenBulkBlockDialog] = useState(false);
    const [bulkBlockData, setBulkBlockData] = useState({ blockedReason: '', violationDescription: '', blockExpiryDate: '', reviewDate: '' });
    const [enableBulkSelection, setEnableBulkSelection] = useState(false);
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
    const colors = tokens(theme.palette.mode);

    // Handle settings menu open
    const handleSettingsMenuOpen = (event) => {
        setSettingsAnchorEl(event.currentTarget);
    };

    // Handle settings menu close
    const handleSettingsMenuClose = () => {
        setSettingsAnchorEl(null);
    };

    // Handle bulk selection toggle from settings
    const handleToggleBulkSelection = () => {
        setEnableBulkSelection(!enableBulkSelection);
        setSelectedRows([]); // Clear selection when toggling
        handleSettingsMenuClose();
    };

    // Handle opening block dialog
    const handleBlockClick = (voter) => {
        setSelectedVoter(voter);
        setBlockData({ 
            blockedReason: voter.blockedReason || '', 
            violationDescription: voter.violationDescription || '',
            blockExpiryDate: voter.blockExpiryDate ? new Date(voter.blockExpiryDate).toISOString().split('T')[0] : '',
            reviewDate: voter.reviewDate ? new Date(voter.reviewDate).toISOString().split('T')[0] : ''
        });
        setOpenBlockDialog(true);
    };

    // Handle closing block dialog
    const handleCloseBlockDialog = () => {
        setOpenBlockDialog(false);
        setSelectedVoter(null);
        setBlockData({ blockedReason: '', violationDescription: '', blockExpiryDate: '', reviewDate: '' });
    };

    // Handle saving block status
    const handleSaveBlockStatus = async () => {
        try {
            const isBlocking = !selectedVoter.isBlocked;
            
            await axios.patch(`${BASE_URL}/updateVoterBlock/${selectedVoter._id}`, {
                isBlocked: isBlocking,
                blockedReason: isBlocking ? blockData.blockedReason : null,
                violationDescription: isBlocking ? blockData.violationDescription : '',
                blockExpiryDate: isBlocking && blockData.blockExpiryDate ? new Date(blockData.blockExpiryDate) : null,
                reviewDate: isBlocking && blockData.reviewDate ? new Date(blockData.reviewDate) : null
            });
            
            // Update local state
            setVoters(voters.map(voter => 
                voter._id === selectedVoter._id 
                    ? { 
                        ...voter, 
                        isBlocked: isBlocking,
                        blockedReason: isBlocking ? blockData.blockedReason : null,
                        violationDescription: isBlocking ? blockData.violationDescription : '',
                        blockExpiryDate: isBlocking && blockData.blockExpiryDate ? new Date(blockData.blockExpiryDate) : null,
                        reviewDate: isBlocking && blockData.reviewDate ? new Date(blockData.reviewDate) : null
                    }
                    : voter
            ));
            
            handleCloseBlockDialog();
            alert(`Voter ${isBlocking ? 'blocked' : 'unblocked'} successfully!`);
        } catch (error) {
            console.error('Error updating voter block status:', error);
            alert('Error updating voter block status. Please try again.');
        }
    };

    const deleteVoter = async (id) => {
        const voter = voters.find(v => v._id === id);
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${voter?.name}"?\n\nThis action cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            await axios.delete(`${BASE_URL}/deleteVoter/${id}`);
            setVoters(voters.filter(voter => voter._id !== id));
            console.log(`✅ Voter "${voter?.name}" deleted successfully`);
        } catch (error) {
            console.error('Error deleting voter', error);
            alert('Error deleting voter. Please try again.');
        }
    };

    // Handle bulk block dialog open
    const handleOpenBulkBlockDialog = () => {
        if (selectedRows.length === 0) {
            alert('Please select at least one voter');
            return;
        }
        setBulkBlockData({ blockedReason: '', violationDescription: '' });
        setOpenBulkBlockDialog(true);
    };

    // Handle bulk block dialog close
    const handleCloseBulkBlockDialog = () => {
        setOpenBulkBlockDialog(false);
        setBulkBlockData({ blockedReason: '', violationDescription: '' });
    };

    // Handle bulk block/unblock
    const handleBulkBlockSave = async () => {
        if (!bulkBlockData.blockedReason) {
            alert('Please select a violation type');
            return;
        }

        const confirmBulk = window.confirm(
            `Are you sure you want to block ${selectedRows.length} voter(s)?\n\nThis action can be undone by unblocking them individually.`
        );
        if (!confirmBulk) return;

        try {
            const response = await axios.post(`${BASE_URL}/bulkBlockVoters`, {
                voterIds: selectedRows,
                isBlocked: true,
                blockedReason: bulkBlockData.blockedReason,
                violationDescription: bulkBlockData.violationDescription,
                blockExpiryDate: bulkBlockData.blockExpiryDate ? new Date(bulkBlockData.blockExpiryDate) : null,
                reviewDate: bulkBlockData.reviewDate ? new Date(bulkBlockData.reviewDate) : null
            });

            // Update local state
            setVoters(voters.map(voter => {
                if (selectedRows.includes(voter._id)) {
                    return {
                        ...voter,
                        isBlocked: true,
                        blockedReason: bulkBlockData.blockedReason,
                        violationDescription: bulkBlockData.violationDescription,
                        blockExpiryDate: bulkBlockData.blockExpiryDate ? new Date(bulkBlockData.blockExpiryDate) : null,
                        reviewDate: bulkBlockData.reviewDate ? new Date(bulkBlockData.reviewDate) : null
                    };
                }
                return voter;
            }));

            setSelectedRows([]);
            handleCloseBulkBlockDialog();
            alert(`✅ Successfully blocked ${response.data.results.successful.length} voter(s)`);
        } catch (error) {
            console.error('Error bulk blocking voters:', error);
            alert('Error bulk blocking voters. Please try again.');
        }
    };

    const columns = [
        {
            field: "image",
            headerName: "PHOTO",
            width: 100,
            renderCell: ({ row }) => {
                // Handle different image path formats
                let imagePath = '/assets/default-voter.jpg';
                
                if (row.profilePic) {
                    // If profilePic is stored (from Voter model)
                    imagePath = row.profilePic.startsWith('http') 
                        ? row.profilePic 
                        : `${BASE_URL}/uploads/${row.profilePic}`;
                } else if (row.image) {
                    // If image field is stored
                    imagePath = row.image.startsWith('http') 
                        ? row.image 
                        : `${BASE_URL}/uploads/${row.image}`;
                }
                
                return (
                    <Box
                        width="100%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="60px"
                    >
                        <img 
                            src={imagePath} 
                            alt="voter-photo"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #ccc'
                            }}
                            onError={(e) => {
                                e.target.src = '/assets/default-voter.jpg';
                            }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "name",
            headerName: "FIRST NAME",
            flex: 1,
            cellClassName: "name-column--cell",
            renderCell: ({ row }) => {
                // Extract first name from full name
                const firstName = row.name ? row.name.split(' ')[0] : '';
                return firstName;
            }
        },
        {
            field: "lastName",
            headerName: "LAST NAME",
            flex: 1,
            cellClassName: "name-column--cell",
            renderCell: ({ row }) => {
                // Extract last name from full name
                const parts = row.name ? row.name.split(' ') : [];
                const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
                return lastName;
            }
        },
        {
            field: "age",
            headerName: "AGE",
            type: "number",
            width: 80,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "phone",
            headerName: "Phone Number",
            flex: 1,
        },
        {
            field: "_id",
            headerName: "VOTER ID",
            type: "string",
            flex: 1,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "email",
            headerName: "EMAIL",
            flex: 1,
        },
        {
            field: "isBlocked",
            headerName: "BLOCK/UNBLOCK",
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => {
                const isBlocked = row.isBlocked || false;
                return (
                    <Tooltip title={isBlocked ? "Voter is blocked" : "Voter is active"} arrow>
                        <Chip
                            icon={isBlocked ? <BlockIcon /> : <LockOpenIcon />}
                            label={isBlocked ? "BLOCKED" : "ACTIVE"}
                            color={isBlocked ? "error" : "success"}
                            variant="outlined"
                            sx={{
                                cursor: 'pointer',
                                fontWeight: '600',
                                '&:hover': {
                                    backgroundColor: isBlocked ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'
                                }
                            }}
                            onClick={() => handleBlockClick(row)}
                        />
                    </Tooltip>
                );
            },
        },
        {
            field: "blockedReason",
            headerName: "VIOLATION TYPE",
            flex: 1.2,
            renderCell: ({ row }) => {
                if (!row.isBlocked || !row.blockedReason) {
                    return <Typography variant="body2" sx={{ color: colors.grey[300] }}>—</Typography>;
                }
                
                const violationLabels = {
                    'multiple_votes': '❌ Multiple Votes',
                    'wrong_information': '⚠️ Wrong Information',
                    'face_mismatch': '👤 Face Mismatch',
                    'id_mismatch': '🆔 ID Mismatch',
                    'suspicious_activity': '🔍 Suspicious Activity',
                    'other': '❓ Other'
                };
                
                return (
                    <Chip
                        label={violationLabels[row.blockedReason] || row.blockedReason}
                        size="small"
                        sx={{
                            backgroundColor: colors.redAccent[600],
                            color: 'white',
                            fontWeight: '600'
                        }}
                    />
                );
            },
        },
        {
            field: "violationDescription",
            headerName: "VIOLATION DESCRIPTION",
            flex: 1.5,
            renderCell: ({ row }) => {
                if (!row.violationDescription) {
                    return <Typography variant="body2" sx={{ color: colors.grey[300] }}>—</Typography>;
                }
                
                return (
                    <Tooltip title={row.violationDescription} arrow>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: colors.grey[100],
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                            }}
                        >
                            {row.violationDescription}
                        </Typography>
                    </Tooltip>
                );
            },
        },
        {
            headerName: "ACTION",
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => {
                return (
                    <Box sx={{ display: 'flex', gap: '8px' }}>
                        <Tooltip title="Block/Unblock voter" arrow>
                            <IconButton
                                size="small"
                                sx={{
                                    backgroundColor: row.isBlocked ? colors.greenAccent[600] : colors.redAccent[600],
                                    color: 'white',
                                    padding: '6px',
                                    minWidth: '32px',
                                    minHeight: '32px',
                                    '&:hover': {
                                        backgroundColor: row.isBlocked ? colors.greenAccent[700] : colors.redAccent[700],
                                    }
                                }}
                                onClick={() => handleBlockClick(row)}
                            >
                                {row.isBlocked ? <LockOpenIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete voter" arrow>
                            <IconButton
                                size="small"
                                sx={{
                                    backgroundColor: colors.redAccent[700],
                                    color: 'white',
                                    padding: '6px',
                                    minWidth: '32px',
                                    minHeight: '32px',
                                    '&:hover': {
                                        backgroundColor: colors.redAccent[800],
                                    }
                                }}
                                onClick={() => deleteVoter(row._id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];
    // Real-time context: listen for voters changes
    const realtime = useRealtime();

    useEffect(() =>{
        axios.get(`${BASE_URL}/getVoter`)
        .then((response) => setVoters(response.data.voter)) 
        .catch(err => console.error("Error fetching data: ", err));        
    },[])

    useEffect(() => {
        if (realtime && realtime.votersData && realtime.votersData.length >= 0) {
            setVoters(realtime.votersData);
        }
    }, [realtime && realtime.votersData]);
    return (<ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="appNew">
                <Sidebar />
                <main className="content">
                    <Topbar />
                    <Box m="0px 20px">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Header title="VOTERS" subtitle="Managing the Voters" />
                            
                            {/* Settings Button */}
                            <Tooltip title={enableBulkSelection ? "Settings - Bulk Selection Enabled" : "Settings"} arrow>
                                <IconButton
                                    onClick={handleSettingsMenuOpen}
                                    sx={{
                                        backgroundColor: enableBulkSelection ? colors.greenAccent[600] : colors.blueAccent[600],
                                        color: 'white',
                                        padding: '10px',
                                        '&:hover': {
                                            backgroundColor: enableBulkSelection ? colors.greenAccent[700] : colors.blueAccent[700]
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <SettingsIcon />
                                </IconButton>
                            </Tooltip>

                            {/* Settings Menu */}
                            <Menu
                                anchorEl={settingsAnchorEl}
                                open={Boolean(settingsAnchorEl)}
                                onClose={handleSettingsMenuClose}
                                PaperProps={{
                                    sx: {
                                        backgroundColor: colors.primary[400],
                                        color: 'white',
                                        boxShadow: `0 0 20px rgba(0, 0, 0, 0.5)`
                                    }
                                }}
                            >
                                <MenuItem
                                    onClick={handleToggleBulkSelection}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 20px',
                                        '&:hover': {
                                            backgroundColor: colors.blueAccent[700]
                                        }
                                    }}
                                >
                                    <Checkbox
                                        checked={enableBulkSelection}
                                        sx={{
                                            color: enableBulkSelection ? colors.greenAccent[400] : colors.grey[300],
                                            '&.Mui-checked': {
                                                color: colors.greenAccent[400]
                                            }
                                        }}
                                    />
                                    <Typography>Enable Bulk Selection</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                        
                        {/* Bulk Action Toolbar */}
                        {selectedRows.length > 0 && (
                            <Box 
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: colors.blueAccent[800],
                                    padding: '15px 20px',
                                    borderRadius: '8px',
                                    marginTop: '20px',
                                    marginBottom: '20px'
                                }}
                            >
                                <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {selectedRows.length} voter(s) selected
                                </Typography>
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: colors.redAccent[600],
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: colors.redAccent[700]
                                        }
                                    }}
                                    onClick={handleOpenBulkBlockDialog}
                                >
                                    Bulk Block
                                </Button>
                            </Box>
                        )}

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
                            <DataGrid 
                                rows={voters} 
                                columns={columns} 
                                getRowId={(row) => row._id}
                                checkboxSelection={enableBulkSelection}
                                onRowSelectionModelChange={(newSelection) => {
                                    if (enableBulkSelection) {
                                        setSelectedRows(newSelection);
                                    }
                                }}
                                rowSelectionModel={selectedRows}
                                disableRowSelectionOnClick={!enableBulkSelection}
                            />
                        </Box>
                    </Box>
                </main>
            </div>

            {/* Block/Unblock Voter Dialog */}
            <Dialog 
                open={openBlockDialog} 
                onClose={handleCloseBlockDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.primary[400],
                        borderRadius: '8px'
                    }
                }}
            >
                <DialogTitle sx={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                    {selectedVoter && `${selectedVoter.isBlocked ? 'Unblock' : 'Block'} Voter: ${selectedVoter.firstName || ''} ${selectedVoter.lastName || ''} ${!selectedVoter.firstName && !selectedVoter.lastName ? selectedVoter.name : ''}`}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {!selectedVoter?.isBlocked && (
                        <>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: colors.grey[100] }}>Violation Type</InputLabel>
                                <Select
                                    value={blockData.blockedReason}
                                    onChange={(e) => setBlockData({ ...blockData, blockedReason: e.target.value })}
                                    label="Violation Type"
                                    sx={{
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: colors.grey[400]
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: colors.greenAccent[400]
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: colors.greenAccent[400]
                                        }
                                    }}
                                >
                                    <MenuItem value="multiple_votes">❌ Multiple Votes Attempted</MenuItem>
                                    <MenuItem value="wrong_information">⚠️ Wrong Information Provided</MenuItem>
                                    <MenuItem value="face_mismatch">👤 Face Doesn't Match ID</MenuItem>
                                    <MenuItem value="id_mismatch">🆔 ID Information Mismatch</MenuItem>
                                    <MenuItem value="suspicious_activity">🔍 Suspicious Activity Detected</MenuItem>
                                    <MenuItem value="other">❓ Other</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Violation Description"
                                value={blockData.violationDescription}
                                onChange={(e) => setBlockData({ ...blockData, violationDescription: e.target.value })}
                                placeholder="Enter detailed description of the violation..."
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: colors.grey[400]
                                        },
                                        '&:hover fieldset': {
                                            borderColor: colors.greenAccent[400]
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.greenAccent[400]
                                        }
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: colors.grey[300],
                                        opacity: 1
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                type="date"
                                label="Block Expiry Date (Optional)"
                                value={blockData.blockExpiryDate}
                                onChange={(e) => setBlockData({ ...blockData, blockExpiryDate: e.target.value })}
                                InputLabelProps={{ shrink: true, sx: { color: colors.grey[100] } }}
                                sx={{
                                    mt: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: colors.grey[400]
                                        },
                                        '&:hover fieldset': {
                                            borderColor: colors.greenAccent[400]
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.greenAccent[400]
                                        }
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                type="date"
                                label="Review Date (Optional)"
                                value={blockData.reviewDate}
                                onChange={(e) => setBlockData({ ...blockData, reviewDate: e.target.value })}
                                InputLabelProps={{ shrink: true, sx: { color: colors.grey[100] } }}
                                sx={{
                                    mt: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: colors.grey[400]
                                        },
                                        '&:hover fieldset': {
                                            borderColor: colors.greenAccent[400]
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: colors.greenAccent[400]
                                        }
                                    }
                                }}
                            />
                        </>
                    )}
                    {selectedVoter?.isBlocked && (
                        <Typography sx={{ color: colors.greenAccent[400], mb: 2 }}>
                            This voter will be unblocked. Remove all violation records.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Button 
                        onClick={handleCloseBlockDialog}
                        sx={{ color: colors.grey[100] }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveBlockStatus}
                        variant="contained"
                        sx={{
                            backgroundColor: selectedVoter?.isBlocked ? colors.greenAccent[600] : colors.redAccent[600],
                            color: 'white',
                            '&:hover': {
                                backgroundColor: selectedVoter?.isBlocked ? colors.greenAccent[700] : colors.redAccent[700]
                            }
                        }}
                    >
                        {selectedVoter?.isBlocked ? 'Unblock Voter' : 'Block Voter'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Block Voters Dialog */}
            <Dialog 
                open={openBulkBlockDialog} 
                onClose={handleCloseBulkBlockDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: colors.primary[400],
                        borderRadius: '8px'
                    }
                }}
            >
                <DialogTitle sx={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                    Block {selectedRows.length} Voter(s)
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ color: colors.grey[100], mb: 2 }}>
                        You are about to block {selectedRows.length} voter(s). Please provide a violation reason and description.
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: colors.grey[100] }}>Violation Type</InputLabel>
                        <Select
                            value={bulkBlockData.blockedReason}
                            onChange={(e) => setBulkBlockData({ ...bulkBlockData, blockedReason: e.target.value })}
                            label="Violation Type"
                            sx={{
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: colors.grey[400]
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: colors.greenAccent[400]
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: colors.greenAccent[400]
                                }
                            }}
                        >
                            <MenuItem value="multiple_votes">❌ Multiple Votes Attempted</MenuItem>
                            <MenuItem value="wrong_information">⚠️ Wrong Information Provided</MenuItem>
                            <MenuItem value="face_mismatch">👤 Face Doesn't Match ID</MenuItem>
                            <MenuItem value="id_mismatch">🆔 ID Information Mismatch</MenuItem>
                            <MenuItem value="suspicious_activity">🔍 Suspicious Activity Detected</MenuItem>
                            <MenuItem value="other">❓ Other</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Violation Description"
                        value={bulkBlockData.violationDescription}
                        onChange={(e) => setBulkBlockData({ ...bulkBlockData, violationDescription: e.target.value })}
                        placeholder="Enter detailed description of the violation..."
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': {
                                    borderColor: colors.grey[400]
                                },
                                '&:hover fieldset': {
                                    borderColor: colors.greenAccent[400]
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: colors.greenAccent[400]
                                }
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: colors.grey[300],
                                opacity: 1
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        type="date"
                        label="Block Expiry Date (Optional)"
                        value={bulkBlockData.blockExpiryDate}
                        onChange={(e) => setBulkBlockData({ ...bulkBlockData, blockExpiryDate: e.target.value })}
                        InputLabelProps={{ shrink: true, sx: { color: colors.grey[100] } }}
                        sx={{
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': {
                                    borderColor: colors.grey[400]
                                },
                                '&:hover fieldset': {
                                    borderColor: colors.greenAccent[400]
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: colors.greenAccent[400]
                                }
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        type="date"
                        label="Review Date (Optional)"
                        value={bulkBlockData.reviewDate}
                        onChange={(e) => setBulkBlockData({ ...bulkBlockData, reviewDate: e.target.value })}
                        InputLabelProps={{ shrink: true, sx: { color: colors.grey[100] } }}
                        sx={{
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': {
                                    borderColor: colors.grey[400]
                                },
                                '&:hover fieldset': {
                                    borderColor: colors.greenAccent[400]
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: colors.greenAccent[400]
                                }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ padding: '16px' }}>
                    <Button 
                        onClick={handleCloseBulkBlockDialog}
                        sx={{ color: colors.grey[100] }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBulkBlockSave}
                        variant="contained"
                        sx={{
                            backgroundColor: colors.redAccent[600],
                            color: 'white',
                            '&:hover': {
                                backgroundColor: colors.redAccent[700]
                            }
                        }}
                    >
                        Block {selectedRows.length} Voter(s)
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    </ColorModeContext.Provider>

    )

};

export default Team;
