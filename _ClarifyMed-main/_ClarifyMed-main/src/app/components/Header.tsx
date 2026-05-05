import { UserCircle, Stethoscope } from "lucide-react";

export function Header() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-blue-700 tracking-tight"
              style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.2 }}
            >
              ClarifyMed
            </span>
            <span
              className="text-slate-400"
              style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.05em" }}
            >
              MEDICAL CLARITY
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {["How It Works", "Languages", "About Us"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Profile */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200 group">
          <UserCircle className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
          <span
            className="text-blue-700 hidden sm:inline"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            My Profile
          </span>
        </button>
      </div>
    </header>
  );
}
