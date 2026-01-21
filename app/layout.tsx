import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Gamepad2, Lock } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AP Gaming Hub",
  description: "Level Up Your Game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        {/* Navbar */}
        <nav className="w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-red-600/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <Gamepad2 className="h-8 w-8 text-red-500 relative z-10" />
                </div>
                <span className="ml-3 text-2xl font-black italic tracking-tighter text-white">
                  AP<span className="text-red-500">GAMING</span>
                </span>
              </Link>

              <div className="hidden md:flex ml-10 items-baseline space-x-1">
                {["Home", "Events", "Reservations", "Roster", "Schedule", "Highscores", "Info"].map((item) => (
                  <Link
                    key={item}
                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="relative px-4 py-2 rounded-lg text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                  >
                    {item}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all group-hover:w-full"></span>
                  </Link>
                ))}
              </div>

              <Link href="/admin" className="text-gray-500 hover:text-white p-2">
                <Lock size={20} />
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
