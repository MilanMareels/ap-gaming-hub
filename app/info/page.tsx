"use client";

import React, { useState } from "react";
import { Shield, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function InfoPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Hoe reserveer ik een plaats?",
      answer:
        "Ga naar de 'Reservations' pagina via het menu. Vul je studentennummer en AP-email in, kies of je een PC of PS5 wilt gebruiken, en selecteer een beschikbaar tijdslot voor de volgende dag.",
    },
    {
      question: "Wat als ik niet kom opdagen bij mijn reservatie?",
      answer:
        "Als je verhinderd bent, annuleer dan tijdig via Discord of mail. Bij een 'no-show' zonder afmelding krijg je een waarschuwing. Bij herhaling kan je account tijdelijk geblokkeerd worden.",
    },
    {
      question: "Hoe join ik een gaming team?",
      answer:
        "Join onze Discord server! In het kanaal #team-finder kan je oproepjes plaatsen of reageren op teams die spelers zoeken voor games zoals Valorant, League of Legends, Rocket League en meer.",
    },
    {
      question: "Welke consoles en games zijn er?",
      answer: "We hebben meerdere PlayStation 5 consoles met populaire games zoals EA FC 24, Tekken 8, Street Fighter 6 en Call of Duty vooraf geïnstalleerd.",
    },
    {
      question: "Welke PC's zijn er?",
      answer: "Onze e-sports ruimte beschikt over High-End gaming PC's met krachtige RTX 40-series videokaarten en snelle processoren, gekoppeld aan 240Hz monitoren voor competitieve gameplay.",
    },
    {
      question: "Welke games mag ik spelen?",
      answer: "Je mag alle vooraf geïnstalleerde games spelen (o.a. Valorant, LoL, CS2, Overwatch 2). Het installeren van eigen software of illegale content is streng verboden.",
    },
    {
      question: "Hoelang mag ik huren en blijven gamen?",
      answer: "Je kan maximaal 2 uur per dag reserveren. Dit limiet zorgt ervoor dat zoveel mogelijk studenten gebruik kunnen maken van de faciliteiten.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-24 px-4 text-white">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-5xl font-black mb-12 text-center">
          HUB <span className="text-red-600">INFO</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#5865F2] p-8 rounded-3xl flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer">
            <MessageCircle size={64} className="text-white mb-4" />
            <h2 className="text-3xl font-bold mb-2">Join Discord</h2>
            <p className="text-white/80 mb-6">Chat met andere studenten, vind teammates en blijf op de hoogte.</p>
            <a href="https://discord.gg/JOUW_LINK" target="_blank" className="bg-white text-[#5865F2] px-8 py-3 rounded-full font-bold">
              Join Server
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="text-red-500" /> Huisregels
            </h3>
            <ul className="space-y-3 text-gray-400 list-disc pl-5">
              <li>
                Eten en drinken is <strong>verboden</strong> bij de apparatuur.
              </li>
              <li>Respecteer de reservatietijden.</li>
              <li>Toxic gedrag wordt niet getolereerd.</li>
              <li>Log uit na gebruik van PC/Console.</li>
            </ul>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Veelgestelde Vragen</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-slate-700">
                <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full flex items-center justify-between p-6 text-left font-bold focus:outline-none">
                  {faq.question}
                  {openIndex === index ? <ChevronUp className="text-red-500" /> : <ChevronDown className="text-gray-500" />}
                </button>
                {openIndex === index && <div className="p-6 pt-0 text-gray-400 border-t border-slate-800/50 leading-relaxed">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
