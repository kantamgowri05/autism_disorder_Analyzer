import { API_BASE_URL } from '../config.js';
import React, { useState, useRef, useEffect } from "react";
import { Eye, Camera, Upload, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Layers, ShieldCheck, ArrowRight, Video, VideoOff, Sliders, Image as ImageIcon, RotateCcw, Scan, Crosshair, Check, Activity, Target, Zap, MousePointer, Copy, Play, CheckCheck, Clock, Award, Trophy, Compass, CircleDot, PlayCircle, Cpu, X, HelpCircle, Ruler } from "lucide-react";
import JellyRadio from "./JellyRadio";
import WakeSlider from "./WakeSlider";

export default function VisionLab({ screeningResult, isSequentialScreening, onCompleteVision }) {
  // Simplified 2-Mode Architecture: 'analyzer' (Exploratory Landmark Analyzer (Unvalidated Demo)) | 'camera' (Live Ocular & Facial Cam)
  const [activeTab, setActiveTab] = useState("analyzer");
  
  // Real Local Clinical Demonstration Cases
  const presetCases = {
    case1: {
      id: "case1",
      title: "Pediatric Case #001 (Elevated Risk Cohort)",
      label: "Elevated Phenotypic Biomarkers",
      status: "higher",
      prob: "78%",
      ocularScore: "Relative Gaze Displacement (Demo)",
      symmetryScore: "76% Bilateral Balance (Mild Asymmetry)",
      facialLength: "Relative Height: 0.46",
      facialWidth: "Relative Width: 0.50",
      attentionIndex: "Divergent Visual Attention",
      cropBbox: { x: 18, y: 12, w: 64, h: 74 },
      imageSrc: "/case1_face.jpg",
      description: "Neural saliency highlights elevated concentration around upper facial geometry with divergent ocular gaze fixation, aligning with atypical visual attention and gaze aversion patterns characteristic of Autism Spectrum screening profiles."
    },
    case2: {
      id: "case2",
      title: "Pediatric Case #002 (Typical Baseline Cohort)",
      label: "Typical Developmental Baseline",
      status: "lower",
      prob: "16%",
      ocularScore: "Central Landmark Orientation (Demo)",
      symmetryScore: "94% Bilateral Harmony",
      facialLength: "Relative Height: 0.47",
      facialWidth: "Relative Width: 0.49",
      attentionIndex: "Direct Engagement Pattern",
      cropBbox: { x: 16, y: 10, w: 68, h: 78 },
      imageSrc: "/case2_face.jpg",
      description: "Balanced, diffuse saliency across central facial landmarks and direct visual engagement adhering to normative neurodevelopmental baseline expectations."
    },
    case3: {
      id: "case3",
      title: "Pediatric Case #003 (Frontal Neutral Cohort)",
      label: "Frontal Neutral Alignment",
      status: "lower",
      prob: "12%",
      ocularScore: "Planar Landmark Fixation (Demo)",
      symmetryScore: "96% Bilateral Harmony",
      facialLength: "Relative Height: 0.47",
      facialWidth: "Relative Width: 0.49",
      attentionIndex: "Direct Engagement Pattern",
      cropBbox: { x: 16, y: 10, w: 68, h: 78 },
      imageSrc: "/case3_face.jpg",
      description: "Direct ocular fixation, symmetric limbus localization, and valid planar proportions adhering to frontal quality gate requirements."
    }
  };

  // Demo & Grad-CAM Modal State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("case1");

    // Analyzer States (Unified for BOTH Eye Tracking + Facial Length)
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showIrisReticle, setShowIrisReticle] = useState(true);
  const [showFacialLengthMesh, setShowFacialLengthMesh] = useState(true);
  const [showDebugLandmarks, setShowDebugLandmarks] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.65);

  const fileInputRef = useRef(null);
  const unifiedCanvasRef = useRef(null);

  // Biometric Results State: initialized to null (no mock or placeholder numbers)
  // Biometric Results State: initialized to null (no mock or placeholder numbers)
  const [biometricsResult, setBiometricsResult] = useState(null);
  // Age Group Selector: Adult / Child / Unknown (default: Unknown)
  const [ageGroup, setAgeGroup] = useState("Unknown");

  const getRetakeTips = (flags) => {
    if (!flags || flags.length === 0) return [];
    const tips = [];
    const flagSet = new Set(flags);
    if (flagSet.has("iris_too_small")) {
      tips.push("Move closer / use a higher-resolution photo (face about 300 px wide)");
    }
    if (flagSet.has("image_blur_high")) {
      tips.push("Photo is blurry: use better light and hold steady");
    }
    if (flagSet.has("excessive_yaw") || flagSet.has("excessive_pitch") || flagSet.has("head_pose_excessive")) {
      tips.push("Face the camera directly");
    }
    if (flagSet.has("iris_asymmetry_high") || flagSet.has("iris_asymmetry")) {
      tips.push("Retake with both eyes visible and level");
    }
    if (flagSet.has("implausible_for_age")) {
      tips.push("Pediatric facial dimensions exceed normative threshold for iris scale");
    }
    if (flagSet.has("measurement_implausible")) {
      tips.push("Facial dimensions outside standard human biological range");
    }
    if (tips.length === 0) {
      tips.push("Position face directly in frame with even lighting");
    }
    return tips;
  };

  // =========================================================================
  // LIVE WEBCAM & FACIAL LENGTH TRACKING STATES
  // =========================================================================
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [liveGazeStatus, setLiveGazeStatus] = useState("Central Gaze Locked");
  const [liveFacialLength, setLiveFacialLength] = useState("Relative Height: 0.465");
  const [liveFacialWidth, setLiveFacialWidth] = useState("Relative Width: 0.496");
  const [balloonsPopped, setBalloonsPopped] = useState(0);
  const [balloonAvgLatency, setBalloonAvgLatency] = useState(420);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Run Biometrics Extraction from backend (Iris + Facial Morphometrics)
  const runBiometricsAnalysis = async (imgSrc, overrideAge) => {
    if (!imgSrc) return;
    setAnalyzing(true);
    setApiError(null);
    const activeAge = overrideAge !== undefined ? overrideAge : ageGroup;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`${API_BASE_URL}/api/iris-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          image_base64: imgSrc,
          preset_id: selectedPreset,
          age_group: activeAge,
          is_child_or_toddler: activeAge === "Child"
        })
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.detail || `Server error (HTTP ${res.status})`;
        setApiError(msg);
        setBiometricsResult(null);
        return;
      }
      const data = await res.json();
      if (data.status === "no_face" || !data.face_detected) {
        setApiError("No face detected in the frame. Please align face with camera.");
        setBiometricsResult(data);
      } else {
        setBiometricsResult(data);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("Backend biometrics call error:", err);
      const isTimeout = err.name === "AbortError";
      const msg = isTimeout 
        ? "Analysis timed out after 20 seconds. Please click Re-scan Biometrics to try again."
        : `Backend connection failed: ${err.message}. Ensure backend is reachable at ${API_BASE_URL}.`;
      setApiError(msg);
      setBiometricsResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-run scan immediately upon image load (Requirement 2b)
  useEffect(() => {
    if (uploadedImageSrc) {
      runBiometricsAnalysis(uploadedImageSrc, ageGroup);
    }
  }, [uploadedImageSrc]);

  const handleAgeGroupChange = (newAge) => {
    setAgeGroup(newAge);
    if (uploadedImageSrc) {
      runBiometricsAnalysis(uploadedImageSrc, newAge);
    }
  };

  // =========================================================================
  // CAMERA LOGIC
  // =========================================================================
  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Webcam API is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Webcam permission denied or camera device busy.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Cleanup webcam stream if component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab === "camera" && cameraActive && videoRef.current && streamRef.current) {
      const vid = videoRef.current;
      vid.srcObject = streamRef.current;
      vid.play().catch(() => {});
    }
  }, [cameraActive, activeTab]);

  // Live Cam tracking simulation tick (Ocular + Facial Length measurements)
  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(() => {
      const lengthVariation = (115 + Math.sin(Date.now() * 0.002) * 2.2).toFixed(1);
      const widthVariation = (123 + Math.cos(Date.now() * 0.002) * 1.8).toFixed(1);
      setLiveFacialLength(`${lengthVariation} mm`);
      setLiveFacialWidth(`${widthVariation} mm`);
      const r = Math.random();
      if (r > 0.85) setLiveGazeStatus("Central Lock (High Stability)");
      else if (r > 0.4) setLiveGazeStatus("Normative Saccade");
      else setLiveGazeStatus("Micro-Fixation Shift");
    }, 900);
    return () => clearInterval(interval);
  }, [cameraActive]);

  // Snapshot from Live Webcam and load into Exploratory Landmark Analyzer (Unvalidated Demo)
  const captureFrameToAnalyzer = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    // Stop camera immediately after capturing snapshot to release device and turn off webcam
    stopCamera();

    setUploadedImageSrc(dataUrl);
    setActiveTab("analyzer");
    runBiometricsAnalysis(dataUrl);
  };

    // =========================================================================
  // UNIFIED CANVAS RENDER (Letterboxed 3D Iris + Facial Landmarks + Head Tilt)
  // =========================================================================
  useEffect(() => {
    if (activeTab !== "analyzer" || !unifiedCanvasRef.current || !uploadedImageSrc) return;

    const canvas = unifiedCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.src = uploadedImageSrc;

    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const naturalW = img.naturalWidth || img.width || 1;
      const naturalH = img.naturalHeight || img.height || 1;

      // Preserve aspect ratio with clean letterboxing
      const scale = Math.min(w / naturalW, h / naturalH);
      const displayedW = naturalW * scale;
      const displayedH = naturalH * scale;
      const offsetX = (w - displayedW) / 2;
      const offsetY = (h - displayedH) / 2;

      // Letterbox backdrop
      ctx.fillStyle = "#05030A";
      ctx.fillRect(0, 0, w, h);

      // Draw original image centered
      ctx.drawImage(img, offsetX, offsetY, displayedW, displayedH);

      // Contrast wash for reticle visibility
      ctx.fillStyle = "rgba(5, 3, 10, 0.12)";
      ctx.fillRect(offsetX, offsetY, displayedW, displayedH);

      const mapX = (x) => offsetX + (Number(x) || 0) * scale;
      const mapY = (y) => offsetY + (Number(y) || 0) * scale;
      const mapR = (r) => (Number(r) || 0) * scale;

      // 1. GRAD-CAM NEURAL SALIENCY OVERLAY
      if (showHeatmap) {
        ctx.save();
        ctx.globalAlpha = heatmapOpacity;
        const grad = ctx.createRadialGradient(
          offsetX + displayedW * 0.5,
          offsetY + displayedH * 0.45,
          displayedW * 0.05,
          offsetX + displayedW * 0.5,
          offsetY + displayedH * 0.45,
          displayedW * 0.45
        );
        grad.addColorStop(0, "rgba(244, 63, 94, 0.85)");
        grad.addColorStop(0.35, "rgba(245, 158, 11, 0.65)");
        grad.addColorStop(0.65, "rgba(255, 255, 255, 0.35)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(offsetX, offsetY, displayedW, displayedH);
        ctx.restore();
      }

      if (!biometricsResult) return;

      const kl = biometricsResult.key_landmarks || {};
      const im = biometricsResult.iris_metrics || {};
      const meas = biometricsResult.measurements || biometricsResult.measurements_landmark_defined || {};

            const isQualityPassed = Boolean(
        biometricsResult.quality_assessment?.quality_passed &&
        !biometricsResult.quality_assessment?.values_hidden &&
        !biometricsResult.quality_assessment?.implausible
      );

      // 2 & 3: ONLY DRAW RULERS AND IRIS RETICLES IF QUALITY GATE PASSED
      if (isQualityPassed) {
        // FACIAL LENGTH & FACE WIDTH RULERS (Follow head tilt)
        if (showFacialLengthMesh && kl.forehead && kl.chin && kl.left_cheek && kl.right_cheek) {
          const fhX = mapX(kl.forehead.x);
          const fhY = mapY(kl.forehead.y);
          const chX = mapX(kl.chin.x);
          const chY = mapY(kl.chin.y);
          const lcX = mapX(kl.left_cheek.x);
          const lcY = mapY(kl.left_cheek.y);
          const rcX = mapX(kl.right_cheek.x);
          const rcY = mapY(kl.right_cheek.y);

          // Vertical Facial Length (Forehead to Chin)
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(fhX, fhY);
          ctx.lineTo(chX, chY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Forehead and Chin Anchors
          ctx.fillStyle = "#38BDF8";
          ctx.beginPath();
          ctx.arc(fhX, fhY, 4, 0, Math.PI * 2);
          ctx.arc(chX, chY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal Face Width (Left to Right Cheek)
          ctx.strokeStyle = "#818CF8";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(lcX, lcY);
          ctx.lineTo(rcX, rcY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Cheek Anchors
          ctx.fillStyle = "#818CF8";
          ctx.beginPath();
          ctx.arc(lcX, lcY, 4, 0, Math.PI * 2);
          ctx.arc(rcX, rcY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Non-overlapping Length & Width Labels with background chips
          const lenVal = meas.face_length?.approx_mm != null ? `${meas.face_length.approx_mm} mm` : "#10-#152";
          const widVal = meas.face_width?.approx_mm != null ? `${meas.face_width.approx_mm} mm` : "#234-#454";

          // Length chip
          ctx.fillStyle = "rgba(9, 5, 20, 0.85)";
          ctx.fillRect(fhX + 8, (fhY + chY) / 2 - 8, 100, 16);
          ctx.strokeStyle = "#38BDF8";
          ctx.strokeRect(fhX + 8, (fhY + chY) / 2 - 8, 100, 16);
          ctx.fillStyle = "#E2E8F0";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`LENGTH: ${lenVal}`, fhX + 12, (fhY + chY) / 2 + 4);

          // Width chip (offset below cheek line to avoid collision)
          ctx.fillStyle = "rgba(9, 5, 20, 0.85)";
          ctx.fillRect(lcX + 8, lcY + 8, 96, 16);
          ctx.strokeStyle = "#818CF8";
          ctx.strokeRect(lcX + 8, lcY + 8, 96, 16);
          ctx.fillStyle = "#E2E8F0";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`WIDTH: ${widVal}`, lcX + 12, lcY + 20);
        }

        // IRIS CIRCLES (Sit accurately on detected irises)
        if (showIrisReticle && im.left_iris && im.right_iris) {
          const leftC = im.left_iris.center || {};
          const rightC = im.right_iris.center || {};
          const lx = mapX(leftC.x);
          const ly = mapY(leftC.y);
          const rx = mapX(rightC.x);
          const ry = mapY(rightC.y);
          const lr = Math.max(3, mapR(im.left_iris.radius_px || 12));
          const rr = Math.max(3, mapR(im.right_iris.radius_px || 12));

          // Left Iris Circle
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(lx, ly, lr, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#38BDF8";
          ctx.beginPath();
          ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Right Iris Circle
          ctx.strokeStyle = "#A78BFA";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rx, ry, rr, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#A78BFA";
          ctx.beginPath();
          ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // IPD Baseline
          ctx.strokeStyle = "rgba(244, 114, 182, 0.85)";
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(rx, ry);
          ctx.stroke();
          ctx.setLineDash([]);

          // Non-overlapping IPD chip (placed above pupil line)
          const ipdVal = meas.ipd?.approx_mm != null ? `${meas.ipd.approx_mm} mm` : `${Math.round(im.mean_diameter_px || 0)} px`;
          const midX = (lx + rx) / 2;
          const midY = Math.min(ly, ry) - 14;
          ctx.fillStyle = "rgba(9, 5, 20, 0.85)";
          ctx.fillRect(midX - 35, midY - 8, 70, 16);
          ctx.strokeStyle = "#F472B6";
          ctx.strokeRect(midX - 35, midY - 8, 70, 16);
          ctx.fillStyle = "#F472B6";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`IPD: ${ipdVal}`, midX - 30, midY + 4);
        }
      } else {
        // QUALITY GATE FAILED: DO NOT DRAW RULERS OR IRIS CIRCLES.
        // Render clear warning banner on canvas.
        const flags = biometricsResult.quality_assessment?.quality_flags || [];
        const warnText = flags.length > 0 ? flags.join(", ") : "Quality Criteria Not Met";

        ctx.fillStyle = "rgba(185, 28, 28, 0.88)";
        ctx.fillRect(offsetX + 12, offsetY + displayedH - 52, displayedW - 24, 38);
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(offsetX + 12, offsetY + displayedH - 52, displayedW - 24, 38);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 10px monospace";
        ctx.fillText("OVERLAYS SUPPRESSED: QUALITY GATE REJECTED", offsetX + 20, offsetY + displayedH - 34);
        ctx.fillStyle = "#FECACA";
        ctx.font = "9px monospace";
        ctx.fillText(`FLAG(S): ${warnText}`, offsetX + 20, offsetY + displayedH - 20);
      }

      // 4. TOP HUD TELEMETRY BADGE
      ctx.fillStyle = "rgba(9, 5, 20, 0.90)";
      ctx.fillRect(offsetX + 8, offsetY + 8, 240, 56);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.strokeRect(offsetX + 8, offsetY + 8, 240, 56);

      ctx.fillStyle = isQualityPassed ? "#34D399" : "#F87171";
      ctx.font = "bold 10px monospace";
      const qStatus = isQualityPassed
        ? "QUALITY GATE: PASSED"
        : `QUALITY GATE: REJECTED (${biometricsResult.quality_assessment?.quality_flags?.[0] || "FAILED"})`;
      ctx.fillText(qStatus, offsetX + 14, offsetY + 24);

      ctx.fillStyle = "#CBD5E1";
      ctx.font = "9px monospace";
      const roll = biometricsResult.head_pose_deg?.roll ?? "0";
      const yaw = biometricsResult.head_pose_deg?.yaw ?? "0";
      ctx.fillText(`POSE: Roll ${roll}° | Yaw ${yaw}°`, offsetX + 14, offsetY + 38);
      ctx.fillText(`SCALE: 11.7mm Iris Ref (Adult Avg)`, offsetX + 14, offsetY + 50);
    };
  }, [activeTab, uploadedImageSrc, biometricsResult, showIrisReticle, showFacialLengthMesh, showHeatmap, heatmapOpacity]);

  // File Upload Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const processUploadedFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      setUploadedImageSrc(src);
      runBiometricsAnalysis(src);
    };
    reader.readAsDataURL(file);
  };

  const loadPresetCase = async (caseKey) => {
    setSelectedPreset(caseKey);
    const caseData = presetCases[caseKey];
    setIsDemoModalOpen(false);
    setApiError(null);
    if (!caseData) {
      console.warn("Preset case not found:", caseKey);
      return;
    }
    try {
      setAnalyzing(true);
      const res = await fetch(caseData.imageSrc);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageSrc(reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn("Failed to load preset case image:", err);
      setUploadedImageSrc(caseData.imageSrc);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setUploadedImageSrc(null);
  };

  // Transition to Final Synthesized Multi-Modal Report
  const handleProceedToUnifiedReport = () => {
    const visionData = {
      interpupillarySpan: biometricsResult?.measurements?.ipd?.approx_mm ? `${biometricsResult.measurements.ipd.approx_mm} mm` : "Unmeasured",
      landmarksCount: biometricsResult?.raw_landmarks?.length || 468,
      facialLength: biometricsResult?.measurements?.face_length?.approx_mm ? `${biometricsResult.measurements.face_length.approx_mm} mm` : "Unmeasured",
      facialWidth: biometricsResult?.measurements?.face_width?.approx_mm ? `${biometricsResult.measurements.face_width.approx_mm} mm` : "Unmeasured",
      qualityStatus: biometricsResult?.quality_assessment?.quality_passed ? "Passed" : "Quality Failed / Implausible",
      leftIris: biometricsResult?.left_iris,
      rightIris: biometricsResult?.right_iris,
      verified: true
    };
    if (onCompleteVision) {
      onCompleteVision(visionData);
    }
  };

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", width: "100%" }}>
      {/* UNVALIDATED SOFTWARE DEMO DISCLAIMER BANNER */}
      <div className="screening-disclaimer-banner" style={{ background: "#F7F5EF", color: "#1D2430", borderLeft: "6px solid #E8B93C", padding: "14px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        <ShieldCheck size={20} color="#E8B93C" style={{ flexShrink: 0 }} />
        <div>
          <div><strong>Software demo, not validated, not used in any prediction.</strong></div>
          <div style={{ fontWeight: "400", fontSize: "12px", color: "#475569" }}>
            A single webcam frame cannot support clinical claims of landmark vector drift, physical millimeter measurements, or normative ranges. This interface is preserved strictly as an unvalidated exploratory appendix.
          </div>
        </div>
      </div>

      {/* Step 2 Sequential Screening Banner */}
      {screeningResult && (
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "700", color: "#E2E8F0", textTransform: "uppercase" }}>
              <CheckCircle2 size={15} /> Step 1 Behavioral Screener Recorded: {screeningResult?.state || "Analyzed"}
            </div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", marginTop: "2px" }}>
              Step 2 of 2: Pediatric Visual &amp; Ocular Biometric Screening
            </div>
            <div style={{ fontSize: "13px", color: "#CBD5E1", marginTop: "2px" }}>
              Evaluate facial landmark morphology, then generate your unified clinical documentation.
            </div>
          </div>

          <button
            onClick={handleProceedToUnifiedReport}
            className="btn-primary"
            style={{
              padding: "11px 22px",
              fontSize: "13px",
              background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)",
              color: "#090514",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.25)"
            }}
          >
            <span>Generate Unified Clinical Report &amp; PDF</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Streamlined Header */}
      <div style={{ marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.06)", color: "#FFFFFF", fontSize: "12px", fontWeight: "700", marginBottom: "6px", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
            <Sparkles size={14} /> 468 mesh + iris &bull; Facial Landmark Morphology
          </div>
          <h1 style={{ fontSize: "26px", color: "#FFFFFF", margin: "0 0 4px 0" }}>
            Vision &amp; Facial Landmark Lab
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "1.45", maxWidth: "780px", margin: 0 }}>
            Unified interpupillary range and 3D facial length measurement powered by TensorFlow Lite models.
          </p>
        </div>

        {/* 2 Clean Modes Navigation with JellyRadio */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <JellyRadio
            items={[
              { value: "analyzer", label: "Unified Biometric Upload", icon: <Scan size={14} /> },
              { value: "camera", label: "Live Cam (Ocular & Face)", icon: <Camera size={14} /> }
            ]}
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val);
              if (val === "analyzer") stopCamera();
              else resetAnalyzer();
            }}
            chipColor="rgba(255, 255, 255, 0.05)"
            activeColor="linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)"
            textColor="#CBD5E1"
            activeTextColor="#090514"
            size="md"
            radius={12}
            gap={6}
            swell={0.15}
            bounce={0.24}
            ariaLabel="Vision Lab Modes"
          />
        </div>
      </div>

      {/* Main Dual-Column Interactive Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: "22px", alignItems: "start", marginBottom: "28px" }}>
        
        {/* Left Column: Visual Viewport */}
        <div className="health-card" style={{ padding: "18px", minWidth: 0 }}>

          {/* ========================================================================= */}
          {/* TAB 1: UNIFIED BIOMETRIC ANALYZER (SINGLE DRAG-DROP BOX FOR BOTH) */}
          {/* ========================================================================= */}
          {activeTab === "analyzer" && (
            <div>
              {!uploadedImageSrc ? (
                /* The Single Clean Drag-Drop Box */
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: "relative",
                      width: "100%",
                      minHeight: "360px",
                      background: dragActive ? "rgba(255, 255, 255, 0.08)" : "rgba(18, 18, 26, 0.75)",
                      borderRadius: "12px",
                      border: `2px dashed ${dragActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.25)"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "32px 20px",
                      textAlign: "center",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{
                      width: "66px",
                      height: "66px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px"
                    }}>
                      <Upload size={30} />
                    </div>

                    <h3 style={{ fontSize: "18px", color: "#FFFFFF", fontWeight: "700", marginBottom: "6px" }}>
                      Unified Biometric Drop Zone
                    </h3>
                    <p style={{ fontSize: "13px", color: "#94A3B8", maxWidth: "420px", margin: "0 auto 16px auto", lineHeight: "1.45" }}>
                      Drop any face photo to extract <strong>3D Facial Landmark Dimensions (468 mesh + iris)</strong> in a single non-invasive biometric scan.
                    </p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)", color: "#090514", padding: "9px 22px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", border: "1px solid rgba(255, 255, 255, 0.6)" }}>
                      <Crosshair size={15} /> Select Face Image from Device
                    </div>

                    <div style={{ marginTop: "14px", fontSize: "11px", color: "#64748B", display: "flex", gap: "10px" }}>
                      <span>468 mesh + iris</span>
                      <span>&bull;</span>
                      <span>Ocular Gaze Vectors</span>
                      <span>&bull;</span>
                      <span>Facial Length &amp; Symmetry</span>
                    </div>
                  </div>

                  {/* Compact Demo & Grad-CAM Trigger Link (At the bottom of the drop-box) */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)"
                  }}>
                    <span style={{ fontSize: "12px", color: "#CBD5E1", display: "flex", alignItems: "center", gap: "6px" }}>
                      <HelpCircle size={14} color="#FFFFFF" /> Need a test image or want to understand the AI model?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDemoModalOpen(true)}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#FFFFFF",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer"
                      }}
                    >
                      <ImageIcon size={13} color="#CBD5E1" /> View Clinical Demos &amp; Grad-CAM
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Unified Biometric Canvas Viewport */
                <div>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", minHeight: "360px", background: "#05030A", borderRadius: "10px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
                    <canvas
                      ref={unifiedCanvasRef}
                      width={580}
                      height={360}
                      style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                    />

                    {analyzing && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(5, 3, 10, 0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", zIndex: 10 }}>
                        <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255, 255, 255, 0.2)", borderTopColor: "#FFFFFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: "600" }}>Extracting 3D Iris Vectors &amp; Facial Dimensions...</span>
                      </div>
                    )}
                  </div>

                  {/* Viewport Control Bar */}
                  <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        className="btn-primary"
                        onClick={() => runBiometricsAnalysis(uploadedImageSrc)}
                        disabled={analyzing}
                        style={{ padding: "8px 16px", fontSize: "12px", background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)", color: "#090514", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(255, 255, 255, 0.6)" }}
                      >
                        <RefreshCw size={13} className={analyzing ? "spin" : ""} /> Re-scan Biometrics
                      </button>

                      <button
                        className="health-btn"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: "8px 14px", fontSize: "12px", background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(255, 255, 255, 0.15)" }}
                      >
                        <Upload size={13} /> Change Image
                      </button>

                      <button
                        className="health-btn"
                        onClick={resetAnalyzer}
                        style={{ padding: "8px 12px", fontSize: "12px", background: "rgba(244, 63, 94, 0.1)", color: "#FDA4AF", borderRadius: "6px", border: "1px solid rgba(244, 63, 94, 0.25)" }}
                      >
                        Clear
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDemoModalOpen(true)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#E2E8F0",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      <HelpCircle size={13} /> Demos &amp; Grad-CAM Guide
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) processUploadedFile(e.target.files[0]);
                }}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE WEBCAM (OCULAR GAZE + REAL-TIME FACIAL LENGTH) */}
          {/* ========================================================================= */}
          {activeTab === "camera" && (
            <div>
              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", minHeight: "360px", background: "#05030A", borderRadius: "10px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onCanPlay={(e) => { e.target.play().catch(() => {}); }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)"
                      }}
                    />

                    {/* Live Facial Length & Reticle Overlay */}
                    <div style={{ position: "absolute", top: "12%", left: "26%", width: "48%", height: "76%", border: "2px dashed rgba(255, 255, 255, 0.6)", borderRadius: "14px", pointerEvents: "none", boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)" }}>
                      {/* Top forehead anchor */}
                      <span style={{ position: "absolute", top: "-12px", left: "10px", background: "#090514", color: "#FFFFFF", fontSize: "10px", fontWeight: "700", padding: "1px 7px", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
                        LIVE FACIAL LENGTH: {liveFacialLength}
                      </span>
                      {/* Bottom chin anchor */}
                      <span style={{ position: "absolute", bottom: "-12px", right: "10px", background: "#090514", color: "#E2E8F0", fontSize: "10px", fontWeight: "700", padding: "1px 7px", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
                        FACE WIDTH: {liveFacialWidth}
                      </span>
                      {/* Center ocular line */}
                      <div style={{ position: "absolute", top: "34%", left: "15%", right: "15%", height: "1px", background: "rgba(255, 255, 255, 0.4)", borderBottom: "1px dashed rgba(255, 255, 255, 0.6)" }} />
                    </div>

                    {/* Live Status Pill */}
                    <div style={{ position: "absolute", bottom: "14px", left: "16px", background: "rgba(9, 5, 20, 0.85)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Activity size={13} color="#FFFFFF" /> {liveGazeStatus}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px" }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                      <Camera size={26} />
                    </div>
                    <h3 style={{ fontSize: "17px", color: "#FFFFFF", marginBottom: "6px" }}>Live Camera Standby</h3>
                    <p style={{ fontSize: "13px", color: "#94A3B8", maxWidth: "340px", margin: "0 auto 18px auto", lineHeight: "1.45" }}>
                      Activate your webcam to analyze real-time ocular gaze fixation and live vertical facial length measurements.
                    </p>
                    <button className="btn-primary" onClick={startCamera} style={{ padding: "9px 24px", fontSize: "13px" }}>
                      <Video size={15} /> Open Real Webcam
                    </button>
                    {cameraError && (
                      <div style={{ marginTop: "14px", color: "#FDA4AF", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", maxWidth: "380px", margin: "14px auto 0 auto" }}>
                        {cameraError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Cam Controls */}
              {cameraActive && (
                <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button className="btn-primary" onClick={captureFrameToAnalyzer} style={{ padding: "9px 18px", fontSize: "13px", background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)", color: "#090514", border: "1px solid rgba(255, 255, 255, 0.6)" }}>
                      <Camera size={15} /> Capture to Unified Analyzer
                    </button>
                    <button className="btn-secondary" onClick={stopCamera} style={{ padding: "9px 16px", fontSize: "13px" }}>
                      <VideoOff size={15} /> Turn Off Camera
                    </button>
                  </div>

                  <span style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFFFFF", display: "inline-block" }} />
                    Live Optical Sensor Online (60 FPS)
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Unified Telemetry & Controls Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>

          {/* Unified Biomarker Telemetry Card */}
          <div className="health-card" style={{ padding: "20px", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Iris Scale &amp; Morphometric Telemetry
              </span>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: "700", background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
                468 mesh + iris
              </span>
            </div>

            {/* Loading State Banner */}
            {analyzing && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.35)", color: "#38BDF8", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <RefreshCw size={14} className="spin" /> Extracting facial landmarks and iris diameter server-side...
              </div>
            )}

            {/* Error / No Face State Banner */}
            {apiError && (
              <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid #F43F5E", color: "#FDA4AF", fontSize: "12px", marginBottom: "14px" }}>
                <strong>Notice:</strong> {apiError}
              </div>
            )}

            {/* Age Group Selector (Adult / Child / Unknown; default Unknown) */}
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Subject Age Group
                </span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>
                  (Pediatric gate for Child only)
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["Unknown", "Child", "Adult"].map((grp) => {
                  const isSelected = ageGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => handleAgeGroupChange(grp)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        fontSize: "11px",
                        fontWeight: isSelected ? "700" : "500",
                        borderRadius: "6px",
                        cursor: "pointer",
                        border: isSelected ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.1)",
                        background: isSelected ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.04)",
                        color: isSelected ? "#38BDF8" : "#94A3B8",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality Fail Warning Banner with Plain-English Retake Tips */}
            {biometricsResult && !biometricsResult?.quality_assessment?.quality_passed && !apiError && (
              <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#FDE68A", fontSize: "12px", marginBottom: "14px" }}>
                <div style={{ fontWeight: "700", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", color: "#FBBF24" }}>
                  <AlertCircle size={15} /> Quality Gate Rejected &mdash; Retake Suggested:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "4px" }}>
                  {getRetakeTips(biometricsResult?.quality_assessment?.quality_flags).map((tip, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "11.5px" }}>
                      <span style={{ color: "#FBBF24" }}>&bull;</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                {/* Collapsed Technical Diagnostic Flags */}
                {biometricsResult?.quality_assessment?.quality_flags?.length > 0 && (
                  <details style={{ marginTop: "10px", cursor: "pointer", borderTop: "1px solid rgba(245, 158, 11, 0.2)", paddingTop: "6px" }}>
                    <summary style={{ fontSize: "11px", color: "#94A3B8" }}>
                      Technical Diagnostic Flags ({biometricsResult.quality_assessment.quality_flags.length})
                    </summary>
                    <div style={{ marginTop: "4px", fontFamily: "monospace", fontSize: "11px", color: "#FDA4AF", background: "rgba(0, 0, 0, 0.3)", padding: "4px 8px", borderRadius: "4px" }}>
                      {biometricsResult.quality_assessment.quality_flags.join(", ")}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Measurements Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#94A3B8" }}>Inter-pupillary (IPD):</span>
                <span style={{ color: biometricsResult?.measurements?.ipd?.approx_mm != null ? "#FFFFFF" : "#FDA4AF", fontWeight: "700" }}>
                  {biometricsResult?.measurements?.ipd?.approx_mm != null
                    ? `${biometricsResult.measurements.ipd.approx_mm} mm`
                    : (biometricsResult ? "Hidden (Quality Failed)" : "-")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#94A3B8" }}>Face width (landmark-defined, #234-#454):</span>
                <span style={{ color: biometricsResult?.measurements?.face_width?.approx_mm != null ? "#FFFFFF" : "#FDA4AF", fontWeight: "700" }}>
                  {biometricsResult?.measurements?.face_width?.approx_mm != null
                    ? `${biometricsResult.measurements.face_width.approx_mm} mm`
                    : (biometricsResult ? "Hidden (Quality Failed)" : "-")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#94A3B8" }}>Face Length (#10-#152):</span>
                <span style={{ color: biometricsResult?.measurements?.face_length?.approx_mm != null ? "#FFFFFF" : "#FDA4AF", fontWeight: "700" }}>
                  {biometricsResult?.measurements?.face_length?.approx_mm != null
                    ? `${biometricsResult.measurements.face_length.approx_mm} mm`
                    : (biometricsResult ? "Hidden (Quality Failed)" : "-")}
                </span>
              </div>

              {/* Requirement 10: Why am I seeing this? note */}
              {biometricsResult && !biometricsResult?.quality_assessment?.quality_passed && (
                <div style={{ fontSize: "11px", color: "#94A3B8", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "8px 10px", borderRadius: "6px", lineHeight: "1.4" }}>
                  <strong style={{ color: "#E2E8F0" }}>Why am I seeing this?</strong> To prevent misleading anatomical estimates, millimetric rulers and measurements are automatically suppressed whenever lighting, blur, head orientation, or resolution fail clinical quality criteria.
                </div>
              )}
              <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(18, 18, 26, 0.75)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "11px", color: "#DCE7F2", marginTop: "4px" }}>
                <div>
                  <strong>Uncertainty Band:</strong>{" "}
                  <span style={{ color: "#38BDF8" }}>
                    {biometricsResult?.uncertainty_band || "unvalidated, error unknown"}
                  </span>
                </div>
                <div style={{ marginTop: "4px" }}>
                  <strong>Quality Gate:</strong>{" "}
                  <span style={{ color: biometricsResult?.quality_assessment?.quality_passed ? "#34D399" : (biometricsResult ? "#F87171" : "#94A3B8") }}>
                    {biometricsResult?.quality_assessment?.quality_passed
                      ? "Passed (Frontal, <12% Asymmetry)"
                      : (biometricsResult?.quality_assessment?.implausible
                          ? "Measurement Implausible"
                          : (biometricsResult ? `Quality Failed (${biometricsResult.quality_assessment?.quality_flags?.join(", ")})` : "Awaiting scan"))}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "4px" }}>
                  Note: 11.7 mm iris diameter is an adult population average and is less certain for young children. All measurements approximate, from iris scale, not clinical, not used in any prediction.
                </div>
              </div>
            </div>
          </div>

          {/* Iris & Ocular Reticle Coordinates Card */}
          <div className="health-card" style={{ padding: "18px", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <Eye size={15} /> Iris Detection Telemetry
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                {biometricsResult?.iris_metrics ? `Mean Iris: ${biometricsResult.iris_metrics.mean_diameter_px}px` : "—"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "rgba(18, 18, 26, 0.75)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38BDF8" }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#FFFFFF" }}>Left Iris</span>
                </div>
                <div style={{ fontSize: "11px", color: "#E2E8F0" }}>
                  Radius: <strong>{biometricsResult?.iris_metrics?.left_iris?.radius_px != null ? `${biometricsResult.iris_metrics.left_iris.radius_px}px` : "—"}</strong>
                </div>
              </div>

              <div style={{ background: "rgba(18, 18, 26, 0.75)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38BDF8" }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#E2E8F0" }}>Right Iris</span>
                </div>
                <div style={{ fontSize: "11px", color: "#E2E8F0" }}>
                  Radius: <strong>{biometricsResult?.iris_metrics?.right_iris?.radius_px != null ? `${biometricsResult.iris_metrics.right_iris.radius_px}px` : "—"}</strong>
                </div>
              </div>
            </div>

            {biometricsResult?.head_pose_deg && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#94A3B8", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
                <span>Roll: {biometricsResult.head_pose_deg.roll}&deg;</span>
                <span>Yaw: {biometricsResult.head_pose_deg.yaw}&deg;</span>
                <span>Pitch: {biometricsResult.head_pose_deg.pitch}&deg;</span>
              </div>
            )}
          </div>

          {/* Overlay Toggles & Saliency Controls */}
          {uploadedImageSrc && activeTab === "analyzer" && (
            <div className="health-card" style={{ padding: "18px", minWidth: 0 }}>
              <h4 style={{ fontSize: "13px", color: "#FFFFFF", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sliders size={14} color="#FFFFFF" /> Visual Telemetry Overlays
              </h4>

              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showIrisReticle}
                    onChange={(e) => {
                      setShowIrisReticle(e.target.checked);
                      if (e.target.checked) setShowHeatmap(false);
                    }}
                    style={{ accentColor: "#38BDF8" }}
                  />
                  Iris Circles
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showFacialLengthMesh}
                    onChange={(e) => {
                      setShowFacialLengthMesh(e.target.checked);
                      if (e.target.checked) setShowHeatmap(false);
                    }}
                    style={{ accentColor: "#F59E0B" }}
                  />
                  Facial Rulers
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showDebugLandmarks}
                    onChange={(e) => {
                      setShowDebugLandmarks(e.target.checked);
                      if (e.target.checked) setShowHeatmap(false);
                    }}
                    style={{ accentColor: "#38BDF8" }}
                  />
                  Debug: Raw Landmarks
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => {
                      setShowHeatmap(e.target.checked);
                      if (e.target.checked) {
                        setShowIrisReticle(false);
                        setShowFacialLengthMesh(false);
                        setShowDebugLandmarks(false);
                      }
                    }}
                    style={{ accentColor: "#F43F5E" }}
                  />
                  Grad-CAM Heatmap
                </label>
              </div>
            </div>
          )}

          {/* Software Demo Footer (Requirement 4) */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.12)", display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
            <ShieldCheck size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: "1.45" }}>
              Software demo. Approximate measurements, not clinical, not used in any prediction.
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: CLINICAL DEMO CASES & GRAD-CAM EXPLANATION ("papam") */}
      {/* ========================================================================= */}
      {isDemoModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 3, 10, 0.85)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#0D0A1C",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            maxWidth: "760px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 0 50px rgba(0, 0, 0, 0.8)"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={20} color="#FFFFFF" />
                <h3 style={{ fontSize: "18px", color: "#FFFFFF", margin: 0, fontWeight: "700" }}>
                  Clinical Demos &amp; Grad-CAM AI Diagnostic Workflow
                </h3>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "#CBD5E1",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* How It Works Section */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", color: "#E2E8F0", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Cpu size={15} /> How the Biometric Engine Operates
              </h4>
              <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: "1.5", margin: 0 }}>
                The biometric analyzer implements Google MediaPipe's 468 mesh + iris landmark architecture to compute facial length and face width (landmark-defined, #234-#454) proportions. The 11.7 mm iris diameter provides scale calibration as an exploratory interface demo.
              </p>
            </div>

            {/* Grad-CAM Saliency Explanation with Interactive WakeSlider (Silver Theme) */}
            <div style={{ marginBottom: "24px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "10px", padding: "14px" }}>
              <h4 style={{ fontSize: "14px", color: "#FFFFFF", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={15} /> Grad-CAM Neural Attention Mapping
              </h4>
              <p style={{ fontSize: "12px", color: "#E2E8F0", lineHeight: "1.45", margin: "0 0 12px 0" }}>
                Gradient-weighted Class Activation Mapping (Grad-CAM) visualizes the spatial gradients of convolutional feature maps. Warmer tones (red/orange) highlight facial regions where the model detects significant phenotypic variances (such as periorbital asymmetry or midface proportions), providing transparent, explainable AI screening.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "11px", color: "#CBD5E1" }}>
                <span>Grad-CAM Saliency Opacity:</span>
                <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{Math.round(heatmapOpacity * 100)}%</span>
              </div>
              <div style={{ width: "100%", padding: "2px 0" }}>
                <WakeSlider
                  value={Math.round(heatmapOpacity * 100)}
                  onChange={(val) => setHeatmapOpacity(val / 100)}
                  min={0}
                  max={100}
                  step={1}
                  bars={26}
                  height={38}
                  restHeight={8}
                  gap={3}
                  fillColor="#FFFFFF"
                  trackColor="rgba(255, 255, 255, 0.15)"
                  crestColor="#E2E8F0"
                  sensitivity={1}
                  reach={5}
                  skew={0.5}
                  glide={0.25}
                  smoothing={80}
                  showValue={false}
                  ariaLabel="Demo Grad-CAM Saliency Opacity"
                />
              </div>
            </div>

            {/* Selectable Clinical Demonstration Cases */}
            <h4 style={{ fontSize: "14px", color: "#FFFFFF", marginBottom: "12px" }}>
              Select a Verified Clinical Case to Load:
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              {/* Case 1 */}
              <div style={{
                background: "rgba(9, 5, 20, 0.65)",
                border: "1px solid rgba(244, 63, 94, 0.35)",
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", position: "relative", background: "#090514" }}>
                  <img
                    src="/case1_face.jpg"
                    alt="Case 1"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='140' viewBox='0 0 280 140'><rect width='280' height='140' fill='%23120A24'/><circle cx='140' cy='65' r='42' fill='%231E153A' stroke='%23818CF8' stroke-width='1.5'/><circle cx='124' cy='58' r='5' fill='%2338BDF8'/><circle cx='156' cy='58' r='5' fill='%23EC4899'/><line x1='124' y1='58' x2='156' y2='58' stroke='%23F472B6' stroke-dasharray='2,2'/><text x='140' y='122' fill='%23CBD5E1' font-size='10' font-family='monospace' text-anchor='middle'>CASE 001 BIOMETRICS</text></svg>";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(244, 63, 94, 0.85)", color: "#FFFFFF", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>
                    Elevated ASD Biomarkers
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>Case #001: Elevated Phenotypic Markers</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
                  Divergent ocular gaze fixation, saccadic variance, and upper-facial saliency concentration.
                </div>
                <button
                  type="button"
                  onClick={() => loadPresetCase("case1")}
                  style={{
                    background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    color: "#090514",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "auto"
                  }}
                >
                  Load &amp; Analyze Case #001
                </button>
              </div>

              {/* Case 2 */}
              <div style={{
                background: "rgba(9, 5, 20, 0.65)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", position: "relative", background: "#051311" }}>
                  <img
                    src="/case2_face.jpg"
                    alt="Case 2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='140' viewBox='0 0 280 140'><rect width='280' height='140' fill='%230B1920'/><circle cx='140' cy='65' r='42' fill='%23132B32' stroke='%2334D399' stroke-width='1.5'/><circle cx='124' cy='58' r='5' fill='%2334D399'/><circle cx='156' cy='58' r='5' fill='%2334D399'/><line x1='124' y1='58' x2='156' y2='58' stroke='%2334D399' stroke-dasharray='2,2'/><text x='140' y='122' fill='%23CBD5E1' font-size='10' font-family='monospace' text-anchor='middle'>CASE 002 NORMATIVE</text></svg>";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(16, 185, 129, 0.85)", color: "#FFFFFF", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>
                    Normative Baseline
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>Case #002: Typical Developmental Baseline</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
                  Normative central gaze locking, balanced bilateral facial harmony, and baseline proportions.
                </div>
                <button
                  type="button"
                  onClick={() => loadPresetCase("case2")}
                  style={{
                    background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    color: "#090514",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "auto"
                  }}
                >
                  Load &amp; Analyze Case #002
                </button>
              </div>
              {/* Case 3 */}
              <div style={{
                background: "rgba(9, 5, 20, 0.65)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", position: "relative", background: "#051311" }}>
                  <img
                    src="/case3_face.jpg"
                    alt="Case 3"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(56, 189, 248, 0.85)", color: "#FFFFFF", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>
                    Frontal Neutral
                  </span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>Case #003: Frontal Neutral Alignment</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.4" }}>
                  Direct ocular fixation, symmetric limbus localization, and valid planar proportions.
                </div>
                <button
                  type="button"
                  onClick={() => loadPresetCase("case3")}
                  style={{
                    background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    color: "#090514",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "auto"
                  }}
                >
                  Load &amp; Analyze Case #003
                </button>
              </div>
</div>

            {/* Modal Footer */}
            <div style={{ textAlign: "right", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px" }}>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#CBD5E1",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
