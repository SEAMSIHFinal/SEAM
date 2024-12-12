import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { Box, Button, Typography } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import LightModeIcon from "@mui/icons-material/LightMode";
import WarningIcon from "@mui/icons-material/Warning";
import ReactWebcam from "react-webcam";
import { CircularProgress } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const FaceAuthentication = ({ registeredFaces, onAuthenticated }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [match, setMatch] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facesStatus, setFacesStatus] = useState("no-face");
  const [isFaceMatcherLoaded, setIsFaceMatcherLoaded] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [isValidAadhaar, setIsValidAadhaar] = useState(false);
  const [linkedFace, setLinkedFace] = useState(null);

  const webcamRef = useRef(null);
  const [faceMatcher, setFaceMatcher] = useState(null);

  // Handle Aadhaar input
  const handleAadhaarChange = (e) => {
    const value = e.target.value.replace(/\s+/g, ""); // Remove spaces
    if (/^\d{0,12}$/.test(value)) {
      const formattedValue = value
        .replace(/(\d{4})(?=\d)/g, "$1 ") // Add spaces every 4 digits
        .trim();
      setAadhaarNumber(formattedValue);

      if (value.length === 12) {
        const faceData = registeredFaces.find((face) => face.number === value);
        if (faceData) {
          setLinkedFace(faceData);
          setIsValidAadhaar(true);
        } else {
          setIsValidAadhaar(false);
          alert("Aadhaar number not found in the database.");
        }
      } else {
        setIsValidAadhaar(false);
      }
    }
  };

  // Initialize face matcher when registered faces change
  useEffect(() => {
    if (registeredFaces.length > 0) {
      const labeledDescriptors = registeredFaces.map(
        (face) =>
          new faceapi.LabeledFaceDescriptors(face.name, [face.descriptor])
      );
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
      setFaceMatcher(matcher);
      setIsFaceMatcherLoaded(true); // Mark face matcher as loaded
    } else {
      setIsFaceMatcherLoaded(false); // Reset if there are no registered faces
    }
  }, [registeredFaces]);

  // Function to handle face detection continuously
  const handleFaceDetection = async () => {
    const videoElement = webcamRef.current?.video;
    if (!videoElement) return;

    const detections = await faceapi
      .detectAllFaces(videoElement)
      .withFaceLandmarks();

    if (detections.length === 0) {
      setFacesStatus("no-face");
    } else if (detections.length === 1) {
      setFacesStatus("one-face");
    } else {
      setFacesStatus("multiple-faces"); // Updated for 2 or more faces
    }
  };

  // Run face detection every 500ms
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleFaceDetection();
    }, 500); // Checking for face detection every 500ms

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  // Texture analysis function
  const analyzeTexture = (img) => {
    // Convert image to grayscale
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const grayscale = new Uint8Array(imageData.width * imageData.height);

    // Convert to grayscale
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = Math.round(
        (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
      );
      grayscale[i / 4] = avg;
    }

    const lbpHist = new Array(256).fill(0);

    // Calculate LBP
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const centerIdx = y * imageData.width + x;
        const centerValue = grayscale[centerIdx];

        let binaryPattern = 0;
        let bitPosition = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; // Skip the center pixel
            const neighborIdx = (y + dy) * imageData.width + (x + dx);
            const neighborValue = grayscale[neighborIdx];

            binaryPattern |=
              (neighborValue >= centerValue ? 1 : 0) << bitPosition;
            bitPosition++;
          }
        }

        lbpHist[binaryPattern]++;
      }
    }

    // Normalize histogram
    const totalPixels = (imageData.width - 2) * (imageData.height - 2);
    const normalizedHist = lbpHist.map((count) => count / totalPixels);

    // Compute texture score (example: entropy of histogram)
    const textureScore = normalizedHist.reduce((sum, p) => {
      if (p > 0) {
        return sum - p * Math.log2(p);
      }
      return sum;
    }, 0);

    console.log("LBP Texture Score:", textureScore);
    return textureScore; // Higher score can indicate better texture quality
  };

  const handleAuthenticate = async () => {
    if (!linkedFace) {
      alert("No face data linked with this Aadhaar number.");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot(); // Get base64 image from webcam
    setIsAuthenticating(true);

    try {
      const img = new Image();
      img.src = imageSrc;

      img.onload = async () => {
        // Perform face detection and recognition
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections && faceMatcher) {
          console.log("Detected face:", detections); // Log face detection result
          const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
          console.log("Best Match:", bestMatch); // Log face recognition result

          // Perform texture analysis for anti-spoofing
          const textureScore = await analyzeTexture(img);
          console.log("Texture Score:", textureScore); // Log texture score

          if (
            bestMatch.label.trim().toLowerCase() ===
              linkedFace.name.trim().toLowerCase() &&
            textureScore > 0.8 // Threshold for texture score (anti-spoofing)
          ) {
            console.log("Authentication Success!"); // Log authentication success
            onAuthenticated(linkedFace.name); // Redirect on success
          } else {
            console.log("Authentication failed."); // Log authentication failure
            alert(
              "Face authentication failed. Spoof Detected. Please try again."
            );
          }
        } else {
          console.log("No face detected or no face descriptor found.");
          alert("No face detected.");
        }
      };
    } catch (error) {
      console.error("Authentication error:", error);
    }

    setIsAuthenticating(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#f4f6f8",
        padding: "30px",
        gap: 4,
      }}
    >
      {/* Left Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flex: 1,
          maxWidth: "350px",
          backgroundColor: "#ffffff",
          boxShadow: 3,
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#333",
            fontWeight: "bold",
            borderBottom: "2px solid #006FB9",
            paddingBottom: "5px",
          }}
        >
          Aadhaar Authentication
        </Typography>

        {/* Aadhaar Input */}
        <Box>
          <Typography
            variant="body2"
            sx={{ color: "#000", fontWeight: "bold" }}
          >
            Enter Aadhaar Number:
          </Typography>
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              marginTop: "8px",
            }}
          >
            <input
              type="text"
              value={aadhaarNumber}
              onChange={handleAadhaarChange}
              placeholder="XXXX XXXX XXXX"
              style={{
                padding: "12px",
                fontSize: "16px",
                width: "100%",
                borderRadius: "8px",
                border: `2px solid ${
                  isValidAadhaar ? "green" : aadhaarNumber ? "red" : "gray"
                }`,
                outline: "none",
                transition: "border-color 0.3s",
              }}
            />
            {aadhaarNumber && (
              <Box
                sx={{
                  position: "absolute",
                  right: "10px",
                  color: isValidAadhaar ? "green" : "red",
                  fontSize: "15px",
                }}
              >
                {isValidAadhaar ? "✔️ Valid" : "❌ Invalid"}
              </Box>
            )}
          </Box>
        </Box>

        {/* Face Matcher and Face Detection Status */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Face Matcher Status */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: "2px solid",
              borderColor: isFaceMatcherLoaded ? "#00C853" : "orange",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#ffffff",
            }}
          >
            {isFaceMatcherLoaded ? (
              <Box
                sx={{ color: "#00C853", display: "flex", alignItems: "center" }}
              >
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Face matcher is ready</Typography>
              </Box>
            ) : (
              <Box
                sx={{ color: "orange", display: "flex", alignItems: "center" }}
              >
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading face matcher...</Typography>
              </Box>
            )}
          </Box>

          {/* Face Detection Status */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: "2px solid",
              borderColor:
                facesStatus === "no-face"
                  ? "red"
                  : facesStatus === "multiple-faces"
                  ? "orange"
                  : "#00C853",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#ffffff",
            }}
          >
            {facesStatus === "no-face" && (
              <Box sx={{ color: "red", display: "flex", alignItems: "center" }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="body2">No face detected</Typography>
              </Box>
            )}
            {facesStatus === "multiple-faces" && (
              <Box
                sx={{ color: "orange", display: "flex", alignItems: "center" }}
              >
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Multiple faces detected</Typography>
              </Box>
            )}
            {facesStatus === "one-face" && (
              <Box
                sx={{ color: "#00C853", display: "flex", alignItems: "center" }}
              >
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Ready to Authenticate</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Center Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          flex: 1.5,
          maxWidth: "600px",
          backgroundColor: "#ffffff",
          boxShadow: 3,
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#333",
            fontWeight: "bold",
            borderBottom: "2px solid #006FB9",
            paddingBottom: "5px",
          }}
        >
          Face Authentication
        </Typography>

        {/* Webcam */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "250px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: 2,
            border: "1px solid #000000",
          }}
        >
          <ReactWebcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Overlay for the green dotted rectangle */}
          <div
            style={{
              position: "absolute",
              top: "43%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              height: "60%",
              border: "2px dashed #00C853",
              borderRadius: "8px",
              boxSizing: "border-box",
              pointerEvents: "none", // Ensures it doesn't interfere with user interactions
            }}
          />
        </Box>

        {/* Authenticate Button */}
        <Button
          variant="contained"
          color="success"
          onClick={handleAuthenticate}
          disabled={
            !isValidAadhaar ||
            !linkedFace ||
            isAuthenticating ||
            cameraError ||
            facesStatus !== "one-face" ||
            !isFaceMatcherLoaded
          }
          startIcon={<CameraAltIcon />}
          sx={{
            width: "100%",
            borderRadius: "12px",
            fontSize: "18px",
            padding: "10px",
            textTransform: "none",
          }}
        >
          {isAuthenticating ? "Authenticating..." : "Authenticate"}
        </Button>
      </Box>

      {/* Right Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          maxWidth: "300px",
          backgroundColor: "#ffffff",
          boxShadow: 3,
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#333",
            fontWeight: "bold",
            borderBottom: "2px solid #006FB9",
            paddingBottom: "5px",
          }}
        >
          Instructions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RemoveRedEyeIcon sx={{ color: "green" }} />
            <Typography variant="body2" sx={{ color: "#000" }}>
              Look directly at your camera.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: "green" }} />
            <Typography variant="body2" sx={{ color: "#000" }}>
              Position your face within the green frame.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LightModeIcon sx={{ color: "green" }} />
            <Typography variant="body2" sx={{ color: "#000" }}>
              Ensure good lighting on your face.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VisibilityOffIcon sx={{ color: "green" }} />
            <Typography variant="body2" sx={{ color: "#000" }}>
              Remove face coverings, eyeglasses, or masks.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FaceAuthentication;
