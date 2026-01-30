import { useState, useEffect } from "react";
import { doc, setDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DaySchedule, Reservation } from "../lib/types";

// Helpers
const timeToMins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minsToTime = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
};

export function useReservation() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({ pc: 5, ps5: 1, switch: 1, controller: 8, "Nintendo Controllers": 4 });

  const [formData, setFormData] = useState({
    sNumber: "",
    email: "",
    inventory: "pc",
    date: "",
    startTime: "",
    duration: "60",
    controllers: 1,
    extraController: false,
    acceptedTerms: false,
  });

  useEffect(() => {
    const unsubRes = onSnapshot(doc(db, "content", "reservations"), (d) => {
      if (d.exists()) setExistingReservations(d.data().reservations || []);
    });
    const unsubTime = onSnapshot(doc(db, "content", "timetable"), (d) => {
      if (d.exists()) setTimetable(d.data().schedule || []);
    });
    const unsubSettings = onSnapshot(doc(db, "content", "settings"), (d) => {
      if (d.exists()) setInventory(d.data().inventory || { pc: 5, ps5: 1, switch: 1, controller: 8, "Nintendo Controllers": 4 });
    });
    return () => {
      unsubRes();
      unsubTime();
      unsubSettings();
    };
  }, []);

  const calculateAvailableStartTimes = (date: string, duration: string, inventoryType: string, controllers: number, extraController: boolean) => {
    if (!date) return [];

    const dateObj = new Date(date);
    const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
    const dayName = daysMap[dateObj.getDay()];
    const daySchedule = timetable.find((d) => d.day === dayName);

    if (!daySchedule) return [];

    const availableTimes: string[] = [];
    const requiredDuration = parseInt(duration);

    const now = new Date();
    const isToday = date === now.toISOString().split("T")[0];
    const currentTimeMins = now.getHours() * 60 + now.getMinutes();

    daySchedule.slots
      .filter((s) => s.type === "open")
      .forEach((slot) => {
        let currentMins = timeToMins(slot.start);
        const endMins = timeToMins(slot.end);

        while (currentMins + requiredDuration <= endMins) {
          if (isToday && currentMins <= currentTimeMins) {
            currentMins += 30;
            continue;
          }

          const startStr = minsToTime(currentMins);
          const endStr = minsToTime(currentMins + requiredDuration);

          const hardwareCount = existingReservations.filter(
            (r) => r.date === date && r.inventory === inventoryType && timeToMins(r.startTime) < timeToMins(endStr) && timeToMins(r.endTime) > currentMins,
          ).length;

          const maxHardware = inventory[inventoryType] || 0;

          let controllersNeeded = 0;
          let maxControllers = 0;
          let controllersInUse = 0;

          if (inventoryType === "switch") {
            controllersNeeded = controllers;
            maxControllers = inventory["Nintendo Controllers"] || 0;
            controllersInUse = existingReservations
              .filter((r) => r.date === date && r.inventory === "switch" && timeToMins(r.startTime) < timeToMins(endStr) && timeToMins(r.endTime) > currentMins)
              .reduce((sum, r) => sum + (r.controllers || 0), 0);
          } else {
            controllersNeeded = inventoryType === "ps5" ? controllers : extraController ? 1 : 0;
            maxControllers = inventory.controller || 0;
            controllersInUse = existingReservations
              .filter((r) => r.date === date && r.inventory !== "switch" && timeToMins(r.startTime) < timeToMins(endStr) && timeToMins(r.endTime) > currentMins)
              .reduce((sum, r) => sum + (r.controllers || 0), 0);
          }

          if (hardwareCount < maxHardware && (controllersNeeded === 0 || controllersInUse + controllersNeeded <= maxControllers)) {
            availableTimes.push(startStr);
          }

          currentMins += 30;
        }
      });

    return availableTimes;
  };

  const availableStartTimes = calculateAvailableStartTimes(formData.date, formData.duration, formData.inventory, formData.controllers, formData.extraController);

  const checkAvailability = (count: number) => {
    if (!formData.date) return true;
    return calculateAvailableStartTimes(formData.date, formData.duration, formData.inventory, count, formData.extraController).length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.sNumber.toLowerCase().startsWith("s")) throw new Error("Gebruik een geldig s-nummer.");
      if (!formData.email.endsWith("@ap.be") && !formData.email.endsWith("@student.ap.be")) throw new Error("Gebruik je officiële AP email.");
      if (!formData.startTime) throw new Error("Selecteer een starttijd.");

      const startMins = timeToMins(formData.startTime);
      const endMins = startMins + parseInt(formData.duration);
      const endTime = minsToTime(endMins);
      const controllersCount = formData.inventory === "ps5" || formData.inventory === "switch" ? formData.controllers : formData.extraController ? 1 : 0;

      const newReservation = {
        id: Date.now().toString(),
        sNumber: formData.sNumber,
        email: formData.email,
        inventory: formData.inventory,
        date: formData.date,
        startTime: formData.startTime,
        endTime: endTime,
        controllers: controllersCount,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "content", "reservations"), { reservations: arrayUnion(newReservation) }, { merge: true });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    success,
    error,
    formData,
    setFormData,
    availableStartTimes,
    checkAvailability,
    handleSubmit,
    inventory,
    existingReservations,
  };
}
