import Link from "next/link";
import { Gamepad2, CalendarDays } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
      {/* Achtergrond en Hero Content hier plakken uit je oude code */}
      <div className="container mx-auto px-4 z-10 text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
          LEVEL <span className="text-red-600">UP</span>
        </h1>
        <div className="flex justify-center gap-4">
          <Link href="/reservations" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all">
            Reserveer Gear
          </Link>
          <Link href="/roster" className="bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-700">
            Bekijk Teams
          </Link>
        </div>
      </div>
    </div>
  );
}
