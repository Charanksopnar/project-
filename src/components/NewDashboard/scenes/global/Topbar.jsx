import { Box, IconButton, useTheme } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const [redirectToHome, setRedirectToHome] = useState(false);

    const isDark = theme.palette.mode === "dark";

    // ICON COLOR → white in light mode, grey in dark mode
    const iconColor = isDark ? colors.grey[100] : "#ffffff";

    // Text color (same as icon)
    const textColor = iconColor;

    // 🔥 FIX: Search bar must be dark even in light mode
    const searchBg = isDark ? colors.primary[400] : "#1e2533";

    // Topbar background — same in both modes
    const topbarBg = colors.primary[500];

    const handleLogout = () => {
        setRedirectToHome(true);
    };

    useEffect(() => {
        if (redirectToHome) navigate("/");
    }, [redirectToHome, navigate]);

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            sx={{
                boxShadow: 1,
                borderRadius: 1,
                backgroundColor: topbarBg,
            }}
        >
            {/* Search Bar */}
            <Box
                display="flex"
                backgroundColor={searchBg}
                borderRadius="8px"
                sx={{ alignItems: "center", px: 1 }}
            >
                <InputBase
                    sx={{ ml: 1, flex: 1, color: textColor }}
                    placeholder="Search"
                />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon sx={{ color: iconColor }} />
                </IconButton>
            </Box>

            {/* Icons */}
            <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
                <IconButton onClick={colorMode.toggleColorMode}>
                    {isDark ? (
                        <DarkModeOutlinedIcon sx={{ color: iconColor }} />
                    ) : (
                        <LightModeOutlinedIcon sx={{ color: iconColor }} />
                    )}
                </IconButton>

                <IconButton>
                    <NotificationsOutlinedIcon sx={{ color: iconColor }} />
                </IconButton>

                <IconButton>
                    <SettingsOutlinedIcon sx={{ color: iconColor }} />
                </IconButton>

                <IconButton onClick={handleLogout}>
                    <LogoutOutlinedIcon sx={{ color: iconColor }} />
                </IconButton>
            </Box>
        </Box>
    );
};

export default Topbar;
