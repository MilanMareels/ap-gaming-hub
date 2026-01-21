"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Clock, Swords, Ban } from "lucide-react"; // Ban icoon toegevoegd
import { ScrollReveal } from "../components/ScrollReveal";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);

  // Standaard status is gesloten (Rood)
  const [liveStatus, setLiveStatus] = useState({
    status: "CLOSED",
    label: "Gesloten",
    color: "red", // red | orange | green
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "content", "timetable"), (d) => {
      if (d.exists()) setSchedule(d.data().schedule);
    });
    return () => unsub();
  }, []);

  // Live status update elke minuut
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
      const currentDay = days[now.getDay()];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const today = schedule.find((d: any) => d.day === currentDay);

      // Als er vandaag geen schema is
      if (!today) {
        setLiveStatus({ status: "CLOSED", label: "Gesloten", color: "red" });
        return;
      }

      let found = false;
      for (const slot of today.slots) {
        const [sH, sM] = slot.start.split(":").map(Number);
        const [eH, eM] = slot.end.split(":").map(Number);
        const start = sH * 60 + sM;
        const end = eH * 60 + eM;

        // Als we BINNEN een tijdslot zitten
        if (currentMins >= start && currentMins < end) {
          found = true;

          if (slot.type === "open") {
            // Situatie 1: Open Access -> GROEN
            setLiveStatus({
              status: "OPEN",
              label: "Geopend",
              color: "green",
            });
          } else if (slot.type === "team") {
            // Situatie 2: Team / Event -> ORANJE
            setLiveStatus({
              status: "TEAM",
              label: `Gesloten voor publiek (${slot.label})`,
              color: "orange",
            });
          } else {
            // Situatie 3: Expliciet Gesloten -> ROOD
            setLiveStatus({
              status: "CLOSED",
              label: `Gesloten (${slot.label})`,
              color: "red",
            });
          }
          break;
        }
      }

      // Situatie 4: Buiten openingsuren -> ROOD
      if (!found) {
        setLiveStatus({ status: "CLOSED", label: "Gesloten", color: "red" });
      }
    };

    if (schedule.length > 0) check();

    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [schedule]);

  // Helper functie om de classes te bepalen op basis van kleur state
  const getStatusClasses = () => {
    switch (liveStatus.color) {
      case "green":
        return "bg-green-500/10 border-green-500/50 text-green-400";
      case "orange":
        return "bg-orange-500/10 border-orange-500/50 text-orange-400";
      case "red":
      default:
        return "bg-red-500/10 border-red-500/50 text-red-400";
    }
  };

  const getDotColor = () => {
    switch (liveStatus.color) {
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      default:
        return "bg-red-500";
    }
  };

  // Helper voor slot styling in de lijst
  const getSlotStyle = (type: string) => {
    switch (type) {
      case "open":
        return "bg-green-900/5 border-slate-800";
      case "team":
        return "bg-orange-900/10 border-orange-900/30";
      case "closed":
        return "bg-red-900/10 border-red-900/30";
      default:
        return "bg-slate-900 border-slate-800";
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case "open":
        return "bg-green-600 text-white";
      case "team":
        return "bg-orange-600 text-white";
      case "closed":
        return "bg-red-600 text-white";
      default:
        return "bg-slate-800 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-24 px-4">
      <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3">
          <ScrollReveal direction="left">
            <h1 className="text-5xl font-black mb-6">
              WEEK <span className="text-red-600">SCHEMA</span>
            </h1>

            {/* Live Status Box */}
            <div className={`p-6 rounded-2xl border mb-8 transition-colors duration-500 ${getStatusClasses()}`}>
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getDotColor()}`}></div>
                Live Status
              </h4>
              <p className="opacity-90">
                De ruimte is: <span className="font-bold block text-lg mt-1">{liveStatus.label}</span>
              </p>
            </div>
          </ScrollReveal>
        </div>

        <div className="lg:w-2/3 space-y-4">
          {schedule.length === 0 && <div className="text-gray-500 italic">Nog geen schema geladen...</div>}

          {schedule.map((day: any, idx: number) => (
            <ScrollReveal key={idx} direction="right" delay={idx * 50}>
              <div className={`flex flex-col md:flex-row bg-slate-950 border border-slate-800 rounded-xl overflow-hidden ${["Zaterdag", "Zondag"].includes(day.day) ? "opacity-75" : ""}`}>
                <div className="bg-slate-900 p-6 w-full md:w-40 flex items-center justify-center font-black text-xl uppercase tracking-wider text-gray-300">{day.day}</div>
                <div className="flex-1 p-4 grid gap-3">
                  {day.slots.length === 0 ? (
                    <div className="text-gray-500 italic text-sm py-2">Gesloten</div>
                  ) : (
                    day.slots.map((slot: any, sIdx: number) => (
                      <div key={sIdx} className={`flex items-center gap-4 p-3 rounded-lg border ${getSlotStyle(slot.type)}`}>
                        <div className={`p-2 rounded ${getIconStyle(slot.type)}`}>{slot.type === "team" ? <Swords size={16} /> : slot.type === "closed" ? <Ban size={16} /> : <Clock size={16} />}</div>
                        <div>
                          <span className="block font-bold text-white">{slot.label}</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
