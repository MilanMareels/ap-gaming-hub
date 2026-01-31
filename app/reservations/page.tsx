"use client";
import { useState } from "react";
import { Calendar, Monitor, Gamepad2, CheckCircle, AlertTriangle, Users, Gamepad } from "lucide-react";
import { useReservation } from "./useReservation";

export default function ReservationPage() {
  const { loading, success, error, formData, setFormData, availableStartTimes, handleSubmit, checkAvailability, inventory, existingReservations } = useReservation();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 5); // Vandaag + Morgen alleen.
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [localError, setLocalError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleCheckAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setChecking(true);

    try {
      if (formData.sNumber && formData.date && formData.startTime) {
        let totalDuration = 0;
        let hasOverlap = false;
        let hasInsufficientGap = false;

        const newStartParts = formData.startTime.split(":").map(Number);
        const newStartMin = newStartParts[0] * 60 + newStartParts[1];
        const newDuration = parseInt(formData.duration || "60");
        const newEndMin = newStartMin + newDuration;
        const currentSNumber = formData.sNumber.trim().toLowerCase();

        existingReservations.forEach((data) => {
          if (data.date !== formData.date || !["not-present", "booked", "present"].includes(data.status!)) return;

          if (data.sNumber && data.sNumber.trim().toLowerCase() === currentSNumber) {
            const startParts = data.startTime.split(":").map(Number);
            const startMin = startParts[0] * 60 + startParts[1];

            let endMin;
            if (data.endTime) {
              const endParts = data.endTime.split(":").map(Number);
              endMin = endParts[0] * 60 + endParts[1];
            } else {
              endMin = startMin + (parseInt((data as any).duration) || 60);
            }

            totalDuration += endMin - startMin;

            if (newStartMin < endMin && newEndMin > startMin) {
              hasOverlap = true;
            } else if (newStartMin < endMin + 30 && newEndMin > startMin - 30) {
              hasInsufficientGap = true;
            }
          }
        });

        if (hasOverlap) {
          setLocalError("Je hebt al een reservatie die overlapt met dit tijdslot.");
          setChecking(false);
          return;
        }

        if (hasInsufficientGap) {
          setLocalError("Er moet minstens 30 minuten tussen je reservaties zitten.");
          setChecking(false);
          return;
        }

        if (totalDuration + newDuration > 240) {
          setLocalError(`Je mag maximaal 4 uur per dag reserveren. Je hebt al ${totalDuration / 60} uur gereserveerd.`);
          setChecking(false);
          return;
        }
      }

      // Als alles in orde is, voer de originele submit uit
      handleSubmit(e);
    } catch (err) {
      console.error("Error checking reservations:", err);
      setLocalError("Kon reservaties niet controleren. Probeer het later opnieuw.");
    } finally {
      setChecking(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-green-500/50 p-8 rounded-2xl text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Reservatie Ontvangen!</h2>
          <p className="text-gray-400">Je hebt succesvol een slot geboekt. Zorg dat je op tijd bent.</p>
          <button onClick={() => window.location.reload()} className="mt-6 text-red-500 hover:text-white underline">
            Nieuwe reservatie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-24 px-4 text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-2">
          RESERVEER <span className="text-red-600">GEAR</span>
        </h1>
        <p className="text-gray-400 mb-8">Boek een PC of PS5. Let op de regels.</p>

        <form onSubmit={handleCheckAndSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
          {(error || localError) && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} /> {localError || error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">S-Nummer</label>
              <input
                required
                type="text"
                placeholder="s123456"
                value={formData.sNumber}
                onChange={(e) => setFormData({ ...formData, sNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">AP Email</label>
              <input
                required
                type="email"
                placeholder="naam@student.ap.be"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kies Hardware</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "pc", label: "PC", icon: Monitor, color: "red" },
                { id: "ps5", label: "PS5", icon: Gamepad2, color: "blue" },
                { id: "switch", label: "Switch", icon: Gamepad, color: "red" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, inventory: item.id, startTime: "" })} // Reset tijd bij wissel
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.inventory === item.id ? `bg-${item.color}-600 border-${item.color}-500 text-white` : "bg-slate-950 border-slate-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <item.icon size={28} />
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {(formData.inventory === "ps5" || formData.inventory === "switch") && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 items-center gap-2">
                <Users size={14} /> Aantal Spelers (Controllers)
              </label>
              <div className="flex gap-2">
                {Array.from({
                  length: Math.min(4, formData.inventory === "switch" ? inventory["Nintendo Controllers"] || 0 : inventory.controller || 0),
                }).map((_, i) => {
                  const n = i + 1;
                  const isAvailable = checkAvailability(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setFormData({ ...formData, controllers: n, startTime: "" })}
                      className={`flex-1 py-2 rounded-lg font-bold border transition-all ${
                        formData.controllers === n
                          ? "bg-blue-600 border-blue-500 text-white"
                          : isAvailable
                            ? "bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-600"
                            : "bg-slate-900 border-slate-800 text-gray-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              {formData.date && !checkAvailability(1) && <p className="text-xs text-red-500 mt-2">Geen controllers meer beschikbaar op deze datum.</p>}
            </div>
          )}

          {formData.inventory === "pc" && (
            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, extraController: !formData.extraController, startTime: "" })}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.extraController ? "bg-red-600" : "bg-slate-700"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.extraController ? "translate-x-4" : ""}`} />
              </button>
              <span className="text-sm text-gray-300 font-bold flex items-center gap-2">
                <Gamepad2 size={16} /> Ik wil ook een controller gebruiken
              </span>
            </div>
          )}

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Calendar size={18} /> Planning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500">Datum</label>
                <input
                  required
                  type="date"
                  min={todayStr}
                  max={tomorrowStr}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, startTime: "" })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Duur</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 mt-1 text-white"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value, startTime: "" })}
                >
                  <option value="60">1 Uur</option>
                  <option value="90">1.5 Uur</option>
                  <option value="120">2 Uur</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Start Tijd</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {availableStartTimes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, startTime: t })}
                      className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                        formData.startTime === t ? "bg-red-600 border-red-500 text-white" : "bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {formData.date && availableStartTimes.length === 0 && <p className="text-xs text-red-400 mt-2">Geen beschikbare sloten voor deze selectie.</p>}
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              required
              id="terms"
              checked={formData.acceptedTerms}
              onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
              className="mt-1 w-5 h-5 accent-red-600"
            />
            <label htmlFor="terms" className="text-sm text-gray-400">
              Ik ga akkoord met de{" "}
              <a href="/info" className="text-red-500 underline">
                huisregels
              </a>
              . Ik draag zorg voor het materiaal en laat de plek netjes achter. Bij schade wordt mijn studentenaccount belast.
            </label>
          </div>

          <button type="submit" disabled={loading || checking} className="w-full bg-white text-slate-950 font-black py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
            {loading || checking ? "Bezig met controleren..." : "RESERVEER NU"}
          </button>
        </form>
      </div>
    </div>
  );
}
