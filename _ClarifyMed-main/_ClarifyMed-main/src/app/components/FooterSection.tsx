import { motion } from "motion/react";
import { Shield, Heart, Stethoscope } from "lucide-react";
import clalitLogo from "../../imports/image-1.png";
import maccabiLogo from "../../imports/image-2.png";
import meuhedetLogo from "../../imports/image-3.png";
import leumitLogo from "../../imports/image-4.png";

const HMOs = [
  {
    name: "Clalit",
    bg: "#EBF5FF",
    border: "#BFDBFE",
    image: clalitLogo,
    description: "Clalit Health Services",
    founded: "Est. 1911",
  },
  {
    name: "Maccabi",
    bg: "#EBF5FF",
    border: "#BFDBFE",
    image: maccabiLogo,
    description: "Maccabi Healthcare",
    founded: "Est. 1941",
  },
  {
    name: "Meuhedet",
    bg: "#FFF7ED",
    border: "#FED7AA",
    image: meuhedetLogo,
    description: "Meuhedet Health Fund",
    founded: "Est. 1933",
  },
  {
    name: "Leumit",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    image: leumitLogo,
    description: "Leumit Health Services",
    founded: "Est. 1933",
  },
];

function HMOLogo({ hmo, index }: { hmo: typeof HMOs[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4, scale: 1.03 }}
      className="flex flex-col items-center gap-3 group cursor-pointer"
    >
      <div
        className="w-36 h-20 md:w-44 md:h-24 rounded-2xl border-2 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 px-4"
        style={{ background: "#ffffff", borderColor: hmo.border }}
      >
        <img
          src={hmo.image}
          alt={hmo.name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-slate-700 group-hover:text-slate-900 transition-colors"
          style={{ fontSize: "0.875rem", fontWeight: 700 }}
        >
          {hmo.name}
        </span>
        <span className="text-slate-400" style={{ fontSize: "0.68rem" }}>
          {hmo.founded}
        </span>
      </div>
    </motion.div>
  );
}

export function FooterSection() {
  return (
    <footer className="bg-white border-t border-slate-100">
      {/* Partnership section */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-4">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span
              className="text-green-700"
              style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.05em" }}
            >
              TRUSTED BY ISRAEL'S HEALTH SYSTEM
            </span>
          </div>
          <h2
            className="text-slate-800 mb-3"
            style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)", fontWeight: 700, lineHeight: 1.3 }}
          >
            Works with summaries from Israeli HMOs
          </h2>
          <p className="text-slate-500 max-w-md mx-auto" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
            Seamlessly compatible with medical documents from all four major Israeli health maintenance organizations.
          </p>
        </motion.div>

        {/* HMO logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {HMOs.map((hmo, i) => (
            <HMOLogo key={hmo.name} hmo={hmo} index={i} />
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mt-12 pt-10 border-t border-slate-100"
        >
          {[
            { icon: Shield, text: "HIPAA Compliant", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: Heart, text: "Patient-Centered", color: "text-rose-500", bg: "bg-rose-50" },
            { icon: Stethoscope, text: "Medically Verified", color: "text-teal-500", bg: "bg-teal-50" },
          ].map(({ icon: Icon, text, color, bg }) => (
            <div key={text} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <span className="text-slate-600" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                {text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <Stethoscope className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-600" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              ClarifyMed
            </span>
          </div>
          <p className="text-slate-400 text-center" style={{ fontSize: "0.75rem" }}>
            © 2026 ClarifyMed. All rights reserved. · Empowering patients through medical clarity.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Use"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-slate-400 hover:text-blue-500 transition-colors"
                style={{ fontSize: "0.75rem" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}