"use client";
import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase"; // Import je firebase config
import { Calendar, Clock, Monitor, Gamepad2, CheckCircle, AlertTriangle } from "lucide-react";

export default function ReservationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    sNumber: "",
    email: "",
    inventory: "PC", // PC of PS5
    date: "", // YYYY-MM-DD
    startTime: "", // HH:MM
    endTime: "", // HH:MM
    acceptedTerms: false,
  });

  // Helper om te checken of datum "morgen" is
  const validateDate = (dateStr: string) => {
    const selected = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset uren voor vergelijking
    selected.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    return selected.getTime() === tomorrow.getTime();
  };

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Validatie: S-Nummer
      if (!formData.sNumber.toLowerCase().startsWith("s")) throw new Error("Gebruik een geldig s-nummer.");

      // 2. Validatie: Email
      if (!formData.email.endsWith("@ap.be") && !formData.email.endsWith("@student.ap.be")) {
        throw new Error("Gebruik je officiële AP email.");
      }

      // 3. Validatie: Tijdslot (Min 1 uur, Max 2 uur)
      const durationMinutes = calculateDuration(formData.startTime, formData.endTime);
      if (durationMinutes < 60) throw new Error("Reservatie moet minimaal 1 uur duren.");
      if (durationMinutes > 120) throw new Error("Reservatie mag maximaal 2 uur duren.");

      // 4. Validatie: Datum (Moet morgen zijn)
      // Als je strikt "1 dag op voorhand" wilt:
      if (!validateDate(formData.date)) {
        throw new Error("Je kan enkel reserveren voor de volgende dag.");
      }

      // 5. Submit naar Firebase
      await addDoc(collection(db, "reservations"), {
        ...formData,
        status: "active", // of 'pending'
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} /> {error}
            </div>
          )}

          {/* Student Info */}
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

          {/* Inventory Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kies Hardware</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, inventory: "PC" })}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  formData.inventory === "PC"
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-slate-950 border-slate-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                <Monitor size={32} />
                <span className="font-bold">High-End PC</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, inventory: "PS5" })}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  formData.inventory === "PS5"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                <Gamepad2 size={32} />
                <span className="font-bold">PlayStation 5</span>
              </button>
            </div>
          </div>

          {/* Datum & Tijd */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Calendar size={18} /> Planning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500">Datum (Morgen)</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Start Tijd</label>
                <input
                  required
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Eind Tijd</label>
                <input
                  required
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">* Minimaal 1 uur, Maximaal 2 uur.</p>
          </div>

          {/* Terms */}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-slate-950 font-black py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Bezig met boeken..." : "RESERVEER NU"}
          </button>
        </form>
      </div>
    </div>
  );
}
