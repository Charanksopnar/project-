import { Box, Typography } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';

const ElectionTimeline = ({ election, colors }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'upcoming':
                return <HourglassTopIcon sx={{ fontSize: '24px', color: colors.blueAccent[500] }} />;
            case 'current':
                return <PlayCircleIcon sx={{ fontSize: '24px', color: colors.greenAccent[500] }} />;
            case 'stopped':
                return <StopCircleIcon sx={{ fontSize: '24px', color: colors.redAccent[500] }} />;
            case 'completed':
                return <CheckCircleIcon sx={{ fontSize: '24px', color: colors.greenAccent[700] }} />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            upcoming: 'Scheduled',
            current: 'In Progress',
            stopped: 'Halted',
            completed: 'Finished'
        };
        return labels[status] || status;
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                padding: '8px 12px',
                backgroundColor: colors.primary[500],
                borderRadius: '6px',
                border: `1px solid ${colors.primary[300]}`
            }}
        >
            {getStatusIcon(election.status)}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: colors.grey[300],
                        fontSize: '10px',
                        textTransform: 'uppercase'
                    }}
                >
                    {getStatusLabel(election.status)}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.grey[100],
                        fontWeight: '500'
                    }}
                >
                    {new Date(election.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </Typography>
            </Box>
        </Box>
    );
};

export default ElectionTimeline;
