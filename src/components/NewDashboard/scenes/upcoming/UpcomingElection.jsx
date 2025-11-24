import { useState, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, Checkbox, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import TimerIcon from '@mui/icons-material/Timer';
import ElectionTimer from './ElectionTimer';
import ElectionTimeline from './ElectionTimeline';
import { useRealtime } from '../../../../context/RealtimeContext';

const UpcomingElection = () => {
    const [theme, colorMode] = useMode();
    const colors = tokens(theme.palette.mode);
    const { electionsData, candidatesData, electionUpdate, emitElectionStatusChange, emitElectionDelete, emitElectionUpdate, requestElectionsSync } = useRealtime();

    const [elections, setElections] = useState([]);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openTimerDialog, setOpenTimerDialog] = useState(false);
    const [selectedElection, setSelectedElection] = useState(null);
    const [editData, setEditData] = useState({ date: '', status: '' });
    const [timerData, setTimerData] = useState({ autoStart: false, showTimer: false });

    // Sync with real-time data on mount
    useEffect(() => {
        requestElectionsSync();
    }, [requestElectionsSync]);

    // Update elections when real-time data changes
    useEffect(() => {
        if (electionsData && electionsData.length > 0) {
            const mappedElections = electionsData.map(el => ({
                id: el._id?.toString() || el.id,
                name: el.name || el.title, // Handle both name and title
                date: el.date || el.startDate,
                status: el.status || 'upcoming',
                autoStart: el.autoStart ?? true,
                showTimer: el.showTimer ?? true,
                description: el.description,
                startDate: el.startDate,
                endDate: el.endDate,
                candidateDetails: el.candidateDetails || [] // Add candidate details
            }));
            setElections(mappedElections);
        }
    }, [electionsData]);

    // Handle opening edit dialog
    const handleEditClick = (row) => {
        setSelectedElection(row);
        setEditData({ date: row.date, status: row.status });
        setOpenEditDialog(true);
    };

    // Handle opening timer settings dialog
    const handleTimerClick = (row) => {
        setSelectedElection(row);
        setTimerData({ autoStart: row.autoStart, showTimer: row.showTimer });
        setOpenTimerDialog(true);
    };

    // Handle closing edit dialog
    const handleCloseDialog = () => {
        setOpenEditDialog(false);
        setSelectedElection(null);
        setEditData({ date: '', status: '' });
    };

    // Handle closing timer dialog
    const handleCloseTimerDialog = () => {
        setOpenTimerDialog(false);
        setSelectedElection(null);
        setTimerData({ autoStart: false, showTimer: false });
    };

    // Handle saving changes
    const handleSaveChanges = () => {
        if (selectedElection) {
            const updatedElection = {
                _id: selectedElection.id,
                name: selectedElection.name,
                date: editData.date,
                status: editData.status,
                startDate: editData.date,
                description: selectedElection.description,
                endDate: selectedElection.endDate
            };

            if (editData.date !== selectedElection.date) {
                emitElectionUpdate(updatedElection);
                console.log(`✅ Election "${selectedElection.name}" date updated and broadcasted`);
            }

            if (editData.status !== selectedElection.status) {
                emitElectionStatusChange(selectedElection.id, editData.status);
                console.log(`✅ Election "${selectedElection.name}" status changed to "${editData.status}" and broadcasted`);
            }
        }
        handleCloseDialog();
    };

    // Handle saving timer settings
    const handleSaveTimerSettings = () => {
        setElections(elections.map(election =>
            election.id === selectedElection.id
                ? { ...election, autoStart: timerData.autoStart, showTimer: timerData.showTimer }
                : election
        ));
        handleCloseTimerDialog();
    };

    // Handle delete election
    const handleDeleteElection = (id) => {
        const election = elections.find(e => e.id === id);
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${election.name}"?\n\nThis action cannot be undone.`
        );
        if (confirmDelete) {
            emitElectionDelete(id);
            console.log(`✅ Election "${election.name}" deleted and broadcasted`);
        }
    };

    // Handle stop election
    const handleStopElection = (id) => {
        emitElectionStatusChange(id, 'stopped');
        console.log(`✅ Election status changed to "stopped" and broadcasted`);
    };

    const columns = [
        {
            field: "name",
            headerName: "ELECTION NAME",
            flex: 1.2,
            minWidth: 150,
            cellClassName: "name-column--cell",
        },
        {
            field: "date",
            headerName: "DATE & TIME",
            flex: 1.5,
            minWidth: 180,
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {row.showTimer ? (
                        <ElectionTimer electionDate={row.date} status={row.status} colors={colors} />
                    ) : (
                        <Box sx={{ color: colors.grey[100], fontSize: '13px' }}>
                            {new Date(row.date).toLocaleString()}
                        </Box>
                    )}
                </Box>
            ),
        },

        {
            field: "timeline",
            headerName: "TIMELINE",
            flex: 1.3,
            minWidth: 160,
            sortable: false,
            renderCell: ({ row }) => <ElectionTimeline election={row} colors={colors} />,
        },
        {
            field: "status",
            headerName: "STATUS",
            flex: 0.9,
            minWidth: 100,
            cellClassName: "name-column--cell",
            renderCell: ({ row }) => (
                <Box
                    sx={{
                        backgroundColor:
                            row.status === 'upcoming' ? colors.blueAccent[600] :
                                row.status === 'current' ? colors.greenAccent[600] :
                                    row.status === 'stopped' ? colors.redAccent[600] :
                                        colors.greenAccent[700],
                        color: 'white',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        textTransform: 'capitalize',
                        fontSize: '12px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }
                    }}
                >
                    {row.status}
                </Box>
            ),
        },
        {
            headerName: "ACTION",
            field: "actions",
            flex: 1.8,
            minWidth: 220,
            sortable: false,
            filterable: false,
            renderCell: ({ row }) => {
                const isCompleted = row.status === 'stopped' || row.status === 'completed';
                return (
                    <Box sx={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        width: '100%',
                        flexWrap: 'wrap',
                        paddingRight: '10px'
                    }}>
                        <IconButton
                            size="small"
                            title="Edit Election"
                            sx={{
                                backgroundColor: colors.greenAccent[600],
                                color: 'white',
                                padding: '6px',
                                minWidth: '32px',
                                minHeight: '32px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: colors.greenAccent[700],
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }
                            }}
                            onClick={() => handleEditClick(row)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            title="Timer Settings"
                            sx={{
                                backgroundColor: colors.blueAccent[600],
                                color: 'white',
                                padding: '6px',
                                minWidth: '32px',
                                minHeight: '32px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: colors.blueAccent[700],
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }
                            }}
                            onClick={() => handleTimerClick(row)}
                        >
                            <TimerIcon fontSize="small" />
                        </IconButton>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor: colors.redAccent[600],
                                color: 'white',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                minHeight: '32px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: colors.redAccent[700],
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                },
                                '&:disabled': {
                                    backgroundColor: colors.grey[600],
                                }
                            }}
                            onClick={() => handleStopElection(row.id)}
                            disabled={isCompleted}
                        >
                            Stop
                        </Button>
                        <Tooltip title="Delete election permanently" arrow>
                            <IconButton
                                size="small"
                                sx={{
                                    backgroundColor: colors.redAccent[700],
                                    color: 'white',
                                    padding: '6px',
                                    minWidth: '32px',
                                    minHeight: '32px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: colors.redAccent[800],
                                        transform: 'scale(1.1)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }
                                }}
                                onClick={() => handleDeleteElection(row.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="appNew">
                    <Sidebar />
                    <main className="content">
                        <Topbar />
                        <Box m="0px 20px">
                            <Header title="UPCOMING ELECTIONS / CURRENT ELECTIONS" subtitle="Managing the Elections" />
                            <Box
                                m="20px 0 0 0"
                                height="70vh"
                                sx={{
                                    "& .MuiDataGrid-root": {
                                        border: "none",
                                        overflow: 'hidden',
                                    },
                                    "& .MuiDataGrid-cell": {
                                        borderBottom: "none",
                                        paddingY: '12px',
                                        paddingX: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word'
                                    },
                                    "& .MuiDataGrid-row": {
                                        maxHeight: 'none',
                                        minHeight: '70px !important'
                                    },
                                    "& .name-column--cell": {
                                        color: colors.greenAccent[300],
                                    },
                                    "& .MuiDataGrid-columnHeaders": {
                                        backgroundColor: colors.blueAccent[700],
                                        borderBottom: "none",
                                        fontWeight: '600',
                                        fontSize: '12px',
                                        textTransform: 'uppercase'
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
                                    "& .MuiDataGrid-columnHeaderTitle": {
                                        fontWeight: '700',
                                        overflow: 'visible',
                                        whiteSpace: 'normal'
                                    }
                                }}
                            >
                                <DataGrid
                                    rows={elections}
                                    columns={columns}
                                    getRowId={(row) => row.id}
                                    density="comfortable"
                                    pageSizeOptions={[5, 10, 25]}
                                    initialState={{
                                        pagination: {
                                            paginationModel: { pageSize: 5 },
                                        },
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Edit Dialog */}
                        <Dialog
                            open={openEditDialog}
                            onClose={handleCloseDialog}
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
                                ✏️ Edit Election: {selectedElection?.name}
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
                                            Election Date & Time
                                        </Box>
                                        <TextField
                                            type="datetime-local"
                                            value={editData.date}
                                            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                            fullWidth
                                            slotProps={{
                                                input: {
                                                    step: '1'
                                                }
                                            }}
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
                                            Election Status
                                        </Box>
                                        <FormControl fullWidth>
                                            <Select
                                                value={editData.status}
                                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                                sx={{
                                                    color: colors.grey[100],
                                                    backgroundColor: colors.primary[500],
                                                    "& .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: colors.primary[300],
                                                    },
                                                    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                                        borderColor: colors.blueAccent[500],
                                                    },
                                                    "& .MuiSvgIcon-root": {
                                                        color: colors.grey[100],
                                                    }
                                                }}
                                            >
                                                <MenuItem value="upcoming">📅 Upcoming</MenuItem>
                                                <MenuItem value="current">▶️ Current</MenuItem>
                                                <MenuItem value="stopped">⏹️ Stopped</MenuItem>
                                                <MenuItem value="completed">✓ Completed</MenuItem>
                                            </Select>
                                        </FormControl>
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
                                    onClick={handleCloseDialog}
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

                        {/* Timer Settings Dialog */}
                        <Dialog
                            open={openTimerDialog}
                            onClose={handleCloseTimerDialog}
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
                                ⏱️ Timer Settings: {selectedElection?.name}
                            </DialogTitle>
                            <DialogContent sx={{
                                backgroundColor: colors.primary[400],
                                pt: 3,
                                pb: 2
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Box
                                        onClick={() => setTimerData({ ...timerData, autoStart: !timerData.autoStart })}
                                        sx={{
                                            padding: '16px',
                                            backgroundColor: colors.primary[500],
                                            borderRadius: '8px',
                                            border: `2px solid ${timerData.autoStart ? colors.greenAccent[400] : colors.greenAccent[500]}`,
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'flex-start',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: timerData.autoStart ? colors.primary[400] : colors.primary[500],
                                            '&:hover': {
                                                backgroundColor: colors.primary[300],
                                                borderColor: colors.greenAccent[300],
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={timerData.autoStart}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setTimerData({ ...timerData, autoStart: e.target.checked });
                                            }}
                                            sx={{
                                                color: colors.greenAccent[500],
                                                '&.Mui-checked': {
                                                    color: colors.greenAccent[300],
                                                },
                                                mt: 0.5,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <Box sx={{ flex: 1, cursor: 'pointer' }}>
                                            <Box sx={{
                                                fontWeight: '700',
                                                color: colors.grey[100],
                                                fontSize: '14px',
                                                mb: 0.5
                                            }}>
                                                ✓ Auto-Start Election
                                            </Box>
                                            <Box sx={{
                                                fontSize: '13px',
                                                color: colors.grey[300],
                                                lineHeight: '1.4'
                                            }}>
                                                Automatically start the election when the scheduled date and time arrive
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box
                                        onClick={() => setTimerData({ ...timerData, showTimer: !timerData.showTimer })}
                                        sx={{
                                            padding: '16px',
                                            backgroundColor: colors.primary[500],
                                            borderRadius: '8px',
                                            border: `2px solid ${timerData.showTimer ? colors.blueAccent[400] : colors.blueAccent[500]}`,
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'flex-start',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: timerData.showTimer ? colors.primary[400] : colors.primary[500],
                                            '&:hover': {
                                                backgroundColor: colors.primary[300],
                                                borderColor: colors.blueAccent[300],
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={timerData.showTimer}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setTimerData({ ...timerData, showTimer: e.target.checked });
                                            }}
                                            sx={{
                                                color: colors.blueAccent[500],
                                                '&.Mui-checked': {
                                                    color: colors.blueAccent[300],
                                                },
                                                mt: 0.5,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <Box sx={{ flex: 1, cursor: 'pointer' }}>
                                            <Box sx={{
                                                fontWeight: '700',
                                                color: colors.grey[100],
                                                fontSize: '14px',
                                                mb: 0.5
                                            }}>
                                                ⏱️ Show Countdown Timer
                                            </Box>
                                            <Box sx={{
                                                fontSize: '13px',
                                                color: colors.grey[300],
                                                lineHeight: '1.4'
                                            }}>
                                                Display a live countdown timer showing days, hours, minutes, and seconds until the election starts
                                            </Box>
                                        </Box>
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
                                    onClick={handleCloseTimerDialog}
                                    sx={{
                                        color: colors.grey[100],
                                        padding: '8px 20px'
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveTimerSettings}
                                    variant="contained"
                                    sx={{
                                        backgroundColor: colors.blueAccent[600],
                                        color: 'white',
                                        padding: '8px 24px',
                                        fontWeight: '600',
                                        '&:hover': {
                                            backgroundColor: colors.blueAccent[700],
                                        }
                                    }}
                                >
                                    Save Settings
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default UpcomingElection;
