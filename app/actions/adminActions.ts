// app/actions/adminActions.ts
"use server";

import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { EventItem, Reservation, Highscore, DaySchedule } from "../lib/types";

// --- Events ---

export async function addEventAction(eventData: EventItem) {
  try {
    // 1. Toevoegen aan events collectie
    await setDoc(
      doc(db, "content", "events"),
      {
        events: arrayUnion(eventData),
      },
      { merge: true },
    );

    // 2. Toevoegen aan timetable (server-side logica)
    const timetableRef = doc(db, "content", "timetable");
    const timetableSnap = await getDoc(timetableRef);

    // Haal huidige schedule op of gebruik lege array
    const schedule: DaySchedule[] = timetableSnap.exists() ? timetableSnap.data().schedule || [] : [];

    // Als schedule leeg is, moeten we misschien de default structuur opbouwen,
    // maar hier gaan we ervan uit dat de admin de structuur al heeft staan.
    if (schedule.length > 0) {
      const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
      const dateObj = new Date(eventData.date);
      const dayName = daysMap[dateObj.getDay()];
      const [startTime, endTime] = eventData.time.split(" - ");

      const dayIndex = schedule.findIndex((d) => d.day === dayName);
      if (dayIndex !== -1) {
        schedule[dayIndex].slots.push({
          start: startTime,
          end: endTime,
          label: `EVENT: ${eventData.title}`,
          type: "team",
        });
        // Sorteer de slots op tijd
        schedule[dayIndex].slots.sort((a, b) => a.start.localeCompare(b.start));

        await setDoc(timetableRef, { schedule });
      }
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteEventAction(eventItem: EventItem) {
  try {
    // 1. Verwijder uit events
    await updateDoc(doc(db, "content", "events"), {
      events: arrayRemove(eventItem),
    });

    // 2. Verwijder uit timetable
    const timetableRef = doc(db, "content", "timetable");
    const timetableSnap = await getDoc(timetableRef);

    if (timetableSnap.exists()) {
      let schedule: DaySchedule[] = timetableSnap.data().schedule || [];
      const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
      const dateObj = new Date(eventItem.date);
      const dayName = daysMap[dateObj.getDay()];
      const [startTime, endTime] = eventItem.time.split(" - ");

      let changed = false;
      schedule = schedule.map((day) => {
        if (day.day === dayName) {
          const newSlots = day.slots.filter((slot) => !(slot.label === `EVENT: ${eventItem.title}` && slot.start === startTime && slot.end === endTime));
          if (newSlots.length !== day.slots.length) changed = true;
          return { ...day, slots: newSlots };
        }
        return day;
      });

      if (changed) {
        await setDoc(timetableRef, { schedule });
      }
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- Rosters ---

export async function addPlayerAction(game: string, player: any) {
  try {
    const rosterRef = doc(db, "content", "rosters");
    const snap = await getDoc(rosterRef);
    const data = snap.exists() ? snap.data().data : {};
    const list = data[game] || [];

    await setDoc(
      rosterRef,
      {
        data: { ...data, [game]: [...list, player] },
      },
      { merge: true },
    );
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deletePlayerAction(game: string, playerIndex: number) {
  try {
    const rosterRef = doc(db, "content", "rosters");
    const snap = await getDoc(rosterRef);
    if (snap.exists()) {
      const data = snap.data().data;
      if (data[game]) {
        const list = data[game].filter((_: any, i: number) => i !== playerIndex);
        await setDoc(rosterRef, { data: { ...data, [game]: list } }, { merge: true });
      }
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- Reservations ---

export async function deleteReservationAction(resItem: Reservation) {
  try {
    await updateDoc(doc(db, "content", "reservations"), {
      reservations: arrayRemove(resItem),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateReservationStatusAction(reservationId: string, newStatus: string) {
  try {
    const resRef = doc(db, "content", "reservations");
    const resSnap = await getDoc(resRef);

    if (!resSnap.exists()) throw new Error("Reservations not found");

    const data = resSnap.data();

    if (newStatus === "not-present") {
      // Verplaats naar logs (No-Show)
      const reservation = data.reservations.find((r: any) => r.id === reservationId);
      if (reservation) {
        const updatedReservations = data.reservations.filter((r: any) => r.id !== reservationId);
        await updateDoc(resRef, { reservations: updatedReservations });

        const logsRef = doc(db, "content", "logs");
        const logEntry = {
          ...reservation,
          status: "not-present",
          loggedAt: new Date().toISOString(),
        };
        await setDoc(logsRef, { noShows: arrayUnion(logEntry) }, { merge: true });
      }
    } else {
      // Update status
      const updatedReservations = data.reservations.map((r: any) => (r.id === reservationId ? { ...r, status: newStatus } : r));
      await updateDoc(resRef, { reservations: updatedReservations });
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function resetStrikesAction(sNumber: string) {
  try {
    const logsRef = doc(db, "content", "logs");
    const snap = await getDoc(logsRef);
    if (snap.exists()) {
      const current = snap.data().noShows || [];
      const updated = current.filter((log: any) => log.sNumber !== sNumber);
      await updateDoc(logsRef, { noShows: updated });
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- Highscores ---

export async function approveScoreAction(scoreId: string) {
  try {
    const ref = doc(db, "content", "highscores");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const list = snap.data().highscores || [];
      const newList = list.map((s: any) => (s.id === scoreId ? { ...s, status: "approved" } : s));
      await setDoc(ref, { highscores: newList }, { merge: true });
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteScoreAction(score: Highscore) {
  try {
    await updateDoc(doc(db, "content", "highscores"), {
      highscores: arrayRemove(score),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- Settings & Timetable ---

export async function updateSettingsAction(settings: any, lists: any, inventory: any) {
  try {
    await setDoc(doc(db, "content", "settings"), { settings, lists, inventory }, { merge: true });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateInventoryAction(inventory: any) {
  try {
    await updateDoc(doc(db, "content", "settings"), { inventory });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function saveTimetableAction(schedule: DaySchedule[]) {
  try {
    await setDoc(doc(db, "content", "timetable"), { schedule });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
