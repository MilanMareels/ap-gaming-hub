"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore"; // setDoc toegevoegd
import { db } from "../lib/firebase";
import { Clock, Swords, Database } from "lucide-react";
import { ScrollReveal } from "../components/ScrollReveal";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [liveStatus, setLiveStatus] = useState({ status: "CLOSED", label: "Gesloten" });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "content", "timetable"), (d) => {
      if (d.exists()) setSchedule(d.data().schedule);
    });
    return () => unsub();
  }, []);

  // --- TIJDELIJKE FUNCTIE OM DATA TE VULLEN ---
  const seedSchedule = async () => {
    const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];

    // Maak voor elke dag een object aan
    const newSchedule = days.map((day) => ({
      day: day,
      slots: [
        {
          id: 1,
          start: "10:00",
          end: "18:00",
          label: "Open Access",
          type: "open", // 'open' zorgt voor standaard styling, 'team' voor rood
        },
      ],
    }));

    if (confirm("Weet je zeker dat je het schema wilt overschrijven met Ma-Vr 10u-18u?")) {
      try {
        await setDoc(doc(db, "content", "timetable"), {
          schedule: newSchedule,
        });
        alert("Schema succesvol ingesteld!");
      } catch (error) {
        console.error(error);
        alert("Fout bij opslaan (check je permissions?): " + error);
      }
    }
  };
  // ---------------------------------------------

  // Live status update elke minuut
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
      const currentDay = days[now.getDay()];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const today = schedule.find((d: any) => d.day === currentDay);
      if (!today) {
        setLiveStatus({ status: "CLOSED", label: "Gesloten" });
        return;
      }

      let found = false;
      for (const slot of today.slots) {
        const [sH, sM] = slot.start.split(":").map(Number);
        const [eH, eM] = slot.end.split(":").map(Number);
        const start = sH * 60 + sM;
        const end = eH * 60 + eM;
        if (currentMins >= start && currentMins < end) {
          found = true;
          setLiveStatus(slot.type === "open" ? { status: "OPEN", label: "Open Access" } : { status: "BEZET", label: `Bezet (${slot.label})` });
          break;
        }
      }
      if (!found) setLiveStatus({ status: "CLOSED", label: "Gesloten" });
    };

    if (schedule.length > 0) check(); // Check pas als er een schedule is

    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [schedule]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-24 px-4">
      <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3">
          <ScrollReveal direction="left">
            <h1 className="text-5xl font-black mb-6">
              WEEK <span className="text-red-600">SCHEMA</span>
            </h1>
            <div
              className={`p-6 rounded-2xl border mb-8 ${
                liveStatus.status === "OPEN"
                  ? "bg-green-900/20 border-green-500/50"
                  : liveStatus.status === "BEZET"
                    ? "bg-orange-900/20 border-orange-500/50"
                    : "bg-slate-900 border-slate-800"
              }`}
            >
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    liveStatus.status === "OPEN" ? "bg-green-500" : liveStatus.status === "BEZET" ? "bg-orange-500" : "bg-red-500"
                  }`}
                ></div>
                Live Status
              </h4>
              <p className="text-gray-400">
                De ruimte is: <span className="font-bold text-white">{liveStatus.label}</span>
              </p>
            </div>
          </ScrollReveal>
        </div>

        <div className="lg:w-2/3 space-y-4">
          {schedule.length === 0 && <div className="text-gray-500 italic">Nog geen schema geladen...</div>}

          {schedule.map((day: any, idx: number) => (
            <ScrollReveal key={idx} direction="right" delay={idx * 50}>
              <div className="flex flex-col md:flex-row bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-900 p-6 w-full md:w-40 flex items-center justify-center font-black text-xl uppercase tracking-wider">
                  {day.day}
                </div>
                <div className="flex-1 p-4 grid gap-3">
                  {day.slots.map((slot: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        slot.type === "team" ? "bg-red-900/10 border-red-900/30" : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      <div className={`p-2 rounded ${slot.type === "team" ? "bg-red-600 text-white" : "bg-slate-800 text-gray-400"}`}>
                        {slot.type === "team" ? <Swords size={16} /> : <Clock size={16} />}
                      </div>
                      <div>
                        <span className="block font-bold">{slot.label}</span>
                        <span className="text-xs text-gray-500">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
