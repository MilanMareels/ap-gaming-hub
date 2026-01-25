"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { LogOut, Loader2, Plus, Trash2, Save, Check, Ban, X, Clock } from "lucide-react";

// --- TYPES ---
interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}
interface Highscore {
  id: string;
  game: string;
  player: string;
  score: number;
  status: string;
}
interface Reservation {
  id: string;
  sNumber: string;
  email: string;
  inventory: string;
  date: string;
  startTime: string;
  endTime: string;
}
interface RosterData {
  [game: string]: { name: string; handle: string; role: string; rank: string }[];
}
interface DaySchedule {
  day: string;
  slots: { start: string; end: string; label: string; type: "open" | "team" | "closed" }[];
}

// Standaard weekstructuur
const DEFAULT_WEEK = [
  { day: "Maandag", slots: [] },
  { day: "Dinsdag", slots: [] },
  { day: "Woensdag", slots: [] },
  { day: "Donderdag", slots: [] },
  { day: "Vrijdag", slots: [] },
];

// --- LOGIN COMPONENT ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (u: User) => void }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      onLoginSuccess(cred.user);
    } catch (err: any) {
      setError("Inloggen mislukt: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 w-full max-w-md">
        <h2 className="text-3xl font-black mb-8 text-center text-white">Admin Toegang</h2>
        {error && <div className="text-red-400 text-center mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white" />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white" />
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Aanmelden"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN ADMIN PAGE ---
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("timetable");
  const [loading, setLoading] = useState(true);

  // Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [rosters, setRosters] = useState<RosterData>({});
  const [timetable, setTimetable] = useState<DaySchedule[]>(DEFAULT_WEEK);

  const [settings, setSettings] = useState({ googleFormUrl: "" });
  const [lists, setLists] = useState({ rosterGames: [], highscoreGames: [], eventTypes: [] });

  // Inputs
  // UPDATE: endTime toegevoegd aan state
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", endTime: "", type: "Casual" });
  const [newPlayer, setNewPlayer] = useState({ name: "", handle: "", role: "", rank: "" });
  const [rosterGame, setRosterGame] = useState("");
  const [newListItems, setNewListItems] = useState({ roster: "", highscore: "", event: "" });

  // Auth & Data Fetching
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubEv = onSnapshot(query(collection(db, "events"), orderBy("date")), (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }) as EventItem)));
    const unsubRes = onSnapshot(query(collection(db, "reservations"), orderBy("date", "desc")), (s) => setReservations(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Reservation)));
    const unsubHigh = onSnapshot(query(collection(db, "highscores"), orderBy("score", "desc")), (s) => setHighscores(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Highscore)));
    const unsubRosters = onSnapshot(doc(db, "content", "rosters"), (d) => d.exists() && setRosters(d.data().data));

    const unsubTime = onSnapshot(doc(db, "content", "timetable"), (d) => {
      if (d.exists() && d.data().schedule) {
        const dbSchedule = d.data().schedule;
        const sortedSchedule = DEFAULT_WEEK.map((defDay) => {
          const found = dbSchedule.find((s: DaySchedule) => s.day === defDay.day);
          return found || defDay;
        });
        setTimetable(sortedSchedule);
      } else {
        setTimetable(DEFAULT_WEEK);
      }
    });

    const unsubSet = onSnapshot(doc(db, "content", "settings"), (d) => {
      if (d.exists()) {
        setSettings(d.data().settings || { googleFormUrl: "" });
        setLists(d.data().lists || { rosterGames: [], highscoreGames: [], eventTypes: [] });
        if (d.data().lists?.rosterGames?.length > 0 && !rosterGame) setRosterGame(d.data().lists.rosterGames[0]);
      }
    });

    return () => {
      unsubEv();
      unsubRes();
      unsubHigh();
      unsubRosters();
      unsubTime();
      unsubSet();
    };
  }, [user]);

  // --- Handlers ---

  // UPDATE: Nieuwe logica om Event ook in Timetable te zetten
  const handleAddEvent = async () => {
    // Validatie: check ook endTime
    if (newEvent.title && newEvent.date && newEvent.time && newEvent.endTime && newEvent.type) {
      try {
        // 1. Opslaan in Events Collectie (Lijstweergave)
        await addDoc(collection(db, "events"), {
          title: newEvent.title,
          date: newEvent.date,
          time: `${newEvent.time} - ${newEvent.endTime}`, // Display string
          type: newEvent.type,
        });

        // 2. Automatisch toevoegen aan Weekplanning (Timetable)
        const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
        const dateObj = new Date(newEvent.date);
        const dayName = daysMap[dateObj.getDay()]; // Bv "Vrijdag"

        // Update de lokale en DB state van het rooster
        const updatedTimetable = [...timetable];
        const dayIndex = updatedTimetable.findIndex((d) => d.day === dayName);

        if (dayIndex !== -1) {
          updatedTimetable[dayIndex].slots.push({
            start: newEvent.time,
            end: newEvent.endTime,
            label: `EVENT: ${newEvent.title}`, // Label voor in rooster
            type: "team", // 'team' = Oranje kleur (niet publiek/open)
          });

          // Sorteer slots op tijd
          updatedTimetable[dayIndex].slots.sort((a, b) => a.start.localeCompare(b.start));

          setTimetable(updatedTimetable);
          await setDoc(doc(db, "content", "timetable"), { schedule: updatedTimetable });
        }

        setNewEvent({ title: "", date: "", time: "", endTime: "", type: "Casual" });
        alert("Event toegevoegd aan lijst én weekplanning!");
      } catch (error) {
        console.error("Error:", error);
        alert("Fout bij opslaan.");
      }
    } else {
      alert("Vul aub alle velden in (Titel, Datum, Start- & Eindtijd, Type).");
    }
  };

  const handleAddPlayer = async () => {
    if (newPlayer.handle && rosterGame) {
      const list = rosters[rosterGame] || [];
      await setDoc(doc(db, "content", "rosters"), { data: { ...rosters, [rosterGame]: [...list, newPlayer] } });
      setNewPlayer({ name: "", handle: "", role: "", rank: "" });
    }
  };

  const handleDeletePlayer = async (idx: number) => {
    const list = rosters[rosterGame].filter((_, i) => i !== idx);
    await setDoc(doc(db, "content", "rosters"), { data: { ...rosters, [rosterGame]: list } });
  };

  const updateSettings = async () => {
    await setDoc(doc(db, "content", "settings"), { settings, lists }, { merge: true });
    alert("Instellingen opgeslagen!");
  };

  const saveTimetable = async () => {
    try {
      await setDoc(doc(db, "content", "timetable"), { schedule: timetable });
      alert("Uurrooster succesvol opgeslagen!");
    } catch (error) {
      alert("Fout bij opslaan: " + error);
    }
  };

  // --- List Helpers ---
  const addListItem = (type: "rosterGames" | "highscoreGames" | "eventTypes", val: string) => {
    if (!val) return;
    setLists({ ...lists, [type]: [...lists[type], val] });
  };

  const removeListItem = (type: "rosterGames" | "highscoreGames" | "eventTypes", idx: number) => {
    const l = [...lists[type]];
    l.splice(idx, 1);
    setLists({ ...lists, [type]: l });
  };

  if (loading)
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!user) return <LoginScreen onLoginSuccess={setUser} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">
            ADMIN <span className="text-red-600">PANEL</span>
          </h1>
          <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white flex gap-2">
            <LogOut size={20} /> Uitloggen
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-800 scrollbar-hide">
          {[
            { id: "reservations", label: "Reservaties" },
            { id: "events", label: "Events" },
            { id: "scores", label: "Highscores" },
            { id: "rosters", label: "Teams" },
            { id: "timetable", label: "Openingsuren" },
            { id: "settings", label: "Instellingen" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`capitalize px-6 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${
                activeTab === t.id ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "bg-slate-900 text-gray-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ==================== RESERVATIONS ==================== */}
        {activeTab === "reservations" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Datum</th>
                  <th className="p-4">Tijd</th>
                  <th className="p-4">Item</th>
                  <th className="p-4 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="p-4 font-bold">
                      {r.sNumber}
                      <div className="text-xs text-gray-500 font-normal">{r.email}</div>
                    </td>
                    <td className="p-4">{r.date}</td>
                    <td className="p-4">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${r.inventory === "PC" ? "bg-red-900/30 text-red-400" : "bg-blue-900/30 text-blue-400"}`}>{r.inventory}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => confirm("Verwijderen?") && deleteDoc(doc(db, "reservations", r.id))} className="text-red-500 hover:bg-red-900/20 p-2 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Geen reservaties gevonden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== EVENTS ==================== */}
        {activeTab === "events" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-fit">
              <h3 className="font-bold mb-4">Event Toevoegen & Inplannen</h3>
              <div className="space-y-3">
                <input
                  required
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  placeholder="Titel"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />

                {/* Datum */}
                <input
                  required
                  type="date"
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />

                {/* Tijdsloten (Van - Tot) - UPDATE */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Starttijd</label>
                    <input
                      required
                      type="time"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Eindtijd</label>
                    <input
                      required
                      type="time"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <select className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
                  {lists.eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button onClick={handleAddEvent} className="w-full bg-green-600 font-bold py-3 rounded hover:bg-green-500">
                  Opslaan in Agenda
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-800">
                  <div>
                    <div className="font-bold">{ev.title}</div>
                    <div className="text-xs text-gray-400">
                      {ev.date} | {ev.time} ({ev.type})
                    </div>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, "events", ev.id))} className="text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SCORES ==================== */}
        {activeTab === "scores" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Speler</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {highscores.map((s) => (
                  <tr key={s.id}>
                    <td className="p-4 font-bold">{s.player}</td>
                    <td className="p-4 text-gray-400">{s.game}</td>
                    <td className="p-4 text-yellow-500 font-mono">{s.score.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      {s.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateDoc(doc(db, "highscores", s.id), { status: "approved" })} className="text-green-500 bg-green-900/20 p-2 rounded">
                            <Check size={16} />
                          </button>
                          <button onClick={() => deleteDoc(doc(db, "highscores", s.id))} className="text-red-500 bg-red-900/20 p-2 rounded">
                            <Ban size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-green-500 font-bold text-xs uppercase bg-green-900/20 px-2 py-1 rounded">Goedgekeurd</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== ROSTERS ==================== */}
        {activeTab === "rosters" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-fit">
              <h3 className="font-bold mb-4">Speler Toevoegen</h3>
              <div className="space-y-3">
                <select className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white" value={rosterGame} onChange={(e) => setRosterGame(e.target.value)}>
                  {lists.rosterGames.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  placeholder="Naam"
                  required
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                />
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  placeholder="Gamer Tag"
                  required
                  value={newPlayer.handle}
                  onChange={(e) => setNewPlayer({ ...newPlayer, handle: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    placeholder="Rol"
                    required
                    value={newPlayer.role}
                    onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                  />
                  <input
                    className="bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    placeholder="Rank"
                    required
                    value={newPlayer.rank}
                    onChange={(e) => setNewPlayer({ ...newPlayer, rank: e.target.value })}
                  />
                </div>
                <button onClick={handleAddPlayer} className="w-full bg-blue-600 font-bold py-3 rounded hover:bg-blue-500">
                  Toevoegen
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xl font-bold text-red-500 mb-2">{rosterGame} Roster</h3>
              {(rosters[rosterGame] || []).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-800">
                  <div>
                    <span className="font-bold text-white">{p.handle}</span>{" "}
                    <span className="text-gray-500 text-sm">
                      ({p.name} - {p.role})
                    </span>
                  </div>
                  <button onClick={() => handleDeletePlayer(idx)} className="text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TIMETABLE ==================== */}
        {activeTab === "timetable" && (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-8 sticky top-0 z-10 bg-slate-900 py-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-2xl text-white">Weekplanning</h3>
                <p className="text-gray-400 text-sm">Beheer hier de openingsuren (Ma-Vr).</p>
              </div>
              <button onClick={saveTimetable} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex gap-2 shadow-lg shadow-green-900/20 transition-all">
                <Save size={20} /> Opslaan
              </button>
            </div>

            <div className="space-y-6">
              {timetable.map((day, dIdx) => (
                <div key={dIdx} className={`border rounded-xl overflow-hidden bg-slate-950/50 ${["Zaterdag", "Zondag"].includes(day.day) ? "border-slate-800 opacity-60" : "border-slate-700"}`}>
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800">
                    <span className="font-black text-lg text-gray-200 uppercase tracking-wide flex items-center gap-2">{day.day}</span>
                    <button
                      onClick={() => {
                        const t = [...timetable];
                        t[dIdx].slots.push({ start: "09:00", end: "18:00", label: "Open toegang", type: "open" });
                        setTimetable(t);
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} /> Tijd toevoegen
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {day.slots.length === 0 ? (
                      <div className="text-center text-gray-600 italic py-2 text-sm">Gesloten</div>
                    ) : (
                      day.slots.map((slot, sIdx) => (
                        <div key={sIdx} className="flex flex-col md:flex-row gap-4 items-center bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-sm">
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gray-500" />
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase text-gray-500 font-bold">Van</span>
                              <input
                                type="time"
                                className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500 font-mono [&::-webkit-calendar-picker-indicator]:invert"
                                value={slot.start}
                                onChange={(e) => {
                                  const t = [...timetable];
                                  t[dIdx].slots[sIdx].start = e.target.value;
                                  setTimetable(t);
                                }}
                              />
                            </div>
                            <span className="text-gray-500 mt-3">-</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase text-gray-500 font-bold">Tot</span>
                              <input
                                type="time"
                                className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500 font-mono [&::-webkit-calendar-picker-indicator]:invert"
                                value={slot.end}
                                onChange={(e) => {
                                  const t = [...timetable];
                                  t[dIdx].slots[sIdx].end = e.target.value;
                                  setTimetable(t);
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex-1 w-full">
                            <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Activiteit</span>
                            <input
                              type="text"
                              placeholder="bv. Open Access"
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500"
                              value={slot.label}
                              onChange={(e) => {
                                const t = [...timetable];
                                t[dIdx].slots[sIdx].label = e.target.value;
                                setTimetable(t);
                              }}
                            />
                          </div>

                          <div className="w-full md:w-auto flex items-end gap-2">
                            <div className="w-full">
                              <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Status</span>
                              <select
                                className={`w-full bg-slate-950 border rounded p-2 text-sm outline-none font-bold ${
                                  slot.type === "open" ? "text-green-400 border-green-900" : slot.type === "team" ? "text-orange-400 border-orange-900" : "text-red-400 border-red-900"
                                }`}
                                value={slot.type}
                                onChange={(e) => {
                                  const t = [...timetable];
                                  t[dIdx].slots[sIdx].type = e.target.value as "open" | "team" | "closed";
                                  setTimetable(t);
                                }}
                              >
                                <option value="open">Geopend (Groen)</option>
                                <option value="team">Bezet/Event (Oranje)</option>
                                <option value="closed">Gesloten (Rood)</option>
                              </select>
                            </div>

                            <button
                              onClick={() => {
                                const t = [...timetable];
                                t[dIdx].slots.splice(sIdx, 1);
                                setTimetable(t);
                              }}
                              className="bg-red-900/20 text-red-500 hover:bg-red-900/40 p-2.5 rounded transition-colors mb-px"
                              title="Verwijder"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={saveTimetable} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold flex gap-2 shadow-lg shadow-green-900/20 transition-all">
                <Save size={20} /> Opslaan
              </button>
            </div>
          </div>
        )}

        {/* ==================== SETTINGS ==================== */}
        {activeTab === "settings" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold mb-4">Algemene Instellingen</h3>
              <label className="text-xs font-bold text-gray-500">Google Form URL</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white mt-1"
                value={settings.googleFormUrl}
                onChange={(e) => setSettings({ ...settings, googleFormUrl: e.target.value })}
              />
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold mb-4">Lijsten Beheren</h3>
              {[
                { key: "rosterGames", label: "Roster Games", state: newListItems.roster, set: (v: string) => setNewListItems({ ...newListItems, roster: v }) },
                { key: "highscoreGames", label: "Highscore Games", state: newListItems.highscore, set: (v: string) => setNewListItems({ ...newListItems, highscore: v }) },
                { key: "eventTypes", label: "Event Types", state: newListItems.event, set: (v: string) => setNewListItems({ ...newListItems, event: v }) },
              ].map((l: any) => (
                <div key={l.key} className="mb-6">
                  <label className="text-xs font-bold text-gray-500">{l.label}</label>
                  <div className="flex gap-2 mt-1 mb-2">
                    <input className="flex-1 bg-slate-950 border border-slate-700 p-2 rounded text-sm" value={l.state} onChange={(e) => l.set(e.target.value)} placeholder="Nieuw item..." />
                    <button
                      onClick={() => {
                        addListItem(l.key, l.state);
                        l.set("");
                      }}
                      className="bg-blue-600 px-3 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(lists as any)[l.key].map((item: string, i: number) => (
                      <span key={i} className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs flex items-center gap-2">
                        {item}{" "}
                        <button onClick={() => removeListItem(l.key, i)} className="text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button onClick={updateSettings} className="bg-green-600 px-8 py-3 rounded-xl font-bold flex gap-2">
                <Save /> Opslaan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
