import { motion } from "motion/react";
import { Upload, Languages, Video, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Files",
    description:
      "Upload your medical summary as a PDF, photo, or text document. Optionally add a voice recording for richer context.",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    iconColor: "text-blue-500",
  },
  {
    step: "02",
    icon: Languages,
    title: "Choose Your Language",
    description:
      "Select from Hebrew, English, Russian, Arabic, or Amharic. The video and subtitles will be generated in your chosen language.",
    color: "from-teal-400 to-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    iconColor: "text-teal-500",
  },
  {
    step: "03",
    icon: Video,
    title: "Receive Your Video",
    description:
      "A virtual doctor avatar explains your results clearly and simply — as if speaking directly to you, in your language.",
    color: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconColor: "text-emerald-500",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-slate-800 mb-3"
            style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 700, lineHeight: 1.2 }}
          >
            How It Works
          </h2>
          <p className="text-slate-500 max-w-md mx-auto" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            Three simple steps to understanding your medical results.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-blue-200 via-teal-200 to-emerald-200 z-0" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative z-10"
            >
              <div
                className={`${step.bg} border ${step.border} rounded-2xl p-6 flex flex-col gap-4 h-full shadow-sm hover:shadow-md transition-shadow duration-300`}
              >
                {/* Step number + icon */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className="text-slate-200 select-none"
                    style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}
                  >
                    {step.step}
                  </span>
                </div>

                <div>
                  <h3
                    className="text-slate-800 mb-2"
                    style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.3 }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-slate-500" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {step.description}
                  </p>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="md:hidden flex justify-center mt-2">
                    <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
