import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Gamepad2, Lock } from "lucide-react";
import Navbar from "./components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AP Gaming Hub",
  description: "Level Up Your Game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-950 text-white`}>
        <Navbar />

        {children}
      </body>
    </html>
  );
}
