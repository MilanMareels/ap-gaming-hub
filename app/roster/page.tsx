"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "lucide-react";
import { ScrollReveal } from "../components/ScrollReveal";

export default function RosterPage() {
  const [rosters, setRosters] = useState<any>({});
  const [games, setGames] = useState<string[]>([]);
  const [activeGame, setActiveGame] = useState("");

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "content", "settings"), (d) => {
      if (d.exists() && d.data().lists?.rosterGames) {
        setGames(d.data().lists.rosterGames);
        if (!activeGame) setActiveGame(d.data().lists.rosterGames[0]);
      }
    });
    const unsubRosters = onSnapshot(doc(db, "content", "rosters"), (d) => {
      if (d.exists()) setRosters(d.data().data);
    });

    return () => {
      unsubSettings();
      unsubRosters();
    };
  }, [activeGame]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-24 px-4">
      <div className="container mx-auto">
        <ScrollReveal direction="up">
          <h1 className="text-5xl font-black text-center mb-4">
            TEAM <span className="text-red-600">ROSTERS</span>
          </h1>
          <p className="text-gray-400 text-center mb-12">Onze competitieve studenten.</p>
        </ScrollReveal>

        {/* Tabs */}
        <div className="flex justify-center flex-wrap gap-4 mb-12">
          {games.map((game) => (
            <button
              key={game}
              onClick={() => setActiveGame(game)}
              className={`px-6 py-3 rounded-full font-bold transition-all border ${
                activeGame === game ? "bg-red-600 border-red-500 text-white" : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white"
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,16rem)] justify-center gap-6 max-w-380 mx-auto">
          {(rosters[activeGame] || []).length === 0 ? (
            <div className="col-span-full text-center text-gray-500 italic">Geen spelers in dit team.</div>
          ) : (
            (rosters[activeGame] || []).map((player: any, idx: number) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 50}>
                <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-red-500/50 hover:-translate-y-2 transition-all group text-center flex flex-col justify-between">
                  <div>
                    <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-red-600/20 group-hover:text-red-500 transition-colors">
                      <User size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white truncate px-2" title={player.handle}>
                      {player.handle}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 truncate">{player.name}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs p-2 bg-slate-950 rounded border border-slate-800/50">
                      <span className="text-gray-400">Role</span>
                      <span className="font-bold truncate max-w-25 text-right">{player.role}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 bg-slate-950 rounded border border-slate-800/50">
                      <span className="text-gray-400">Rank</span>
                      <span className="font-bold text-red-500 truncate max-w-25 text-right">{player.rank}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
