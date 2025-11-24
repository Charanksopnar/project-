import { useState, useEffect } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const ElectionTimer = ({ electionDate, status, colors }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const calculateTimeLeft = () => {
            const targetDate = new Date(electionDate).getTime();
            const currentDate = new Date().getTime();
            const difference = targetDate - currentDate;

            if (difference > 0 && status === 'upcoming') {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({
                    days,
                    hours,
                    minutes,
                    seconds,
                    totalSeconds: Math.floor(difference / 1000)
                });
            } else {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    totalSeconds: 0
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [electionDate, status]);

    if (status !== 'upcoming') {
        return null;
    }

    const timerDisplay = isMobile 
        ? `${String(timeLeft.days).padStart(2, '0')}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m`
        : `${String(timeLeft.days).padStart(2, '0')}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                padding: '8px 12px',
                backgroundColor: colors.blueAccent[600],
                borderRadius: '6px',
                border: `2px solid ${colors.blueAccent[400]}`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}
        >
            <AccessTimeIcon sx={{ fontSize: '16px', color: colors.grey[100], flexShrink: 0 }} />
            <Typography
                variant="body2"
                sx={{
                    color: colors.grey[100],
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    fontSize: isMobile ? '11px' : '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
                title={`${String(timeLeft.days).padStart(2, '0')}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`}
            >
                {timerDisplay}
            </Typography>
        </Box>
    );
};

export default ElectionTimer;
