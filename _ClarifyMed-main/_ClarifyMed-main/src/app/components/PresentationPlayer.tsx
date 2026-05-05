import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, FileText,
  ClipboardList, Stethoscope, Pill, CalendarCheck, BedDouble,
  HeartPulse, Activity, Info, Captions, CaptionsOff,
  FlaskConical, TestTube2, Bandage, Maximize2, Minimize2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────

interface Keyword {
  word: string;
  image_prompt: string;
  image: string | null;
}

interface SummaryItem {
  label: string;
  value: string;
  type: "medication" | "diagnosis" | "referral" | "test" | "sick_leave" | "other";
}

export interface Slide {
  title: string;
  icon: string;
  content: string;
  keywords: Keyword[];
  is_summary: boolean;
  summary_items: SummaryItem[];
  audio: string | null;
  audio_mime: string | null;
}

interface PresentationPlayerProps {
  slides: Slide[];
  language: string;
  onClose: () => void;
}

// ── Constants ────────────────────────────────────────────────────

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  "clipboard-list": ClipboardList,
  "stethoscope":    Stethoscope,
  "pill":           Pill,
  "calendar-check": CalendarCheck,
  "bed":            BedDouble,
  "heart-pulse":    HeartPulse,
  "activity":       Activity,
  "info":           Info,
};

const STYLES: Record<string, { gradient: string; shadow: string; light: string }> = {
  "clipboard-list": { gradient: "from-blue-500 via-blue-600 to-indigo-700",    shadow: "shadow-blue-400/40",    light: "from-blue-50 to-indigo-50"   },
  "stethoscope":    { gradient: "from-teal-500 via-teal-600 to-cyan-700",      shadow: "shadow-teal-400/40",    light: "from-teal-50 to-cyan-50"     },
  "pill":           { gradient: "from-emerald-500 via-green-600 to-teal-700",  shadow: "shadow-emerald-400/40", light: "from-emerald-50 to-teal-50"  },
  "calendar-check": { gradient: "from-violet-500 via-indigo-600 to-blue-700",  shadow: "shadow-violet-400/40",  light: "from-violet-50 to-indigo-50" },
  "bed":            { gradient: "from-purple-500 via-fuchsia-600 to-pink-700", shadow: "shadow-purple-400/40",  light: "from-purple-50 to-pink-50"   },
  "heart-pulse":    { gradient: "from-rose-500 via-red-600 to-orange-700",     shadow: "shadow-rose-400/40",    light: "from-rose-50 to-orange-50"   },
  "activity":       { gradient: "from-orange-500 via-amber-600 to-yellow-600", shadow: "shadow-orange-400/40",  light: "from-orange-50 to-amber-50"  },
  "info":           { gradient: "from-slate-500 via-slate-600 to-zinc-700",    shadow: "shadow-slate-400/40",   light: "from-slate-50 to-zinc-50"    },
};
const DEFAULT_STYLE = STYLES["info"];

const SUMMARY_TYPE_META: Record<string, { label: string; Icon: React.FC<{ className?: string }>; color: string }> = {
  medication: { label: "Medications", Icon: Pill,        color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  diagnosis:  { label: "Diagnoses",   Icon: Stethoscope, color: "text-blue-600 bg-blue-50 border-blue-200"         },
  referral:   { label: "Referrals",   Icon: Bandage,     color: "text-violet-600 bg-violet-50 border-violet-200"   },
  test:       { label: "Lab Tests",   Icon: TestTube2,   color: "text-amber-600 bg-amber-50 border-amber-200"      },
  sick_leave: { label: "Sick Leave",  Icon: BedDouble,   color: "text-rose-600 bg-rose-50 border-rose-200"         },
  other:      { label: "Other Notes", Icon: Info,        color: "text-slate-600 bg-slate-50 border-slate-200"      },
};

const TYPE_ORDER = ["medication", "diagnosis", "referral", "test", "sick_leave", "other"] as const;

const SUBTITLE_HINTS: Record<string, string> = {
  he: "▶ הפעל אודיו להצגת כתוביות",
  en: "▶ Play audio to show subtitles",
  ru: "▶ Воспроизведите аудио для субтитров",
  ar: "▶ شغّل الصوت لعرض الترجمة",
  am: "▶ ንኡስ ርዕሶች ለማሳየት ድምፁን ያጫውቱ",
};

// ── Sub-components ───────────────────────────────────────────────

function KeywordCard({ kw, isRTL, fullscreen }: { kw: Keyword; isRTL: boolean; fullscreen?: boolean }) {
  // Responsive fixed height — grows with viewport but stays bounded.
  // Never tied to card width, so single-card layouts don't produce giant images.
  const imgHeight = fullscreen
    ? "clamp(200px, 36vh, 440px)"
    : "clamp(140px, 18vw, 240px)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white shadow-md min-w-0"
    >
      <div
        className="w-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0"
        style={{ height: imgHeight }}
      >
        {kw.image ? (
          <img
            src={`data:image/jpeg;base64,${kw.image}`}
            alt={kw.word}
            className="w-full h-full object-cover"
          />
        ) : (
          <FlaskConical className="w-10 h-10 text-slate-300" />
        )}
      </div>
      <div className="px-3 py-2.5 text-center w-full flex-shrink-0" dir={isRTL ? "rtl" : "ltr"}>
        <p className="text-slate-700 font-semibold leading-tight" style={{ fontSize: "0.82rem" }}>
          {kw.word}
        </p>
      </div>
    </motion.div>
  );
}

function SummarySlideContent({ items, isRTL, fill }: { items: SummaryItem[]; isRTL: boolean; fill?: boolean }) {
  const grouped: Partial<Record<string, SummaryItem[]>> = {};
  for (const item of items) {
    const t = item.type || "other";
    if (!grouped[t]) grouped[t] = [];
    grouped[t]!.push(item);
  }
  const sections = TYPE_ORDER.filter(t => grouped[t]?.length);

  if (sections.length === 0) {
    return (
      <div className="px-8 py-10 text-center text-slate-400" style={{ fontSize: "0.9rem" }}>
        No specific items to summarize.
      </div>
    );
  }

  return (
    <div
      className="px-6 py-6 flex flex-col gap-5 overflow-y-auto"
      style={fill ? { flex: 1 } : { maxHeight: 380 }}
    >
      {sections.map(type => {
        const meta = SUMMARY_TYPE_META[type];
        const SIcon = meta.Icon;
        return (
          <div key={type}>
            <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded-xl border w-fit ${meta.color}`} dir={isRTL ? "rtl" : "ltr"}>
              <SIcon className="w-4 h-4 flex-shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wide">{meta.label}</span>
            </div>
            <div className="flex flex-col gap-2">
              {grouped[type]!.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="flex items-start gap-3 bg-white/70 rounded-xl px-4 py-3 border border-white shadow-sm"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 leading-tight" style={{ fontSize: "0.88rem" }}>
                      {item.label}
                    </p>
                    {item.value && (
                      <p className="text-slate-500 mt-0.5 leading-snug" style={{ fontSize: "0.78rem" }}>
                        {item.value}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function PresentationPlayer({ slides, language, onClose }: PresentationPlayerProps) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isPlayingRef = useRef(false);

  // ── Fullscreen ──────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  // ── Seek bar (click + drag) ─────────────────────────────────────
  const seekTo = (clientX: number) => {
    const bar = seekBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = fraction * audio.duration;
    setProgress(fraction);
  };

  const onSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasAudio) return;
    isDragging.current = true;
    seekBarRef.current?.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  };

  const onSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) seekTo(e.clientX);
  };

  const onSeekPointerUp = () => { isDragging.current = false; };

  // ── Derived values ──────────────────────────────────────────────
  const slide = slides[current];
  const style = STYLES[slide?.icon] ?? DEFAULT_STYLE;
  const Icon = ICONS[slide?.icon] ?? Info;
  const isRTL = language === "he" || language === "ar";
  const hasAudio = !!slide?.audio;
  const isSummary = !!slide?.is_summary;
  const keywords: Keyword[] = slide?.keywords ?? [];
  const padNum = (n: number) => String(n).padStart(2, "0");

  const CHUNK_SIZE = 7;
  const subtitleWords = slide?.content?.split(" ") ?? [];

  const currentWordIndex = (isPlaying || progress > 0)
    ? Math.min(Math.floor(progress * subtitleWords.length), subtitleWords.length - 1)
    : -1;

  const currentChunkIndex = currentWordIndex >= 0
    ? Math.floor(currentWordIndex / CHUNK_SIZE)
    : -1;

  const subtitleText = currentChunkIndex >= 0
    ? subtitleWords.slice(currentChunkIndex * CHUNK_SIZE, (currentChunkIndex + 1) * CHUNK_SIZE).join(" ")
    : "";

  // ── Audio sync ──────────────────────────────────────────────────
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(0);
    if (slide?.audio) {
      const mime = slide.audio_mime || "audio/wav";
      audio.src = `data:${mime};base64,${slide.audio}`;
      audio.load();
      if (isPlayingRef.current) audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.src = "";
    }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((index: number, direction = 1) => {
    if (index < 0 || index >= slides.length) return;
    audioRef.current?.pause();
    setDir(direction);
    setCurrent(index);
    setProgress(0);
  }, [slides.length]);

  const handleEnded = useCallback(() => {
    if (current < slides.length - 1) {
      setDir(1);
      setCurrent(c => c + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      setProgress(1);
    }
  }, [current, slides.length]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
  };

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`overflow-hidden ${isFullscreen ? "flex flex-col" : "mt-8 rounded-3xl shadow-2xl border border-white/60"}`}
      style={isFullscreen ? { height: "100vh" } : {}}
    >
      <audio
        ref={audioRef}
        muted={muted}
        onEnded={handleEnded}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a?.duration && !isDragging.current) setProgress(a.currentTime / a.duration);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => { if (!audioRef.current?.ended) setIsPlaying(false); }}
      />

      {/* ── HERO ZONE ──────────────────────────────────────────── */}
      <div
        className={`relative bg-gradient-to-br ${style.gradient} overflow-hidden flex-shrink-0`}
        style={{ minHeight: isFullscreen ? 200 : 260 }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-sm" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/10 blur-sm" />
        <div className="absolute inset-y-0 right-0 flex items-center pr-8 opacity-[0.08] pointer-events-none select-none">
          <Icon className="w-64 h-64 text-white" />
        </div>

        <div
          className="relative z-10 flex flex-col justify-between p-7"
          style={{ minHeight: isFullscreen ? 200 : 260 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > current ? 1 : -1)}
                  className={`rounded-full bg-white transition-all duration-300
                    ${i === current ? "w-8 h-2.5 opacity-100" : "w-2.5 h-2.5 opacity-40 hover:opacity-70"}`}
                />
              ))}
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl transition-all border border-white/20"
              style={{ fontSize: "0.75rem", fontWeight: 500 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Back to text
            </button>
          </div>

          {/* Bottom: icon + title + counter */}
          <div className="flex items-end justify-between gap-6 mt-6">
            <div className="flex flex-col gap-3" dir={isRTL ? "rtl" : "ltr"}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`icon-${current}`}
                  initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
                  className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl flex items-center justify-center"
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait" custom={dir}>
                <motion.h3
                  key={`title-${current}`}
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35 }}
                  className="text-white"
                  style={{ fontSize: "clamp(1.3rem, 4vw, 2rem)", fontWeight: 800, lineHeight: 1.15, textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
                >
                  {slide?.title}
                </motion.h3>
              </AnimatePresence>
            </div>

            <div className="flex-shrink-0 text-right select-none" style={{ opacity: 0.9 }}>
              <div className="text-white font-black" style={{ fontSize: "3rem", lineHeight: 1 }}>
                {padNum(current + 1)}
              </div>
              <div className="text-white/60 font-semibold" style={{ fontSize: "0.95rem" }}>
                / {padNum(slides.length)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ZONE ───────────────────────────────────────── */}
      {/*
        In fullscreen: position:relative on the zone + position:absolute inset-0 on the animated
        child solves the AnimatePresence flex-height problem (both entering+exiting elements
        overlay each other instead of competing for flex space).
      */}
      <div
        className={`bg-gradient-to-br ${style.light}`}
        style={isFullscreen ? { flex: 1, minHeight: 0, position: "relative" } : {}}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={`content-${current}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: "easeOut" }}
            style={isFullscreen
              ? { position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }
              : {}}
          >
            {isSummary ? (
              <SummarySlideContent items={slide?.summary_items ?? []} isRTL={isRTL} fill={isFullscreen} />
            ) : keywords.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.5rem",
                  ...(isFullscreen ? { flex: 1, minHeight: 0 } : {}),
                }}
              >
                {/* Each card is capped at 260px wide — single cards won't stretch full width */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(keywords.length, 4)}, minmax(0, 340px))`,
                    justifyContent: "center",
                    gap: "1rem",
                    width: "100%",
                  }}
                >
                  {keywords.map((kw, i) => (
                    <KeywordCard key={i} kw={kw} isRTL={isRTL} fullscreen={isFullscreen} />
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "2rem 2.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(isFullscreen ? { flex: 1 } : {}),
                }}
              >
                <p
                  className="text-slate-700"
                  dir={isRTL ? "rtl" : "ltr"}
                  style={{
                    fontSize: isFullscreen ? "1.3rem" : "1.05rem",
                    lineHeight: 2,
                    textAlign: isRTL ? "right" : "left",
                    maxWidth: "700px",
                  }}
                >
                  {slide?.content}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── SUBTITLE BAR ───────────────────────────────────────── */}
      <AnimatePresence>
        {showSubtitles && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-black/85 backdrop-blur-sm flex-shrink-0"
          >
            <div className="px-8 py-4 min-h-[56px] flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${current}-chunk-${currentChunkIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-white text-center"
                  style={{
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    fontWeight: 500,
                    letterSpacing: isRTL ? "0.01em" : "0.02em",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    textAlign: isRTL ? "right" : "center",
                  }}
                >
                  {subtitleText || (SUBTITLE_HINTS[language] ?? SUBTITLE_HINTS["en"])}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTROLS ───────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${style.light} px-6 pb-7 pt-5 flex-shrink-0`}>

        {/* Seek bar — click or drag to seek */}
        <div
          ref={seekBarRef}
          onPointerDown={onSeekPointerDown}
          onPointerMove={onSeekPointerMove}
          onPointerUp={onSeekPointerUp}
          onPointerCancel={onSeekPointerUp}
          className={`relative h-3 rounded-full mb-6 group ${hasAudio ? "cursor-pointer" : "cursor-default"}`}
          style={{ background: "rgba(0,0,0,0.1)" }}
        >
          {/* Filled track */}
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${style.gradient} rounded-full`}
            style={{ width: `${progress * 100}%`, transition: isDragging.current ? "none" : "width 0.15s linear" }}
          />
          {/* Draggable thumb */}
          {hasAudio && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 opacity-0 group-hover:opacity-100 transition-opacity`}
              style={{
                left: `${progress * 100}%`,
                transform: "translate(-50%, -50%)",
                borderColor: "currentColor",
                boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
              }}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => goTo(current - 1, -1)}
            disabled={current === 0}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/70 disabled:opacity-20 transition-all shadow-sm"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <motion.button
            onClick={togglePlay}
            disabled={!hasAudio}
            whileHover={hasAudio ? { scale: 1.1 } : {}}
            whileTap={hasAudio ? { scale: 0.93 } : {}}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
              ${hasAudio
                ? `bg-gradient-to-br ${style.gradient} text-white shadow-xl ${style.shadow}`
                : "bg-white/50 text-slate-300 cursor-not-allowed shadow-sm"
              }`}
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </motion.button>

          <button
            onClick={() => goTo(current + 1, 1)}
            disabled={current === slides.length - 1}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/70 disabled:opacity-20 transition-all shadow-sm"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMuted(m => !m)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/70 transition-all shadow-sm ml-2"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSubtitles(s => !s)}
            title={showSubtitles ? "Hide subtitles" : "Show subtitles"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm
              ${showSubtitles
                ? `bg-gradient-to-br ${style.gradient} text-white shadow-md`
                : "text-slate-500 hover:text-slate-800 hover:bg-white/70"
              }`}
          >
            {showSubtitles ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/70 transition-all shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        {!hasAudio && (
          <p className="text-center text-slate-400 mt-4" style={{ fontSize: "0.72rem" }}>
            Audio unavailable — add GEMINI_API_KEY to .env to enable narration
          </p>
        )}
      </div>
    </motion.div>
  );
}
