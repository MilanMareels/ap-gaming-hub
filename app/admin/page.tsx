"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LogOut, Loader2, Plus, Trash2, Save, Check, Ban, X, Clock, Gamepad2, UserCheck, UserX, AlertOctagon, ShieldCheck } from "lucide-react";
import { LoginScreen } from "./LoginScreen";
import { useAdminData } from "./useAdminData";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("timetable");

  const {
    user,
    setUser,
    loading,
    events,
    filteredReservations,
    reservationFilterDate,
    setReservationFilterDate,
    reservationSearchQuery,
    setReservationSearchQuery,
    noShowSearchQuery,
    setNoShowSearchQuery,
    filteredNoShows,
    highscores,
    rosters,
    timetable,
    setTimetable,
    settings,
    setSettings,
    lists,
    inventory,
    setInventory,
    newEvent,
    setNewEvent,
    newPlayer,
    setNewPlayer,
    rosterGame,
    setRosterGame,
    newListItems,
    setNewListItems,
    newInventoryItem,
    setNewInventoryItem,
    handleAddEvent,
    handleDeleteEvent,
    handleAddPlayer,
    handleDeletePlayer,
    handleDeleteReservation,
    handleStatusUpdate,
    handleResetStrikes,
    handleApproveScore,
    handleDeleteScore,
    updateSettings,
    handleAddInventoryItem,
    handleRemoveInventoryItem,
    saveTimetable,
    addListItem,
    removeListItem,
  } = useAdminData();

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
            { id: "noshows", label: "No-Shows" },
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

        {/* RESERVATIONS */}
        {activeTab === "reservations" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-950">
              <span className="text-sm font-bold text-gray-500 uppercase">Filter op datum:</span>
              <input
                type="date"
                className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm [&::-webkit-calendar-picker-indicator]:invert"
                value={reservationFilterDate}
                onChange={(e) => setReservationFilterDate(e.target.value)}
              />
              <input
                type="text"
                placeholder="Zoek op Email of S nummer"
                className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm w-64"
                value={reservationSearchQuery}
                onChange={(e) => setReservationSearchQuery(e.target.value)}
              />
              {reservationFilterDate && (
                <button onClick={() => setReservationFilterDate("")} className="text-xs text-red-500 hover:underline">
                  Reset Filter
                </button>
              )}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Datum</th>
                  <th className="p-4">Tijd</th>
                  <th className="p-4">Hardware & Info</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReservations.map((r) => (
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
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${["pc", "switch"].includes(r.inventory.toLowerCase()) ? "bg-red-900/30 text-red-400" : "bg-blue-900/30 text-blue-400"}`}
                        >
                          {r.inventory}
                        </span>
                        {((r.controllers || 0) > 0 || r.inventory.toLowerCase() === "pc") && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Gamepad2 size={12} />
                            {r.inventory.toLowerCase() === "pc" ? `1 Speler${(r.controllers || 0) > 0 ? " (+ Controller)" : ""}` : `${r.controllers} ${r.controllers === 1 ? "Speler" : "Spelers"}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {r.status === "present" ? (
                        <span className="text-green-500 font-bold text-xs uppercase bg-green-900/20 px-2 py-1 rounded flex w-fit items-center gap-1">
                          <Check size={12} /> Aanwezig
                        </span>
                      ) : r.status === "not-present" ? (
                        <span className="text-red-500 font-bold text-xs uppercase bg-red-900/20 px-2 py-1 rounded flex w-fit items-center gap-1">
                          <UserX size={12} /> Afwezig
                        </span>
                      ) : (
                        <span className="text-yellow-500 font-bold text-xs uppercase bg-yellow-900/20 px-2 py-1 rounded">
                          {r.status === "active" ? "Geboekt" : r.status === "booked" ? "Geboekt" : r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {r.status !== "present" && r.status !== "not-present" && (
                        <>
                          <button onClick={() => handleStatusUpdate(r.id, "present")} className="text-green-500 hover:bg-green-900/20 p-2 rounded mr-2" title="Markeer als aanwezig">
                            <UserCheck size={16} />
                          </button>
                          <button onClick={() => handleStatusUpdate(r.id, "not-present")} className="text-orange-500 hover:bg-orange-900/20 p-2 rounded mr-2" title="Markeer als afwezig">
                            <UserX size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteReservation(r)} className="text-red-500 hover:bg-red-900/20 p-2 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredReservations.length === 0 && (
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

        {/* EVENTS */}
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

                <input
                  required
                  type="date"
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />

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
                  <button onClick={() => handleDeleteEvent(ev)} className="text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NO SHOWS */}
        {activeTab === "noshows" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <AlertOctagon className="text-red-500" /> No-Show Logboek
              </h3>
              <p className="text-gray-400 text-sm mt-1">Lijst van studenten die niet zijn komen opdagen. Gebruik dit voor strikes.</p>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Zoek op Email of S nummer"
                  className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm w-full md:w-64"
                  value={noShowSearchQuery}
                  onChange={(e) => setNoShowSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Aantal No-Shows</th>
                  <th className="p-4">Geschiedenis</th>
                  <th className="p-4 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.values(
                  filteredNoShows.reduce((acc: any, curr: any) => {
                    const key = curr.sNumber;
                    if (!acc[key]) acc[key] = { ...curr, count: 0, history: [] };
                    acc[key].count++;
                    acc[key].history.push(`${curr.date} (${curr.startTime})`);
                    return acc;
                  }, {}),
                )
                  .sort((a: any, b: any) => b.count - a.count)
                  .map((s: any) => (
                    <tr key={s.sNumber}>
                      <td className="p-4 font-bold">
                        {s.sNumber}
                        <div className="text-xs text-gray-500 font-normal">{s.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-xs">{s.count}x</span>
                      </td>
                      <td className="p-4 text-gray-400 text-xs">{s.history.join(", ")}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleResetStrikes(s.sNumber)} className="text-green-500 hover:bg-green-900/20 p-2 rounded flex items-center gap-2 ml-auto text-xs font-bold uppercase">
                          <ShieldCheck size={16} /> Deblokkeer
                        </button>
                      </td>
                    </tr>
                  ))}
                {filteredNoShows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Geen no-shows geregistreerd.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SCORES */}
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
                          <button onClick={() => handleApproveScore(s)} className="text-green-500 bg-green-900/20 p-2 rounded">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleDeleteScore(s)} className="text-red-500 bg-red-900/20 p-2 rounded">
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

        {/* ROSTERS */}
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

        {/* TIMETABLE */}
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

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
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
                <h3 className="font-bold mb-4">Inventory Beheer</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(inventory).map(([key, count]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-500 capitalize">
                          {key === "pc"
                            ? "Aantal PC's"
                            : key === "ps5"
                              ? "PS5 Consoles"
                              : key === "switch"
                                ? "Nintendo Switch"
                                : key === "controller"
                                  ? "PS5 Controllers"
                                  : key === "Nintendo Controllers"
                                    ? "Nintendo Controllers"
                                    : key}
                        </label>
                        <button onClick={() => handleRemoveInventoryItem(key)} className="text-red-500 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="number"
                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                        value={count}
                        onChange={(e) => setInventory({ ...inventory, [key]: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <label className="text-xs font-bold text-gray-500 block mb-2">Nieuw Item Toevoegen</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="Naam (bv. VR Headset)"
                      className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={newInventoryItem.name}
                      onChange={(e) => setNewInventoryItem({ ...newInventoryItem, name: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Aantal"
                      className="w-24 bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={newInventoryItem.count || ""}
                      onChange={(e) => setNewInventoryItem({ ...newInventoryItem, count: parseInt(e.target.value) || 0 })}
                    />
                    <button onClick={handleAddInventoryItem} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
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
