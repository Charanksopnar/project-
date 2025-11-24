import { Box, Button, TextField } from "@mui/material";
import { Input, FormControl, FormHelperText, InputLabel } from '@mui/material';
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../newComponents/Header";
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";
import { ColorModeContext, useMode } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ToastContainer, toast } from 'react-toastify';
import { useState } from "react";
import axios from "axios"
import { BASE_URL } from "../../../../helper";
import { useNavigate } from 'react-router-dom';


const AddCandidate = () => {
    const [theme, colorMode] = useMode();
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const CreationSuccess = () => toast.success("Candidate Created Successfully \n Click Anywhere to exit this screen", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const CreationFailed = () => toast.error("Invalid Details \n Please Try Again!", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });


    const [candidateImage, setCandidateImage] = useState(null);
    const [partySymbol, setPartySymbol] = useState(null);

    const handleImageChange = (event) => {
        setCandidateImage(event.target.files[0]);
    };

    const handleSymbolChange = (event) => {
        setPartySymbol(event.target.files[0]);
    };

    const handleFormSubmit = async (values, { resetForm }) => {
        setLoading(true);
        try {
            // Extract firstName and lastName from fullName
            const nameParts = values.fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            // Create FormData object for file uploads
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('age', values.age);
            formData.append('party', values.party);
            formData.append('bio', values.bio);

            // Append files if they exist
            if (candidateImage) {
                formData.append('image', candidateImage);
                setPartySymbol(null);
                setTimeout(() => {
                    navigate('/Candidate');
                }, 2000);
            } else {
                CreationFailed();
            }
        } catch (error) {
            CreationFailed();
            console.error("Error creating candidate:", error);
        } finally {
            setLoading(false);
        }
    };




    // const handleFormSubmit = (values) => {
    //     console.log(values);
    // };

    return (<ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="appNew">
                <Sidebar />
                <main className="content">
                    <Topbar />
                    <ToastContainer />
                    <Box m="0px 20px">
                        <Header title="CREATE NEW CANDIDATE" subtitle="Create a New Candidate Profile" />
                        <br></br>

                        <Formik
                            onSubmit={handleFormSubmit}
                            initialValues={initialValues}
                            validationSchema={checkoutSchema}
                        >
                            {({
                                values,
                                errors,
                                touched,
                                handleBlur,
                                handleChange,
                                handleSubmit,
                            }) => (
                                <form onSubmit={handleSubmit}>
                                    <Box
                                        display="grid"
                                        gap="20px"
                                        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                        sx={{
                                            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            variant="filled"
                                            type="text"
                                            label="Candidate Name"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={values.fullName}
                                            name="fullName"
                                            error={!!touched.fullName && !!errors.fullName}
                                            helperText={touched.fullName && errors.fullName}
                                            sx={{ gridColumn: "span 4" }}
                                        />
                                        <TextField
                                            fullWidth
                                            variant="filled"
                                            type="number"
                                            label="Candidate Age"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={values.age}
                                            name="age"
                                            error={!!touched.age && !!errors.age}
                                            helperText={touched.age && errors.age}
                                            sx={{ gridColumn: "span 2" }}
                                        />
                                        <TextField
                                            fullWidth
                                            variant="filled"
                                            type="text"
                                            label="Candidate Party"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={values.party}
                                            name="party"
                                            error={!!touched.party && !!errors.party}
                                            helperText={touched.party && errors.party}
                                            sx={{ gridColumn: "span 2" }}
                                        />
                                        <TextField
                                            fullWidth
                                            variant="filled"
                                            type="text"
                                            label="Candidate Bio"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            value={values.bio}
                                            name="bio"
                                            error={!!touched.bio && !!errors.bio}
                                            helperText={touched.bio && errors.bio}
                                            sx={{ gridColumn: "span 4" }}
                                            multiline
                                            rows={4}
                                        />

                                        {/* File upload for candidate image */}
                                        <Box sx={{ gridColumn: "span 2" }}>
                                            <InputLabel htmlFor="candidate-image">Candidate Image</InputLabel>
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                type="file"
                                                id="candidate-image"
                                                name="image"
                                                onChange={handleImageChange}
                                                inputProps={{ accept: "image/*" }}
                                            />
                                            {candidateImage && (
                                                <Box mt={2}>
                                                    <img
                                                        src={URL.createObjectURL(candidateImage)}
                                                        alt="Candidate Preview"
                                                        style={{ maxWidth: '100%', maxHeight: '100px' }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>

                                        {/* File upload for party symbol */}
                                        <Box sx={{ gridColumn: "span 2" }}>
                                            <InputLabel htmlFor="party-symbol">Party Symbol</InputLabel>
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                type="file"
                                                id="party-symbol"
                                                name="symbol"
                                                onChange={handleSymbolChange}
                                                inputProps={{ accept: "image/*" }}
                                            />
                                            {partySymbol && (
                                                <Box mt={2}>
                                                    <img
                                                        src={URL.createObjectURL(partySymbol)}
                                                        alt="Symbol Preview"
                                                        style={{ maxWidth: '100%', maxHeight: '100px' }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box display="flex" justifyContent="end" mt="20px">
                                        <Button
                                            type="submit"
                                            color="secondary"
                                            variant="contained"
                                            disabled={loading}
                                        >
                                            {loading ? "Creating..." : "Create Candidate"}
                                        </Button>
                                    </Box>
                                </form>
                            )}
                        </Formik>
                    </Box>

                </main>
            </div>
        </ThemeProvider>
    </ColorModeContext.Provider>

    )
};
/*

*/
const checkoutSchema = yup.object().shape({
    fullName: yup.string().required("Full name is required"),
    age: yup.number()
        .required("Age is required")
        .positive("Age must be positive")
        .integer("Age must be an integer")
        .min(18, "Candidate must be at least 18 years old")
        .max(120, "Age is too high"),
    party: yup.string().required("Party is required"),
    bio: yup.string()
        .required("Bio is required")
        .min(10, "Bio should be at least 10 characters")
});

const initialValues = {
    fullName: "",
    age: "",
    party: "",
    bio: ""
};

export default AddCandidate;