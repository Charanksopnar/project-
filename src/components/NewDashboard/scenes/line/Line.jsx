import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from "../../../../helper";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import LineChart from "../../newComponents/LineChart";
import Header from "../../newComponents/Header";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";


const Line = () => {
    const [theme, colorMode] = useMode();
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState('');

    useEffect(() => {
        const fetchElections = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getElections`);
                if (response.data.success) {
                    setElections(response.data.elections);
                    if (response.data.elections.length > 0) {
                        setSelectedElection(response.data.elections[0]._id);
                    }
                }
            } catch (error) {
                console.error("Error fetching elections:", error);
            }
        };
        fetchElections();
    }, []);

    const handleElectionChange = (event) => {
        setSelectedElection(event.target.value);
    };

    return (<ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="appNew">
                <Sidebar />
                <main className="content">
                    <Topbar />
                    <Box m="20px">
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Header title="Line Chart" subtitle="Simple Line Chart" />
                            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                                <InputLabel id="election-select-label">Select Election</InputLabel>
                                <Select
                                    labelId="election-select-label"
                                    id="election-select"
                                    value={selectedElection}
                                    onChange={handleElectionChange}
                                    label="Select Election"
                                >
                                    {elections.map((election) => (
                                        <MenuItem key={election._id} value={election._id}>
                                            {election.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box height="75vh">
                            <LineChart electionId={selectedElection} />
                        </Box>
                    </Box>
                </main>
            </div>
        </ThemeProvider>
    </ColorModeContext.Provider>

    )
};

export default Line;
