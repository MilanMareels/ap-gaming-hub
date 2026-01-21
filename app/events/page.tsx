"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Clock, Gamepad2, CalendarDays } from "lucide-react";
import { ScrollReveal } from "../components/ScrollReveal";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date"));
    return onSnapshot(q, (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ["", ""];
    const d = new Date(dateStr);
    return [d.toLocaleDateString("nl-NL", { day: "numeric" }), d.toLocaleDateString("nl-NL", { month: "short" })];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <ScrollReveal direction="up">
          <h1 className="text-5xl font-black text-center mb-12">
            UPCOMING <span className="text-red-600">EVENTS</span>
          </h1>
        </ScrollReveal>

        <div className="grid gap-6">
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-12 border border-dashed border-slate-800 rounded-xl">Geen events gepland.</div>
          ) : (
            events.map((event, index) => {
              const [day, month] = formatDate(event.date);
              return (
                <ScrollReveal key={event.id} direction="up" delay={index * 100}>
                  <div className="flex flex-col md:flex-row items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-red-500/50 transition-all">
                    <div className="bg-slate-950 p-4 rounded-xl text-center min-w-[90px] border border-slate-800 mb-4 md:mb-0 md:mr-8">
                      <span className="block text-red-500 font-black text-2xl">{day}</span>
                      <span className="block text-xs text-gray-400 font-bold uppercase">{month}</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-400 justify-center md:justify-start">
                        <span className="flex items-center gap-2">
                          <Clock size={16} className="text-red-500" /> {event.time}
                        </span>
                        <span className="flex items-center gap-2">
                          <Gamepad2 size={16} className="text-red-500" /> {event.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
