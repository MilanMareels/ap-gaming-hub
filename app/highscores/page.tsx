"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Medal, Loader2, Trophy, Gamepad2 } from "lucide-react";
import { ScrollReveal } from "../components/ScrollReveal";

export default function HighscoresPage() {
  const [highscores, setHighscores] = useState<any[]>([]);
  const [gamesList, setGamesList] = useState<string[]>([]);

  // State voor actieve game tab
  const [selectedGame, setSelectedGame] = useState<string>("");

  const [form, setForm] = useState({ player: "", score: "", game: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // 1. Highscores ophalen
    const q = query(collection(db, "highscores"), orderBy("score", "desc"));
    const unsubScores = onSnapshot(q, (snap) => setHighscores(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

    // 2. Games lijst ophalen en eerste game selecteren
    const unsubSettings = onDocSnapshot(doc(db, "content", "settings"), (d) => {
      if (d.exists() && d.data().lists?.highscoreGames) {
        const games = d.data().lists.highscoreGames;
        setGamesList(games);

        if (games.length > 0) {
          setSelectedGame(games[0]);
          setForm((f) => ({ ...f, game: games[0] }));
        }
      }
    });

    return () => {
      unsubScores();
      unsubSettings();
    };
  }, []);

  // Update zowel de view (tab) als de data voor het formulier
  const handleGameChange = (game: string) => {
    setSelectedGame(game);
    setForm((prev) => ({ ...prev, game: game }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // We gebruiken hier form.game, die dankzij handleGameChange altijd correct staat
    await addDoc(collection(db, "highscores"), {
      player: form.player,
      score: parseInt(form.score),
      game: form.game,
      status: "pending",
      timestamp: new Date().toISOString(),
    });

    setLoading(false);
    setMsg("Score ingediend! Wacht op goedkeuring.");
    setForm({ player: "", score: "", game: selectedGame });
    setTimeout(() => setMsg(""), 5000);
  };

  const filteredScores = highscores.filter((h: any) => h.status === "approved" && h.game === selectedGame);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <ScrollReveal direction="up">
          <div className="text-center mb-12">
            <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
            <h1 className="text-5xl font-black mb-4">
              HALL OF <span className="text-yellow-500">FAME</span>
            </h1>
            <p className="text-gray-400">Strijd voor eeuwige roem op de campus.</p>
          </div>
        </ScrollReveal>

        {/* --- GAME TABS --- */}
        <ScrollReveal direction="up" delay={100}>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {gamesList.map((game) => (
              <button
                key={game}
                onClick={() => handleGameChange(game)}
                className={`
                            px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 border
                            ${
                              selectedGame === game
                                ? "bg-yellow-500 text-slate-950 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105"
                                : "bg-slate-900 text-gray-400 border-slate-800 hover:border-gray-600 hover:text-white"
                            }
                        `}
              >
                <Gamepad2 size={16} />
                {game}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* --- TABEL --- */}
        <ScrollReveal direction="up" delay={200}>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mb-16 shadow-2xl">
            <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-gray-400 text-sm uppercase tracking-wider">
                Top 10: <span className="text-white">{selectedGame}</span>
              </span>
            </div>

            <table className="w-full text-left">
              <thead className="bg-slate-950 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="p-4 text-center">#</th>
                  <th className="p-4">Player</th>
                  <th className="p-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredScores.length > 0 ? (
                  filteredScores.slice(0, 10).map((score, idx) => (
                    <tr key={score.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-center font-black text-xl w-16">
                        {idx === 0 ? (
                          <Medal className="text-yellow-400 inline" />
                        ) : idx === 1 ? (
                          <Medal className="text-gray-300 inline" />
                        ) : idx === 2 ? (
                          <Medal className="text-amber-600 inline" />
                        ) : (
                          idx + 1
                        )}
                      </td>
                      <td className="p-4 font-bold">{score.player}</td>
                      <td className="p-4 text-right font-mono text-yellow-500 text-lg">{score.score.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      Nog geen scores voor {selectedGame}. Wees de eerste!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        {/* --- FORMULIER --- */}
        <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-2xl border border-slate-800">
          {/* De titel maakt duidelijk voor welke game je indient */}
          <h3 className="text-2xl font-bold mb-6 text-center">
            Nieuwe Score voor <span className="text-yellow-500">{selectedGame}</span>?
          </h3>

          {msg && <div className="bg-green-500/10 text-green-400 p-3 rounded mb-4 text-center text-sm">{msg}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              type="text"
              placeholder="Gamertag"
              value={form.player}
              onChange={(e) => setForm({ ...form, player: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none focus:border-yellow-500 transition-colors"
            />
            {/* Game selectie veld is hier verwijderd */}
            <input
              required
              type="number"
              placeholder="Score"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none font-mono focus:border-yellow-500 transition-colors"
            />
            <button disabled={loading} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold text-white flex justify-center transition-colors shadow-lg shadow-red-900/20">
              {loading ? <Loader2 className="animate-spin" /> : "Verstuur Score"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
