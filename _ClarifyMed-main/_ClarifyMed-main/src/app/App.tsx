import { useState } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { InputZone } from "./components/InputZone";
import { ActionButton } from "./components/ActionButton";
import { FooterSection } from "./components/FooterSection";
import { HowItWorks } from "./components/HowItWorks";

const HERO_IMG = "https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9uJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3Nzk3NDA3MHww&ixlib=rb-4.1.0&q=80&w=1080";
const AVATAR_IMG = "https://images.unsplash.com/photo-1695624825373-3e1f01204f5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwYXZhdGFyJTIwQUklMjB0ZWNobm9sb2d5JTIwZGlnaXRhbHxlbnwxfHx8fDE3Nzc5NzQwNzl8MA&ixlib=rb-4.1.0&q=80&w=1080";

export default function App() {
  const [docFile, setDocFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <HeroSection heroImageUrl={HERO_IMG} avatarImageUrl={AVATAR_IMG} />
        <HowItWorks />
        <InputZone
          docFile={docFile}
          setDocFile={setDocFile}
          audioFile={audioFile}
          setAudioFile={setAudioFile}
          selectedLang={selectedLang}
          setSelectedLang={setSelectedLang}
        />
        <ActionButton
          docFile={docFile}
          audioFile={audioFile}
          selectedLang={selectedLang}
          result={result}
          setResult={setResult}
          error={error}
          setError={setError}
        />
      </main>
      <FooterSection />
    </div>
  );
}
