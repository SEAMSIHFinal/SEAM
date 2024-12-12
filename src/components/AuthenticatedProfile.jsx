import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import SecurityIcon from "@mui/icons-material/Security"; // Icon import

const AuthenticatedProfile = ({ name, image, number }) => {
  const [editableName, setEditableName] = useState(name);
  const [editableImage, setEditableImage] = useState(image);
  const [editableNumber, setEditableNumber] = useState(number);
  const [document, setDocument] = useState(null);
  const [updateSubmitted, setUpdateSubmitted] = useState(false); // Track if update has been submitted

  // Handle file upload
  const handleFileChange = (event) => {
    setDocument(event.target.files[0]);
  };

  // Handle form submission for Aadhaar update
  const handleSubmit = () => {
    // Here, you would typically send the updated data to the backend for processing.
    console.log("Updated Name:", editableName);
    console.log("Updated Image:", editableImage);
    console.log("Uploaded Document:", document);
    setUpdateSubmitted(true); // Mark update as submitted
  };

  if (!name) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        p: 4,
        width: "600px",
        height: "auto", // Adjusted to auto height based on content
        mx: "auto",
        mt: 5,
        textAlign: "center",
        borderRadius: "16px",
        background:
          "linear-gradient(180deg, white 18%, rgba(255, 190, 50, 0.8) 65%, rgba(10, 190, 40, 0.7) 100%)",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.5)",
        position: "relative",
      }}
    >
      {/* Top Left Logo */}
      <Box
        component="img"
        src="/src/assets/logo-left.png"
        alt="Left Logo"
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          width: 95,
          height: 45,
        }}
      />

      {/* Top Right Logo */}
      <Box
        component="img"
        src="/src/assets/logo-right.png"
        alt="Right Logo"
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 95,
          height: 55,
        }}
      />

      {/* Success Message */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: "bold",
          color: "#4caf50",
        }}
      >
        Authentication Successful!
      </Typography>

      {/* Byline */}
      <Typography
        variant="body2"
        gutterBottom
        sx={{
          fontWeight: "400",
          color: "#555",
          fontStyle: "bold",
          mt: 1,
        }}
      >
        Secure authentication via SEAM
      </Typography>

      {/* Welcome Text */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: "500", color: "#000", mt: 2 }}
      >
        Welcome,{" "}
        <span style={{ color: "#2234a8", fontWeight: "bold" }}>{name}</span>!
      </Typography>

      {/* Current User Details */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 4,
          gap: 3,
        }}
      >
        {/* Registered Image */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              mb: 1,
              color: "#000",
            }}
          >
            Your Aadhaar Number: {editableNumber}
          </Typography>
        </Box>
        <Box>
          <Avatar
            src={editableImage}
            alt="Registered face"
            sx={{
              width: 200, // Fixed width for the avatar
              height: 200, // Fixed height for the avatar
              border: "2px solid #4caf50",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            }}
          />
        </Box>

        {/* Editable Fields for Aadhaar Update */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Update Your Details
          </Typography>

          {/* Editable Name */}
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={editableName}
            onChange={(e) => setEditableName(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Editable Aadhaar Number */}
          <TextField
            label="Aadhaar Number"
            variant="outlined"
            fullWidth
            value={editableNumber}
            onChange={(e) => setEditableNumber(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Image Update */}
          <Button variant="contained" component="label" sx={{ mb: 2 }}>
            Upload New Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) =>
                setEditableImage(URL.createObjectURL(e.target.files[0]))
              }
            />
          </Button>

          {/* Document Upload */}
          <input
            type="file"
            onChange={handleFileChange}
            style={{ marginBottom: "16px" }}
          />
          <Typography variant="body2" color="textSecondary">
            Upload required documents (e.g., proof of name, address, etc.)
          </Typography>

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 3 }}
          >
            Submit Update Request
          </Button>
        </Box>

        {/* Display "Get Started" Button After Update Submission */}
        {updateSubmitted && (
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/authenticate"
            startIcon={<SecurityIcon />}
            sx={{
              mt: 4,
              px: 4,
              py: 2,
              backgroundColor: "#2962FF",
              color: "white",
              fontWeight: "bold",
              borderRadius: "25px",
              ":hover": {
                backgroundColor: "#FFA500",
              },
            }}
          >
            Get Started
          </Button>
        )}

        {/* Personalized Message */}
        <Typography
          variant="body6"
          sx={{
            fontSize: "1.5rem",
            color: "#2234a8",
            lineHeight: "1.5",
            fontWeight: "bold",
            textShadow: "1px 1px 4px rgba(5, 5, 9, 0.1)",
          }}
        >
          मेरा <span style={{ color: "red", fontWeight: "bold" }}>आधार</span>,
          मेरी पहचान
        </Typography>
      </Box>
    </Paper>
  );
};

export default AuthenticatedProfile;
