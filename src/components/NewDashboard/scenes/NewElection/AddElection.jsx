import { Box, Button, TextField, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../newComponents/Header";
import { tokens } from "../../theme";
import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../../helper";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ColorModeContext, useMode } from "../../theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Topbar from "../global/Topbar";
import Sidebar from "../global/Sidebar";

const AddElection = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/createElection`, values);
      if (response.data.success) {
        toast.success("Election created successfully!");
        resetForm();
      } else {
        toast.error("Failed to create election");
      }
    } catch (error) {
      console.error("Error creating election:", error);
      toast.error("An error occurred while creating the election");
    } finally {
      setLoading(false);
    }
  };

  const [themeMode, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={themeMode}>
        <CssBaseline />
        <div className="appNew">
          <Sidebar />
          <main className="content">
            <Topbar />
            <Box m="20px">
              <Header title="CREATE ELECTION" subtitle="Create a New Election" />
              <ToastContainer />
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
                      gap="30px"
                      gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                      sx={{
                        "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                      }}
                    >
                      <TextField
                        fullWidth
                        variant="filled"
                        type="text"
                        label="Election Name"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.name}
                        name="name"
                        error={!!touched.name && !!errors.name}
                        helperText={touched.name && errors.name}
                        sx={{ gridColumn: "span 4" }}
                      />
                      <TextField
                        fullWidth
                        variant="filled"
                        type="text"
                        label="Description"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.description}
                        name="description"
                        error={!!touched.description && !!errors.description}
                        helperText={touched.description && errors.description}
                        sx={{ gridColumn: "span 4" }}
                        multiline
                        rows={4}
                      />
                      <TextField
                        fullWidth
                        variant="filled"
                        type="date"
                        label="Start Date"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.startDate}
                        name="startDate"
                        error={!!touched.startDate && !!errors.startDate}
                        helperText={touched.startDate && errors.startDate}
                        sx={{ gridColumn: "span 2" }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        variant="filled"
                        type="date"
                        label="End Date"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.endDate}
                        name="endDate"
                        error={!!touched.endDate && !!errors.endDate}
                        helperText={touched.endDate && errors.endDate}
                        sx={{ gridColumn: "span 2" }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="end" mt="20px">
                      <Button 
                        type="submit" 
                        color="secondary" 
                        variant="contained"
                        disabled={loading}
                      >
                        {loading ? "Creating..." : "Create New Election"}
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
  );
};

const checkoutSchema = yup.object().shape({
  name: yup.string().required("required"),
  description: yup.string().required("required"),
  startDate: yup.date().required("required"),
  endDate: yup.date().required("required")
    .min(
      yup.ref('startDate'),
      "End date can't be before start date"
    )
});

const initialValues = {
  name: "",
  description: "",
  startDate: "",
  endDate: ""
};

export default AddElection;
