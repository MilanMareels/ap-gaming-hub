import { useState, useEffect, useMemo, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DaySchedule, Reservation } from "../lib/types";
import { createReservation } from "../actions/createReservation";

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

  const calculateAvailableStartTimes = useCallback(
    (date: string, duration: string, inventoryType: string, controllers: number, extraController: boolean) => {
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
    },
    [timetable, existingReservations, inventory],
  );

  const availableStartTimes = useMemo(() => {
    return calculateAvailableStartTimes(formData.date, formData.duration || "60", formData.inventory, formData.controllers, formData.extraController);
  }, [calculateAvailableStartTimes, formData.date, formData.duration, formData.inventory, formData.controllers, formData.extraController]);

  const checkAvailability = useCallback(
    (count: number) => {
      if (!formData.date) return true;
      return calculateAvailableStartTimes(formData.date, formData.duration || "60", formData.inventory, count, formData.extraController).length > 0;
    },
    [calculateAvailableStartTimes, formData.date, formData.duration, formData.inventory, formData.extraController],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!/^s[0-9]+$/.test(formData.sNumber.toLowerCase())) throw new Error("Gebruik een geldig s-nummer (s + cijfers).");
      if (!formData.email.endsWith("@student.ap.be")) throw new Error("Gebruik je officiële AP email.");
      if (!formData.startTime) throw new Error("Selecteer een starttijd.");

      const currentSNumber = formData.sNumber.trim().toLowerCase();
      // We keep basic client-side overlap checks for fast feedback,
      // but the server action will do the authoritative check.
      const startMins = timeToMins(formData.startTime);
      const duration = parseInt(formData.duration || "60");
      const endMins = startMins + duration;

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

      // Call Server Action
      const result = await createReservation(formData);

      if (!result.success) throw new Error(result.error);

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
