"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = document.cookie.split("; ").some((row) => row.startsWith("cookie-consent="));
    if (!hasConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    const date = new Date();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dagen.
    const expires = "; expires=" + date.toUTCString();

    document.cookie = "cookie-consent=true" + expires + "; path=/; SameSite=Lax";

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-slate-900/95 backdrop-blur-md border border-red-500/20 p-6 rounded-2xl shadow-2xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="flex items-start gap-4">
        <div className="bg-red-500/10 p-3 rounded-full shrink-0">
          <Cookie className="text-red-500" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg mb-1">Cookies & Privacy</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            We gebruiken cookies om je voorkeuren op te slaan. Lees meer in ons{" "}
            <Link href="/privacy" className="text-red-500 hover:underline font-medium">
              privacybeleid
            </Link>
            .
          </p>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <button onClick={handleAccept} className="w-full bg-white text-slate-950 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
        Accepteren
      </button>
    </div>
  );
}
