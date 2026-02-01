"use server";

import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { Reservation } from "../lib/types";
import { headers } from "next/headers";

const timeToMins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minsToTime = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
};

const ipRateLimit = new Map<string, number>();

export async function createReservation(formData: {
  sNumber: string;
  email: string;
  inventory: string;
  date: string;
  startTime: string;
  duration: string;
  controllers: number;
  extraController: boolean;
}) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const now = Date.now();
    const lastRequest = ipRateLimit.get(ip);

    if (lastRequest && now - lastRequest < 10000) throw new Error("Te veel verzoeken. Wacht 10 seconden.");
    ipRateLimit.set(ip, now);

    if (!/^s[0-9]+$/i.test(formData.sNumber)) {
      throw new Error("Gebruik een geldig s-nummer (s + cijfers).");
    }
    if (!formData.email.endsWith("@student.ap.be")) {
      throw new Error("Gebruik je officiële AP email.");
    }
    if (!formData.date || !formData.startTime) {
      throw new Error("Datum en starttijd zijn verplicht.");
    }

    const currentSNumber = formData.sNumber.trim().toLowerCase();
    const startMins = timeToMins(formData.startTime);
    const duration = parseInt(formData.duration || "60");

    if (isNaN(duration) || duration <= 0) {
      throw new Error("Ongeldige duur.");
    }

    const endMins = startMins + duration;
    const endTime = minsToTime(endMins);
    const controllersCount = formData.inventory === "ps5" || formData.inventory === "switch" ? formData.controllers : formData.extraController ? 1 : 0;

    const [logsSnap, reservationsSnap, settingsSnap] = await Promise.all([getDoc(doc(db, "content", "logs")), getDoc(doc(db, "content", "reservations")), getDoc(doc(db, "content", "settings"))]);

    if (logsSnap.exists()) {
      const logsData = logsSnap.data();
      const userStrikes = (logsData.noShows || []).filter((log: any) => log.sNumber && log.sNumber.trim().toLowerCase() === currentSNumber);
      if (userStrikes.length >= 3) {
        throw new Error("Je account is geblokkeerd vanwege 3 no-shows. Contacteer een admin.");
      }
    }

    const existingReservations: Reservation[] = reservationsSnap.exists() ? reservationsSnap.data().reservations || [] : [];

    const recentUserReservation = existingReservations.find((r) => {
      if (r.sNumber?.toLowerCase() !== currentSNumber || !r.createdAt) return false;
      return now - new Date(r.createdAt).getTime() < 60000;
    });

    if (recentUserReservation) throw new Error("Je mag maar 1 reservatie per minuut maken.");

    let totalDuration = 0;
    let hasOverlap = false;
    let hasInsufficientGap = false;

    existingReservations.forEach((r) => {
      if (r.date !== formData.date || !["not-present", "booked", "present"].includes(r.status!)) return;

      if (r.sNumber && r.sNumber.trim().toLowerCase() === currentSNumber) {
        const rStart = timeToMins(r.startTime);
        let rEnd;
        if (r.endTime) {
          rEnd = timeToMins(r.endTime);
        } else {
          rEnd = rStart + (parseInt((r as any).duration) || 60);
        }

        totalDuration += rEnd - rStart;

        if (startMins < rEnd && endMins > rStart) {
          hasOverlap = true;
        } else if (startMins < rEnd + 30 && endMins > rStart - 30) {
          hasInsufficientGap = true;
        }
      }
    });

    if (hasOverlap) throw new Error("Je hebt al een reservatie die overlapt met dit tijdslot.");
    if (hasInsufficientGap) throw new Error("Er moet minstens 30 minuten tussen je reservaties zitten.");
    if (totalDuration + duration > 240) throw new Error(`Je mag maximaal 4 uur per dag reserveren. Je hebt al ${totalDuration / 60} uur.`);

    const inventory = settingsSnap.exists() ? settingsSnap.data().inventory : { pc: 5, ps5: 1, switch: 1 };
    const maxHardware = inventory[formData.inventory] || 0;

    const conflictingReservations = existingReservations.filter(
      (r) =>
        r.date === formData.date &&
        r.inventory === formData.inventory &&
        ["booked", "present"].includes(r.status || "") &&
        timeToMins(r.startTime) < endMins &&
        (r.endTime ? timeToMins(r.endTime) : timeToMins(r.startTime) + 60) > startMins,
    );

    if (conflictingReservations.length >= maxHardware) {
      throw new Error("Dit tijdslot is niet meer beschikbaar (hardware volzet).");
    }

    if (controllersCount > 0) {
      const isSwitch = formData.inventory === "switch";
      const maxControllers = isSwitch ? inventory["Nintendo Controllers"] || 0 : inventory.controller || 0;

      const controllersInUse = conflictingReservations.reduce((sum, r) => {
        if (isSwitch && r.inventory === "switch") return sum + (r.controllers || 0);
        if (!isSwitch && r.inventory !== "switch") return sum + (r.controllers || 0);
        return sum;
      }, 0);

      if (controllersInUse + controllersCount > maxControllers) {
        throw new Error(`Niet genoeg ${isSwitch ? "Nintendo " : ""}controllers beschikbaar (${maxControllers - controllersInUse} over).`);
      }
    }

    const newReservation = {
      id: Date.now().toString(),
      sNumber: formData.sNumber,
      email: formData.email,
      inventory: formData.inventory,
      date: formData.date,
      startTime: formData.startTime,
      endTime: endTime,
      controllers: controllersCount,
      status: "booked",
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "content", "reservations"), { reservations: arrayUnion(newReservation) }, { merge: true });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
