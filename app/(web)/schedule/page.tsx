"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Clock, Swords, Ban } from "lucide-react";
import { ScrollReveal } from "../../components/ScrollReveal";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);

  const refeshTime: number = 60000;

  // Standaard status is gesloten (Rood)
  const [liveStatus, setLiveStatus] = useState({
    status: "CLOSED",
    label: "Gesloten",
    color: "red", // red | orange | groen
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "content", "timetable"), (d) => {
      if (d.exists()) {
        const fullSchedule = d.data().schedule || [];

        const workWeek = fullSchedule.filter((day: any) => day.day !== "Zaterdag" && day.day !== "Zondag");

        setSchedule(workWeek);
      }
    });
    return () => unsub();
  }, []);

  // Live status update elke minuut
  useEffect(() => {
    const check = () => {
      if (schedule.length === 0) return;

      const now = new Date();
      const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

      const currentDayName = daysMap[now.getDay()];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const todaySchedule = schedule.find((d: any) => d.day === currentDayName);

      if (!todaySchedule) {
        setLiveStatus({ status: "CLOSED", label: "Gesloten", color: "red" });
        return;
      }

      let foundActiveSlot = false;

      for (const slot of todaySchedule.slots) {
        if (!slot.start || !slot.end) continue;

        const [sH, sM] = slot.start.split(":").map(Number);
        const [eH, eM] = slot.end.split(":").map(Number);
        const start = sH * 60 + sM;
        const end = eH * 60 + eM;

        if (currentMins >= start && currentMins < end) {
          foundActiveSlot = true;

          if (slot.type === "open") {
            setLiveStatus({
              status: "OPEN",
              label: slot.label || "Geopend",
              color: "green",
            });
          } else if (slot.type === "team") {
            setLiveStatus({
              status: "TEAM",
              label: slot.label || "Bezet / Event",
              color: "orange",
            });
          } else {
            setLiveStatus({
              status: "CLOSED",
              label: slot.label || "Gesloten",
              color: "red",
            });
          }
          break;
        }
      }

      if (!foundActiveSlot) {
        setLiveStatus({ status: "CLOSED", label: "Gesloten", color: "red" });
      }
    };

    check();
    const interval = setInterval(check, refeshTime); // Elke minuut updaten
    return () => clearInterval(interval);
  }, [schedule]);

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

  const getSlotStyle = (type: string) => {
    switch (type) {
      case "open":
        return "bg-green-900/10 border-green-900/30 text-green-200";
      case "team":
        return "bg-orange-900/10 border-orange-900/30 text-orange-200";
      case "closed":
        return "bg-red-900/10 border-red-900/30 text-red-400 opacity-60";
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
    <div className="min-h-screen bg-slate-950 text-white py-24 px-4 flex items-center justify-center">
      <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/3">
          <ScrollReveal direction="left">
            <h1 className="text-5xl font-black mb-6">
              OPENINGS <span className="text-red-600">UREN</span>
            </h1>

            <div className={`p-6 rounded-2xl border mb-8 transition-colors duration-500 ${getStatusClasses()}`}>
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getDotColor()}`}></div>
                Live Status
              </h4>
              <p className="opacity-90 text-sm">
                Momenteel: <span className="font-bold block text-2xl mt-1">{liveStatus.label}</span>
              </p>
            </div>
          </ScrollReveal>
        </div>

        <div className="lg:w-2/3 space-y-4">
          {schedule.length === 0 && <div className="text-gray-500 italic">Rooster laden...</div>}

          {schedule.map((day: any, idx: number) => (
            <ScrollReveal key={idx} direction="right" delay={idx * 50}>
              <div className="flex flex-col md:flex-row bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-900 p-6 w-full md:w-32 flex items-center justify-center font-black text-sm uppercase tracking-wider text-gray-400 border-b md:border-b-0 md:border-r border-slate-800">
                  {day.day.substring(0, 3)}
                </div>

                <div className="flex-1 p-4 grid gap-3">
                  {day.slots && day.slots.length > 0 ? (
                    day.slots.map((slot: any, sIdx: number) => (
                      <div key={sIdx} className={`flex items-center gap-4 p-3 rounded-lg border ${getSlotStyle(slot.type)}`}>
                        <div className={`p-2 rounded-md shadow-sm ${getIconStyle(slot.type)}`}>
                          {slot.type === "team" ? <Swords size={18} /> : slot.type === "closed" ? <Ban size={18} /> : <Clock size={18} />}
                        </div>

                        <div>
                          <span className="block font-bold text-sm md:text-base">{slot.label}</span>
                          <span className="text-xs opacity-70 font-mono block mt-0.5">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-600 italic text-sm py-2 px-2">Gesloten</div>
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
