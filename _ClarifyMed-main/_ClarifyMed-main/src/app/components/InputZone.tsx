import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  Upload,
  Mic,
  FileText,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Globe2,
} from "lucide-react";

const LANGUAGES = [
  { code: "he", label: "Hebrew", native: "עברית", flag: "🇮🇱" },
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ru", label: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "am", label: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
];

interface DropZoneProps {
  type: "document" | "audio";
  file: File | null;
  onFile: (file: File | null) => void;
}

function DropZone({ type, file, onFile }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDocument = type === "document";
  const accept = isDocument ? ".pdf,.txt,.jpg,.jpeg,.png,.webp" : ".mp3,.wav,.m4a,.ogg,.webm";
  const Icon = isDocument ? FileText : Mic;
  const UploadIcon = isDocument ? Upload : Volume2;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFile(selected);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
        ${isDragging
          ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
          : file
          ? "border-teal-400 bg-teal-50/60"
          : "border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md"
        }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none rounded-2xl
        ${isDragging ? "opacity-100" : "opacity-0"}
        bg-gradient-to-br from-blue-100/40 to-teal-100/40`}
      />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      <div className="p-7 flex flex-col items-center text-center gap-4 relative z-10">
        {/* Icon cluster */}
        <div className="relative">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300
              ${file
                ? "bg-gradient-to-br from-teal-400 to-teal-600"
                : isDragging
                ? "bg-gradient-to-br from-blue-400 to-blue-600"
                : "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
              }`}
          >
            {file ? (
              <CheckCircle2 className="w-7 h-7 text-white" />
            ) : (
              <Icon
                className={`w-7 h-7 ${isDragging ? "text-white" : "text-blue-500"}`}
              />
            )}
          </div>
          {!file && (
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
                ${isDragging ? "bg-blue-600" : "bg-blue-500"} shadow-md`}
            >
              <UploadIcon className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Text */}
        {file ? (
          <div className="flex flex-col gap-1">
            <span className="text-teal-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              ✓ File Ready
            </span>
            <span className="text-slate-500 truncate max-w-44" style={{ fontSize: "0.75rem" }}>
              {file.name}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="mt-1 text-red-400 hover:text-red-600 transition-colors"
              style={{ fontSize: "0.7rem", fontWeight: 500 }}
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span
              className="text-slate-700"
              style={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3 }}
            >
              {isDocument
                ? "Upload Medical Summary"
                : "Upload Voice Recording"}
            </span>
            <span className="text-slate-500" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
              {isDocument
                ? "PDF, Text, or Photo"
                : "MP3, WAV, M4A, OGG"}
            </span>
            <span
              className={`px-3 py-1 rounded-full mt-1 self-center transition-colors duration-200
                ${isDragging
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 text-blue-600"
                }`}
              style={{ fontSize: "0.72rem", fontWeight: 600 }}
            >
              {isDragging ? "Drop it here!" : "Drag & drop or click to browse"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface InputZoneProps {
  docFile: File | null;
  setDocFile: (f: File | null) => void;
  audioFile: File | null;
  setAudioFile: (f: File | null) => void;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
}

export function InputZone({
  docFile,
  setDocFile,
  audioFile,
  setAudioFile,
  selectedLang,
  setSelectedLang,
}: InputZoneProps) {
  const [isLangOpen, setIsLangOpen] = useState(false);

  const selectedLangData = LANGUAGES.find((l) => l.code === selectedLang);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <Globe2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-blue-600" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              STEP 1 OF 2 — INPUT YOUR INFORMATION
            </span>
          </div>
          <h2
            className="text-slate-800 mb-3"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}
          >
            Upload & Configure Your Preferences
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            Provide your medical documents and choose your preferred language for the personalized video.
          </p>
        </motion.div>

        <div className="flex flex-col gap-8">
          {/* Language Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-sm"
          >
            <label
              className="flex items-center gap-2 text-slate-700 mb-3"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              <Globe2 className="w-4 h-4 text-blue-500" />
              Select Language for Video &amp; Subtitles
              <span className="text-red-400" style={{ fontSize: "0.75rem" }}>*</span>
            </label>

            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 bg-white transition-all duration-200
                  ${isLangOpen
                    ? "border-blue-500 shadow-md shadow-blue-100 ring-4 ring-blue-50"
                    : selectedLang
                    ? "border-teal-400 shadow-sm"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
              >
                <span className="flex items-center gap-3">
                  {selectedLangData ? (
                    <>
                      <span style={{ fontSize: "1.25rem" }}>{selectedLangData.flag}</span>
                      <span className="text-slate-800" style={{ fontWeight: 500 }}>
                        {selectedLangData.label}
                      </span>
                      <span className="text-slate-400" style={{ fontSize: "0.8rem" }}>
                        {selectedLangData.native}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">Choose your preferred language...</span>
                  )}
                </span>
                <motion.div animate={{ rotate: isLangOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </button>

              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-white border border-blue-100 rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  {LANGUAGES.map((lang, i) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang.code); setIsLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                        ${i !== LANGUAGES.length - 1 ? "border-b border-slate-50" : ""}
                        ${selectedLang === lang.code
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-slate-50 text-slate-700"
                        }`}
                    >
                      <span style={{ fontSize: "1.25rem" }}>{lang.flag}</span>
                      <span style={{ fontWeight: 500 }}>{lang.label}</span>
                      <span className="text-slate-400 ml-auto" style={{ fontSize: "0.8rem" }}>
                        {lang.native}
                      </span>
                      {selectedLang === lang.code && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Dual Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-50/50 to-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-5">
              <Upload className="w-4 h-4 text-blue-500" />
              <span className="text-slate-700" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                Upload Your Files
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <DropZone type="document" file={docFile} onFile={setDocFile} />
              <DropZone type="audio" file={audioFile} onFile={setAudioFile} />
            </div>

            {/* Note */}
            <div className="mt-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>Flexible upload: </span>
                You can upload one file, both, or any combination. Our AI will work with whatever you provide.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
