import React, { useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { Container, Box, CircularProgress, Typography } from "@mui/material";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"; // Import Router
import FaceAuthentication from "./components/FaceAuthentication";
import AuthenticatedProfile from "./components/AuthenticatedProfile";
import Header from "./components/Header";
import TeamPage from "./components/TeamPage";
import HomePage from "./components/HomePage"; // Import HomePage component

function App() {
  const [mode, setMode] = useState(1); // Authentication mode
  const [registeredFaces, setRegisteredFaces] = useState([]);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const loadDataset = async () => {
      if (modelsLoaded) {
        try {
          const response = await fetch("/dataset/names.json");
          const data = await response.json();
          const faceDescriptors = [];

          for (let item of data) {
            const img = await faceapi.fetchImage(item.image);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detections) {
              faceDescriptors.push({
                descriptor: detections.descriptor,
                name: item.name,
                image: item.image,
                number: item.number, // Aadhaar number
              });
            }
          }
          setRegisteredFaces(faceDescriptors);
        } catch (error) {
          console.error("Error loading dataset:", error);
        }
      }
    };

    loadDataset();
  }, [modelsLoaded]);

  const handleAuthenticated = (match) => {
    setAuthenticatedUser(match);
    navigate("/profile"); // Redirect to profile page
  };

  if (!modelsLoaded) {
    return (
      <Container maxWidth={false} disableGutters>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h5" sx={{ mt: 3, color: "#000000" }}>
            Loading face recognition models...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ overflowY: "auto" }}>
      <Box sx={{ my: 4, overflowY: "auto" }}>
        <Header />
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}></Box>
        <Routes>
          <Route path="/" element={<HomePage />} />{" "}
          {/* Add HomePage as default */}
          <Route
            path="/authenticate"
            element={
              mode === 1 && (
                <FaceAuthentication
                  registeredFaces={registeredFaces}
                  onAuthenticated={handleAuthenticated}
                />
              )
            }
          />
          <Route
            path="/profile"
            element={
              authenticatedUser ? (
                <AuthenticatedProfile
                  name={authenticatedUser}
                  image={
                    registeredFaces.find(
                      (face) => face.name === authenticatedUser
                    )?.image
                  }
                  number={
                    registeredFaces.find(
                      (face) => face.name === authenticatedUser
                    )?.number
                  }
                />
              ) : (
                <Typography
                  variant="h5"
                  sx={{ textAlign: "center", mt: 5, color: "#000" }}
                >
                  Unauthorized Access
                </Typography>
              )
            }
          />
          <Route path="/TeamPage" element={<TeamPage />} />{" "}
          {/* Add ContactPage route */}
        </Routes>
      </Box>
    </Container>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
