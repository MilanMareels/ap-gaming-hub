"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { LayoutDashboard, LogOut, Loader2, Plus, Trash2, Save, Calendar, Trophy, Users, Clock, Settings, Monitor, Check, Ban, X } from "lucide-react";

// Types (Inline for safety/copy-paste ease)
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
  slots: { start: string; end: string; label: string; type: string }[];
}

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
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 w-full max-w-md">
        <h2 className="text-3xl font-black mb-8 text-center text-white">Admin Access</h2>
        {error && <div className="text-red-400 text-center mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="admin@ap.be"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white"
          />
          <input
            type="password"
            placeholder="•••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white"
          />
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN ADMIN PAGE ---
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("reservations");
  const [loading, setLoading] = useState(true);

  // Data
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [rosters, setRosters] = useState<RosterData>({});
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [settings, setSettings] = useState({ googleFormUrl: "" });
  const [lists, setLists] = useState({ rosterGames: [], highscoreGames: [], eventTypes: [] });

  // Inputs
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", type: "Casual" });
  const [newPlayer, setNewPlayer] = useState({ name: "", handle: "", role: "", rank: "" });
  const [rosterGame, setRosterGame] = useState("");

  // List inputs
  const [newListItems, setNewListItems] = useState({ roster: "", highscore: "", event: "" });

  // Auth & Data Fetching
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    if (!auth) setLoading(false);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listeners
    const unsubEv = onSnapshot(query(collection(db, "events"), orderBy("date")), (s) =>
      setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem)))
    );
    const unsubRes = onSnapshot(query(collection(db, "reservations"), orderBy("date", "desc")), (s) =>
      setReservations(s.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation)))
    );
    const unsubHigh = onSnapshot(query(collection(db, "highscores"), orderBy("score", "desc")), (s) =>
      setHighscores(s.docs.map((d) => ({ id: d.id, ...d.data() } as Highscore)))
    );
    const unsubRosters = onSnapshot(doc(db, "content", "rosters"), (d) => d.exists() && setRosters(d.data().data));
    const unsubTime = onSnapshot(doc(db, "content", "timetable"), (d) => d.exists() && setTimetable(d.data().schedule));
    const unsubSet = onSnapshot(doc(db, "content", "settings"), (d) => {
      if (d.exists()) {
        setSettings(d.data().settings);
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

  // Handlers
  const handleAddEvent = async () => {
    if (newEvent.title) {
      await addDoc(collection(db, "events"), newEvent);
      setNewEvent({ title: "", date: "", time: "", type: "Casual" });
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
    alert("Opgeslagen!");
  };

  // List Helpers
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
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-800">
          {["reservations", "events", "scores", "rosters", "timetable", "settings"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`capitalize px-6 py-2 rounded-lg font-bold whitespace-nowrap ${
                activeTab === t ? "bg-red-600 text-white" : "bg-slate-900 text-gray-400 hover:bg-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* --- RESERVATIONS --- */}
        {activeTab === "reservations" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Item</th>
                  <th className="p-4 text-right">Action</th>
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
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          r.inventory === "PC" ? "bg-red-900/30 text-red-400" : "bg-blue-900/30 text-blue-400"
                        }`}
                      >
                        {r.inventory}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => confirm("Delete?") && deleteDoc(doc(db, "reservations", r.id))}
                        className="text-red-500 hover:bg-red-900/20 p-2 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- EVENTS --- */}
        {activeTab === "events" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-fit">
              <h3 className="font-bold mb-4">Add Event</h3>
              <div className="space-y-3">
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  placeholder="Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                  <input
                    type="time"
                    className="bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
                <select
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                >
                  {lists.eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button onClick={handleAddEvent} className="w-full bg-green-600 font-bold py-3 rounded hover:bg-green-500">
                  Add Event
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-800">
                  <div>
                    <div className="font-bold">{ev.title}</div>
                    <div className="text-xs text-gray-400">
                      {ev.date} @ {ev.time} ({ev.type})
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

        {/* --- SCORES --- */}
        {activeTab === "scores" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Player</th>
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
                    <td className="p-4 text-yellow-500 font-mono">{s.score}</td>
                    <td className="p-4 text-right">
                      {s.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateDoc(doc(db, "highscores", s.id), { status: "approved" })}
                            className="text-green-500 bg-green-900/20 p-2 rounded"
                          >
                            <Check size={16} />
                          </button>
                          <button onClick={() => deleteDoc(doc(db, "highscores", s.id))} className="text-red-500 bg-red-900/20 p-2 rounded">
                            <Ban size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-green-500 font-bold">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ROSTERS --- */}
        {activeTab === "rosters" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-fit">
              <h3 className="font-bold mb-4">Add Player</h3>
              <div className="space-y-3">
                <select
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  value={rosterGame}
                  onChange={(e) => setRosterGame(e.target.value)}
                >
                  {lists.rosterGames.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  placeholder="Name"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                />
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  placeholder="Handle"
                  value={newPlayer.handle}
                  onChange={(e) => setNewPlayer({ ...newPlayer, handle: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    placeholder="Role"
                    value={newPlayer.role}
                    onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                  />
                  <input
                    className="bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    placeholder="Rank"
                    value={newPlayer.rank}
                    onChange={(e) => setNewPlayer({ ...newPlayer, rank: e.target.value })}
                  />
                </div>
                <button onClick={handleAddPlayer} className="w-full bg-blue-600 font-bold py-3 rounded hover:bg-blue-500">
                  Add to Team
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

        {/* --- TIMETABLE --- */}
        {activeTab === "timetable" && (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl">Weekly Schedule</h3>
              <button
                onClick={() => setDoc(doc(db, "content", "timetable"), { schedule: timetable }).then(() => alert("Saved!"))}
                className="bg-green-600 px-6 py-2 rounded font-bold flex gap-2"
              >
                <Save size={18} /> Save
              </button>
            </div>
            <div className="space-y-4">
              {timetable.map((day, dIdx) => (
                <div key={dIdx} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-950 px-4 py-2 font-bold text-gray-400 flex justify-between">
                    {day.day}
                    <button
                      onClick={() => {
                        const t = [...timetable];
                        t[dIdx].slots.push({ start: "12:00", end: "13:00", label: "Open", type: "open" });
                        setTimetable(t);
                      }}
                      className="text-xs bg-slate-800 px-2 rounded hover:bg-slate-700"
                    >
                      + Slot
                    </button>
                  </div>
                  <div className="p-4 space-y-2 bg-slate-900/50">
                    {day.slots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex gap-2 items-center">
                        <input
                          type="time"
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-sm"
                          value={slot.start}
                          onChange={(e) => {
                            const t = [...timetable];
                            t[dIdx].slots[sIdx].start = e.target.value;
                            setTimetable(t);
                          }}
                        />
                        <span>-</span>
                        <input
                          type="time"
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-sm"
                          value={slot.end}
                          onChange={(e) => {
                            const t = [...timetable];
                            t[dIdx].slots[sIdx].end = e.target.value;
                            setTimetable(t);
                          }}
                        />
                        <input
                          type="text"
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-sm flex-1"
                          value={slot.label}
                          onChange={(e) => {
                            const t = [...timetable];
                            t[dIdx].slots[sIdx].label = e.target.value;
                            setTimetable(t);
                          }}
                        />
                        <select
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-sm"
                          value={slot.type}
                          onChange={(e) => {
                            const t = [...timetable];
                            t[dIdx].slots[sIdx].type = e.target.value;
                            setTimetable(t);
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="team">Team</option>
                          <option value="event">Event</option>
                        </select>
                        <button
                          onClick={() => {
                            const t = [...timetable];
                            t[dIdx].slots.splice(sIdx, 1);
                            setTimetable(t);
                          }}
                          className="text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SETTINGS --- */}
        {activeTab === "settings" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold mb-4">General Settings</h3>
              <label className="text-xs font-bold text-gray-500">Google Form URL</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white mt-1"
                value={settings.googleFormUrl}
                onChange={(e) => setSettings({ ...settings, googleFormUrl: e.target.value })}
              />
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold mb-4">Manage Lists</h3>
              {[
                {
                  key: "rosterGames",
                  label: "Roster Games",
                  state: newListItems.roster,
                  set: (v: string) => setNewListItems({ ...newListItems, roster: v }),
                },
                {
                  key: "highscoreGames",
                  label: "Highscore Games",
                  state: newListItems.highscore,
                  set: (v: string) => setNewListItems({ ...newListItems, highscore: v }),
                },
                {
                  key: "eventTypes",
                  label: "Event Types",
                  state: newListItems.event,
                  set: (v: string) => setNewListItems({ ...newListItems, event: v }),
                },
              ].map((l: any) => (
                <div key={l.key} className="mb-6">
                  <label className="text-xs font-bold text-gray-500">{l.label}</label>
                  <div className="flex gap-2 mt-1 mb-2">
                    <input
                      className="flex-1 bg-slate-950 border border-slate-700 p-2 rounded text-sm"
                      value={l.state}
                      onChange={(e) => l.set(e.target.value)}
                      placeholder="Add new..."
                    />
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
                <Save /> Save All Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
