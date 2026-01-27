import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://theeyeopener.com/wp-content/uploads/2022/09/Redbullgaminghub_vkauk_sept22.jpeg" alt="Gaming Background" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/20 via-slate-950/60 to-slate-950"></div>
      </div>

      <div className="container mx-auto px-4 z-10 text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
          <span className="text-red-600">AP</span> GAMING HUB
        </h1>
        <div className="flex justify-center gap-4">
          <Link href="/reservations" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all">
            Reserveer
          </Link>
          <Link href="/roster" className="bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-700">
            Bekijk openings uren
          </Link>
        </div>
      </div>
    </div>
  );
}
