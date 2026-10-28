import { API_BASE_URL } from './config.js';
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import HowItWorks from "./components/HowItWorks";
import Screening from "./components/Screening";
import Result from "./components/Result";
import VisionLab from "./components/VisionLab";
import Privacy from "./components/Privacy";
import Terms from "./components/Terms";
import NotFound from "./components/NotFound";
import SideRays from "./components/SideRays";
import { QUESTIONS_DB, RAPID_ITEMS_MAP } from "./questionsData";
import { ShieldCheck } from "lucide-react";

const PAGE_TITLES = {
  home: "NeuroScreen AI™ | Clinical Decision Support",
  "how-it-works": "How It Works | Clinical Methodology | NeuroScreen AI™",
  howitworks: "How It Works | Clinical Methodology | NeuroScreen AI™",
  screening: "Clinical Screener | NeuroScreen AI™",
  result: "Screening Assessment Report | NeuroScreen AI™",
  vision: "Vision and Facial Landmark Lab | NeuroScreen AI™",
  privacy: "Security and Privacy Standards | NeuroScreen AI™",
  terms: "Terms of Service and Clinical Ethics | NeuroScreen AI™",
  notfound: "404 Page Not Found | NeuroScreen AI™"
};

function getPageFromPath(path) {
  const clean = path.replace(/^\/+/, "").split("?")[0].split("#")[0].toLowerCase();
  if (!clean || clean === "" || clean === "home") return "home";
  if (clean === "how-it-works" || clean === "howitworks") return "how-it-works";
  if (clean === "screening" || clean === "screener") return "screening";
  if (clean === "vision" || clean === "visionlab" || clean === "vision-lab") return "vision";
  if (clean === "privacy" || clean === "security") return "privacy";
  if (clean === "terms") return "terms";
  return "notfound";
}

export default function App() {
  const [currentPage, setCurrentPageState] = useState(() => {
    return getPageFromPath(window.location.pathname);
  });
  const [selectedCohort, setSelectedCohort] = useState("adult");
  const [screeningMode, setScreeningMode] = useState("standard");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [demographics, setDemographics] = useState({ age: 25, gender: "m", jaundice: "no", family_asd: "no" });
  const [screeningResult, setScreeningResult] = useState(null);
  const [visionBiometrics, setVisionBiometrics] = useState(null);
  const [llmExplanation, setLlmExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  const setCurrentPage = (page, pushHistory = true) => {
    const normalized = page === "howitworks" ? "how-it-works" : page;
    setCurrentPageState(normalized);
    if (pushHistory) {
      const newPath = normalized === "home" ? "/" : `/${normalized}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ page: normalized }, "", newPath);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setCurrentPageState(page);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title = PAGE_TITLES[currentPage] || PAGE_TITLES.home;
  }, [currentPage]);

  const allQuestions = QUESTIONS_DB[selectedCohort] || QUESTIONS_DB.adult;
  const activeQuestions = (screeningMode === "rapid" && RAPID_ITEMS_MAP[selectedCohort])
    ? allQuestions.filter(q => RAPID_ITEMS_MAP[selectedCohort].includes(q.id))
    : allQuestions;

  const handleModeChange = (mode) => {
    setScreeningMode(mode);
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = (val) => {
    const q = activeQuestions[currentQuestionIndex];
    if (!q) return;
    setAnswers((prev) => ({
      ...prev,
      [q.id]: val
    }));
  };

  const startScreening = (cohort) => {
    setSelectedCohort(cohort || "adult");
    setAnswers({});
    setCurrentQuestionIndex(0);
    setScreeningResult(null);
    setVisionBiometrics(null);
    setCurrentPage("screening");
  };

  const handleSubmitScreening = async (latestAnswers = null) => {
    const finalAnswers = (latestAnswers && typeof latestAnswers === "object" && Object.keys(latestAnswers).length > 0)
      ? latestAnswers
      : answers;
    if (latestAnswers && typeof latestAnswers === "object") {
      setAnswers(latestAnswers);
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohort: selectedCohort,
          mode: screeningMode,
          answers: finalAnswers,
          demographics: demographics
        })
      });
      if (res.ok) {
        const data = await res.json();
        setScreeningResult(data);
        setCurrentPage("vision");

        fetch(`${API_BASE_URL}/api/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: data.state,
            cohort: selectedCohort,
            key_traits: data.key_traits_identified
          })
        }).then(r => r.json()).then(exp => setLlmExplanation(exp)).catch(() => {});
      } else {
        throw new Error("Backend offline");
      }
    } catch (e) {
      console.warn("Screening API offline, utilizing client-side triage fallback:", e);
      const totalAnswers = Object.values(finalAnswers);
      const affirmativeCount = totalAnswers.filter(v => v === 1).length;
      let state = "Lower likelihood";
      let badge_variant = "lower";
      let desc = "The reported responses show few elevated indicators for autism spectrum traits compared to normative developmental cohorts.";

      const thresholdHigh = screeningMode === "rapid" ? 3 : 7;
      const thresholdBorder = screeningMode === "rapid" ? 2 : 4;

      if (affirmativeCount >= thresholdHigh) {
        state = "Higher likelihood";
        badge_variant = "higher";
        desc = "The screening responses align with elevated behavioral indicators commonly associated with Autism Spectrum Disorder. A comprehensive developmental consultation is recommended.";
      } else if (affirmativeCount >= thresholdBorder) {
        state = "Please see a specialist (abstain)";
        badge_variant = "abstain";
        desc = "The responses show mixed or borderline indicators where automated screening cannot provide a clear trajectory. A qualified pediatric or neurodevelopmental specialist should conduct a formal observation.";
      }

      setScreeningResult({
        state: state,
        badge_variant: badge_variant,
        state_description: desc,
        confidence_index: affirmativeCount >= thresholdHigh || affirmativeCount < thresholdBorder ? "High" : "Moderate",
        key_traits_identified: activeQuestions.filter(q => answers[q.id] === 1).map(q => ({
          trait_id: q.id,
          description: q.text,
          indicative: true
        })),
        is_rapid_mode: screeningMode === "rapid",
        disclaimer: "Screening support only. Not a diagnosis. Please consult a qualified professional.",
        cohort: selectedCohort
      });
      setCurrentPage("vision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Radiant WebGL SideRays Backdrop (Balanced Silver Chrome - Top Left) */}
      <div className="side-rays-backdrop">
        <SideRays
          speed={1.8}
          rayColor1="#FFFFFF"
          rayColor2="#CBD5E1"
          intensity={2.7}
          spread={2.6}
          origin="top-left"
          tilt={6}
          saturation={0.1}
          blend={0.5}
          falloff={1.15}
          opacity={1.0}
        />
      </div>

      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        startScreening={startScreening}
        selectedCohort={selectedCohort}
      />

      <main className="main-wrapper" id="main-content">
        {currentPage === "home" && <Home startScreening={startScreening} setCurrentPage={setCurrentPage} />}

        {currentPage === "how-it-works" && <HowItWorks setCurrentPage={setCurrentPage} startScreening={startScreening} />}

        {currentPage === "screening" && (
          <Screening
            selectedCohort={selectedCohort}
            activeQuestions={activeQuestions}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            answers={answers}
            handleAnswer={handleAnswer}
            handleSubmitScreening={handleSubmitScreening}
            loading={loading}
            screeningMode={screeningMode}
            setScreeningMode={handleModeChange}
          />
        )}

        {currentPage === "result" && (
          <Result
            screeningResult={screeningResult}
            visionBiometrics={visionBiometrics}
            selectedCohort={selectedCohort}
            startScreening={startScreening}
            setCurrentPage={setCurrentPage}
            llmExplanation={llmExplanation}
          />
        )}

        {currentPage === "vision" && (
          <VisionLab
            screeningResult={screeningResult}
            isSequentialScreening={Boolean(screeningResult)}
            onCompleteVision={(vData) => {
              setVisionBiometrics(vData);
              setCurrentPage("result");
            }}
          />
        )}

        {currentPage === "privacy" && <Privacy setCurrentPage={setCurrentPage} />}

        {currentPage === "terms" && <Terms setCurrentPage={setCurrentPage} startScreening={startScreening} />}

        {!["home", "how-it-works", "screening", "result", "vision", "privacy", "terms"].includes(currentPage) && (
          <NotFound setCurrentPage={setCurrentPage} startScreening={startScreening} />
        )}
      </main>

      <Footer
        setCurrentPage={setCurrentPage}
        startScreening={startScreening}
        selectedCohort={selectedCohort}
      />
    </div>
  );
}
