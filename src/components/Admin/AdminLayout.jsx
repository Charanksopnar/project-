import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode } from '../NewDashboard/theme';
import Topbar from '../NewDashboard/scenes/global/Topbar';
import Sidebar from '../NewDashboard/scenes/global/Sidebar';
import '../NewDashboard/New.css';

const AdminLayout = ({ children }) => {
    const [theme, colorMode] = useMode();

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="appNew">
                    <Sidebar />
                    <main className="content">
                        <Topbar />
                        <Box m="20px">
                            {children}
                        </Box>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export default AdminLayout;
