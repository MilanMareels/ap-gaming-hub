import { Shield, MessageCircle, MapPin } from "lucide-react";

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-24 px-4 text-white">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-5xl font-black mb-12 text-center">
          COMMUNITY <span className="text-red-600">INFO</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#5865F2] p-8 rounded-3xl flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer">
            <MessageCircle size={64} className="text-white mb-4" />
            <h2 className="text-3xl font-bold mb-2">Join Discord</h2>
            <p className="text-white/80 mb-6">Chat met andere studenten, vind teammates en blijf op de hoogte.</p>
            <a href="https://discord.gg/JOUW_LINK" target="_blank" className="bg-white text-[#5865F2] px-8 py-3 rounded-full font-bold">
              Join Server
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="text-red-500" /> Huisregels
            </h3>
            <ul className="space-y-3 text-gray-400 list-disc pl-5">
              <li>
                Eten en drinken is <strong>verboden</strong> bij de apparatuur.
              </li>
              <li>Respecteer de reservatietijden.</li>
              <li>Toxic gedrag wordt niet getolereerd.</li>
              <li>Log uit na gebruik van PC/Console.</li>
            </ul>
          </div>
        </div>

        {/* FAQ component kan hier hergebruikt worden uit je oude code */}
      </div>
    </div>
  );
}
