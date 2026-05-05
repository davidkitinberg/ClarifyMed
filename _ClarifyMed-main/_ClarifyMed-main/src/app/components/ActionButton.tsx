import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, Video, ArrowRight, Loader,
  AlertCircle, RefreshCw, Film,
} from "lucide-react";
import { PresentationPlayer, type Slide } from "./PresentationPlayer";

interface ActionButtonProps {
  docFile: File | null;
  audioFile: File | null;
  selectedLang: string;
  result: string;
  setResult: (r: string) => void;
  error: string;
  setError: (e: string) => void;
}

type Stage = "idle" | "processing" | "building" | "ready";

export function ActionButton({
  docFile,
  audioFile,
  selectedLang,
  setResult,
  error,
  setError,
}: ActionButtonProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [slides, setSlides] = useState<Slide[]>([]);

  const reset = () => {
    setStage("idle");
    setSlides([]);
    setResult("");
    setError("");
  };

  const handleClick = async () => {
    if (stage === "processing" || stage === "building") return;

    if (!docFile && !audioFile) {
      setError("Please upload at least one file (document or audio recording).");
      return;
    }
    if (!selectedLang) {
      setError("Please select a language before generating.");
      return;
    }

    setError("");
    setResult("");
    setSlides([]);

    // ── Phase 1: process document → get summary text ──────────────
    setStage("processing");
    let summaryText = "";
    try {
      const formData = new FormData();
      if (docFile) formData.append("document", docFile);
      if (audioFile) formData.append("audio", audioFile);
      formData.append("language", selectedLang);

      const res = await fetch("/api/process", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        setStage("idle");
        return;
      }
      summaryText = data.result;
      setResult(summaryText);
    } catch {
      setError("Connection failed. Make sure the backend server is running on port 5000.");
      setStage("idle");
      return;
    }

    // ── Phase 2: build presentation from summary text ─────────────
    setStage("building");
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summaryText, language: selectedLang }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to generate presentation.");
        setStage("idle");
        return;
      }
      setSlides(data.slides);
      setStage("ready");
    } catch {
      setError("Connection failed while generating presentation.");
      setStage("idle");
    }
  };

  const isLoading = stage === "processing" || stage === "building";

  return (
    <section className="py-12 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-5xl mx-auto px-6">

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-700" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 px-8 py-12 md:px-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-3 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-200" style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em" }}>
                  STEP 2 OF 2 — GENERATE
                </span>
              </div>
              <h2 className="text-white" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 700, lineHeight: 1.2 }}>
                Ready to generate your visual<br className="hidden md:block" /> medical presentation?
              </h2>
              <p className="text-blue-200" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                Our AI will build a narrated slide show from your medical visit — clear, visual, and in your language.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <motion.button
                onClick={handleClick}
                whileHover={!isLoading ? { scale: 1.04, y: -2 } : {}}
                whileTap={!isLoading ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`relative overflow-hidden flex items-center gap-3 px-9 py-5 rounded-2xl shadow-2xl transition-all duration-300
                  ${stage === "ready"
                    ? "bg-gradient-to-r from-teal-400 to-emerald-500"
                    : "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"
                  }`}
                style={{ minWidth: "260px" }}
                disabled={isLoading}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={stage === "idle" ? { x: ["-100%", "200%"] } : { x: "-100%" }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                />
                <AnimatePresence mode="wait">
                  {stage === "idle" && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 relative z-10">
                      <Sparkles className="w-5 h-5 text-white" />
                      <span className="text-white" style={{ fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap" }}>Generate Presentation</span>
                      <ArrowRight className="w-5 h-5 text-white/80" />
                    </motion.div>
                  )}
                  {stage === "processing" && (
                    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 relative z-10">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Loader className="w-5 h-5 text-white" />
                      </motion.div>
                      <span className="text-white" style={{ fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap" }}>Analyzing document...</span>
                    </motion.div>
                  )}
                  {stage === "building" && (
                    <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 relative z-10">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Film className="w-5 h-5 text-white" />
                      </motion.div>
                      <span className="text-white" style={{ fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap" }}>Building slides...</span>
                    </motion.div>
                  )}
                  {stage === "ready" && (
                    <motion.div key="ready" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 relative z-10">
                      <Film className="w-5 h-5 text-white" />
                      <span className="text-white" style={{ fontSize: "1rem", fontWeight: 700, whiteSpace: "nowrap" }}>Generate Again</span>
                      <RefreshCw className="w-4 h-4 text-white/70" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Two-phase progress bar */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-xs">
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full"
                      style={{ width: "45%" }}
                      animate={{ x: ["-100%", "250%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-blue-200 text-center mt-1.5" style={{ fontSize: "0.7rem" }}>
                    {stage === "processing"
                      ? "Step 1/2 — Reading your medical document..."
                      : "Step 2/2 — Generating slides, audio & images..."}
                  </p>
                </motion.div>
              )}

              <p className="text-blue-300" style={{ fontSize: "0.72rem", textAlign: "center" }}>
                🔒 Your data is encrypted and never stored
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700" style={{ fontSize: "0.875rem" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Presentation Player */}
        <AnimatePresence>
          {stage === "ready" && slides.length > 0 && (
            <PresentationPlayer
              slides={slides}
              language={selectedLang}
              onClose={reset}
            />
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
