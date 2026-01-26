import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, updateDoc, onSnapshot, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { EventItem, Reservation, Highscore, RosterData, DaySchedule } from "../lib/types";

const DEFAULT_WEEK = [
  { day: "Maandag", slots: [] },
  { day: "Dinsdag", slots: [] },
  { day: "Woensdag", slots: [] },
  { day: "Donderdag", slots: [] },
  { day: "Vrijdag", slots: [] },
];

export function useAdminData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [highscores, setHighscores] = useState<Highscore[]>([]);
  const [rosters, setRosters] = useState<RosterData>({});
  const [timetable, setTimetable] = useState<DaySchedule[]>(DEFAULT_WEEK);

  // Inputs
  const [settings, setSettings] = useState({ googleFormUrl: "" });
  const [lists, setLists] = useState({ rosterGames: [], highscoreGames: [], eventTypes: [] });
  const [inventory, setInventory] = useState<Record<string, number>>({ pc: 5, ps5: 1, switch: 1, controller: 8 });
  const [newInventoryItem, setNewInventoryItem] = useState({ name: "", count: 0 });
  const [reservationFilterDate, setReservationFilterDate] = useState("");

  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", endTime: "", type: "Casual" });
  const [newPlayer, setNewPlayer] = useState({ name: "", handle: "", role: "", rank: "" });
  const [rosterGame, setRosterGame] = useState("");
  const [newListItems, setNewListItems] = useState({ roster: "", highscore: "", event: "" });

  // Auth & Data Fetching
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubEv = onSnapshot(doc(db, "content", "events"), (d) => {
      if (d.exists()) {
        const list = d.data().events || [];
        list.sort((a: any, b: any) => a.date.localeCompare(b.date));
        setEvents(list);
      }
    });

    const unsubRes = onSnapshot(doc(db, "content", "reservations"), (d) => {
      if (d.exists()) {
        const list = d.data().reservations || [];
        list.sort((a: any, b: any) => b.date.localeCompare(a.date));
        setReservations(list);
      }
    });

    const unsubHigh = onSnapshot(doc(db, "content", "highscores"), (d) => {
      if (d.exists()) {
        const list = d.data().highscores || [];
        list.sort((a: any, b: any) => b.score - a.score);
        setHighscores(list);
      }
    });
    const unsubRosters = onSnapshot(doc(db, "content", "rosters"), (d) => d.exists() && setRosters(d.data().data));

    const unsubTime = onSnapshot(doc(db, "content", "timetable"), (d) => {
      if (d.exists() && d.data().schedule) {
        const dbSchedule = d.data().schedule;
        const sortedSchedule = DEFAULT_WEEK.map((defDay) => {
          const found = dbSchedule.find((s: DaySchedule) => s.day === defDay.day);
          return found || defDay;
        });
        setTimetable(sortedSchedule);
      } else {
        setTimetable(DEFAULT_WEEK);
      }
    });

    const unsubSet = onSnapshot(doc(db, "content", "settings"), (d) => {
      if (d.exists()) {
        setSettings(d.data().settings || { googleFormUrl: "" });
        setLists(d.data().lists || { rosterGames: [], highscoreGames: [], eventTypes: [] });
        setInventory(d.data().inventory || { pc: 5, ps5: 1, switch: 1, controller: 8 });
        if (d.data().lists?.rosterGames?.length > 0 && !rosterGame) setRosterGame(d.data().lists.rosterGames[0]);
      }
    });

    return () => {
      unsubEv();
      unsubRes();
      unsubHigh();
      unsubRosters();
      unsubTime();
      unsubSet();
    };
  }, [user]);

  // Handlers
  const handleAddEvent = async () => {
    if (newEvent.title && newEvent.date && newEvent.time && newEvent.endTime && newEvent.type) {
      try {
        const newId = Date.now().toString();
        const eventData = {
          id: newId,
          title: newEvent.title,
          date: newEvent.date,
          time: `${newEvent.time} - ${newEvent.endTime}`,
          type: newEvent.type,
        };

        await setDoc(
          doc(db, "content", "events"),
          {
            events: arrayUnion(eventData),
          },
          { merge: true },
        );

        const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
        const dateObj = new Date(newEvent.date);
        const dayName = daysMap[dateObj.getDay()];

        const updatedTimetable = [...timetable];
        const dayIndex = updatedTimetable.findIndex((d) => d.day === dayName);

        if (dayIndex !== -1) {
          updatedTimetable[dayIndex].slots.push({
            start: newEvent.time,
            end: newEvent.endTime,
            label: `EVENT: ${newEvent.title}`,
            type: "team",
          });

          updatedTimetable[dayIndex].slots.sort((a, b) => a.start.localeCompare(b.start));

          setTimetable(updatedTimetable);
          await setDoc(doc(db, "content", "timetable"), { schedule: updatedTimetable });
        }

        setNewEvent({ title: "", date: "", time: "", endTime: "", type: "Casual" });
        alert("Event toegevoegd aan lijst én weekplanning!");
      } catch (error) {
        console.error("Error:", error);
        alert("Fout bij opslaan.");
      }
    } else {
      alert("Vul aub alle velden in (Titel, Datum, Start- & Eindtijd, Type).");
    }
  };

  const handleDeleteEvent = async (eventItem: EventItem) => {
    if (confirm("Event verwijderen?")) {
      await updateDoc(doc(db, "content", "events"), {
        events: arrayRemove(eventItem),
      });

      const daysMap = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
      const dateObj = new Date(eventItem.date);
      const dayName = daysMap[dateObj.getDay()];
      const [startTime, endTime] = eventItem.time.split(" - ");

      let changed = false;
      const updatedTimetable = timetable.map((day) => {
        if (day.day === dayName) {
          const newSlots = day.slots.filter((slot) => !(slot.label === `EVENT: ${eventItem.title}` && slot.start === startTime && slot.end === endTime));
          if (newSlots.length !== day.slots.length) changed = true;
          return { ...day, slots: newSlots };
        }
        return day;
      });

      if (changed) {
        setTimetable(updatedTimetable);
        await setDoc(doc(db, "content", "timetable"), { schedule: updatedTimetable });
      }
    }
  };

  const handleAddPlayer = async () => {
    if (newPlayer.handle && rosterGame) {
      const list = rosters[rosterGame] || [];
      await setDoc(doc(db, "content", "rosters"), { data: { ...rosters, [rosterGame]: [...list, newPlayer] } });
      setNewPlayer({ name: "", handle: "", role: "", rank: "" });
    }
  };

  const handleDeletePlayer = async (idx: number) => {
    const list = rosters[rosterGame].filter((_, i) => i !== idx);
    await setDoc(doc(db, "content", "rosters"), { data: { ...rosters, [rosterGame]: list } });
  };

  const handleDeleteReservation = async (resItem: Reservation) => {
    if (confirm("Reservatie verwijderen?")) {
      await updateDoc(doc(db, "content", "reservations"), {
        reservations: arrayRemove(resItem),
      });
    }
  };

  const handleApproveScore = async (score: Highscore) => {
    const newList = highscores.map((s) => (s.id === score.id ? { ...s, status: "approved" } : s));
    await setDoc(doc(db, "content", "highscores"), { highscores: newList }, { merge: true });
  };

  const handleDeleteScore = async (score: Highscore) => {
    if (confirm("Score verwijderen?")) {
      await updateDoc(doc(db, "content", "highscores"), {
        highscores: arrayRemove(score),
      });
    }
  };

  const updateSettings = async () => {
    await setDoc(doc(db, "content", "settings"), { settings, lists, inventory }, { merge: true });
    alert("Instellingen opgeslagen!");
  };

  const handleAddInventoryItem = () => {
    if (newInventoryItem.name && newInventoryItem.count >= 0) {
      setInventory({ ...inventory, [newInventoryItem.name]: newInventoryItem.count });
      setNewInventoryItem({ name: "", count: 0 });
    }
  };

  const handleRemoveInventoryItem = async (key: string) => {
    if (confirm(`Wil je ${key} verwijderen uit de inventory?`)) {
      const newInv = { ...inventory };
      delete newInv[key];
      setInventory(newInv);
      await updateDoc(doc(db, "content", "settings"), { inventory: newInv });
    }
  };

  const saveTimetable = async () => {
    try {
      await setDoc(doc(db, "content", "timetable"), { schedule: timetable });
      alert("Uurrooster succesvol opgeslagen!");
    } catch (error) {
      alert("Fout bij opslaan: " + error);
    }
  };

  const addListItem = (type: "rosterGames" | "highscoreGames" | "eventTypes", val: string) => {
    if (!val) return;
    setLists({ ...lists, [type]: [...lists[type], val] });
  };

  const removeListItem = (type: "rosterGames" | "highscoreGames" | "eventTypes", idx: number) => {
    const l = [...lists[type]];
    l.splice(idx, 1);
    setLists({ ...lists, [type]: l });
  };

  const filteredReservations = reservationFilterDate ? reservations.filter((r) => r.date === reservationFilterDate) : reservations;

  return {
    user,
    setUser,
    loading,
    events,
    reservations,
    filteredReservations,
    reservationFilterDate,
    setReservationFilterDate,
    highscores,
    rosters,
    timetable,
    setTimetable,
    settings,
    setSettings,
    lists,
    inventory,
    setInventory,
    newEvent,
    setNewEvent,
    newPlayer,
    setNewPlayer,
    rosterGame,
    setRosterGame,
    newListItems,
    setNewListItems,
    newInventoryItem,
    setNewInventoryItem,
    handleAddEvent,
    handleDeleteEvent,
    handleAddPlayer,
    handleDeletePlayer,
    handleDeleteReservation,
    handleApproveScore,
    handleDeleteScore,
    updateSettings,
    handleAddInventoryItem,
    handleRemoveInventoryItem,
    saveTimetable,
    addListItem,
    removeListItem,
  };
}
