import { motion } from "motion/react";
import { Sparkles, Play, Globe } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HeroSectionProps {
  heroImageUrl: string;
  avatarImageUrl: string;
}

export function HeroSection({ heroImageUrl, avatarImageUrl }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/60 to-teal-50/40 pt-16 pb-20">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-200/25 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-teal-100 border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span
              className="text-teal-700"
              style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em" }}
            >
              AI-Powered Medical Translation
            </span>
          </div>

          {/* Main title */}
          <div>
            <h1
              className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-1"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              ClarifyMed
            </h1>
            <div className="w-16 h-1.5 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full mt-3" />
          </div>

          {/* Sub-headline */}
          <p
            className="text-slate-600 max-w-lg"
            style={{ fontSize: "1.125rem", lineHeight: 1.7, fontWeight: 400 }}
          >
            <span className="text-blue-700" style={{ fontWeight: 600 }}>
              Understand Your Medical Results In Your Language.
            </span>{" "}
            Upload your summary or audio, select a language, and watch a virtual
            doctor explain everything simply via a talking avatar video.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { icon: Globe, text: "5 Languages" },
              { icon: Play, text: "Avatar Video" },
              { icon: Sparkles, text: "AI-Powered" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-100 shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-blue-500" />
                <span
                  className="text-slate-600"
                  style={{ fontSize: "0.8rem", fontWeight: 500 }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative flex justify-center"
        >
          {/* Main image card */}
          <div className="relative w-full max-w-md">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/60">
              <ImageWithFallback
                src={heroImageUrl}
                alt="Medical professional consultation"
                className="w-full h-72 object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent" />
            </div>

            {/* Floating avatar card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-blue-100 p-3 flex items-center gap-3 max-w-52"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                <ImageWithFallback
                  src={avatarImageUrl}
                  alt="AI Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p
                  className="text-slate-800"
                  style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1.2 }}
                >
                  Dr. AI Avatar
                </p>
                <p
                  className="text-teal-600"
                  style={{ fontSize: "0.65rem", fontWeight: 500 }}
                >
                  Ready to explain
                </p>
                <div className="flex gap-0.5 mt-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                      className="w-1 h-2 bg-teal-400 rounded-full origin-bottom"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Stats card */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -top-5 -right-5 bg-white rounded-xl shadow-xl border border-blue-100 px-4 py-3"
            >
              <p
                className="text-blue-700"
                style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}
              >
                5
              </p>
              <p
                className="text-slate-500 mt-0.5"
                style={{ fontSize: "0.65rem", fontWeight: 500 }}
              >
                Languages Supported
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
