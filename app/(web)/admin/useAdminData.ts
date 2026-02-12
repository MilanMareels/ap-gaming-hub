import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { EventItem, Reservation, Highscore, RosterData, DaySchedule } from "../../lib/types";
import {
  addEventAction,
  deleteEventAction,
  addPlayerAction,
  deletePlayerAction,
  deleteReservationAction,
  updateReservationStatusAction,
  resetStrikesAction,
  approveScoreAction,
  deleteScoreAction,
  updateSettingsAction,
  updateInventoryAction,
  saveTimetableAction,
} from "../../actions/adminActions";

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
  const [noShows, setNoShows] = useState<any[]>([]);

  // Inputs
  const [settings, setSettings] = useState({ googleFormUrl: "" });
  const [lists, setLists] = useState({ rosterGames: [], highscoreGames: [], eventTypes: [] });
  const [inventory, setInventory] = useState<Record<string, number>>({ pc: 5, ps5: 1, switch: 1, controller: 8 });
  const [newInventoryItem, setNewInventoryItem] = useState({ name: "", count: 0 });
  const [reservationFilterDate, setReservationFilterDate] = useState("");
  const [reservationSearchQuery, setReservationSearchQuery] = useState("");
  const [noShowSearchQuery, setNoShowSearchQuery] = useState("");

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
        list.sort((a: any, b: any) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
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

    const unsubLogs = onSnapshot(doc(db, "content", "logs"), (d) => {
      if (d.exists()) setNoShows(d.data().noShows || []);
    });

    return () => {
      unsubEv();
      unsubRes();
      unsubHigh();
      unsubRosters();
      unsubTime();
      unsubSet();
      unsubLogs();
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

        const result = await addEventAction(eventData);
        if (!result.success) throw new Error(result.error);

        setNewEvent({ title: "", date: "", time: "", endTime: "", type: "Casual" });
        alert("Event toegevoegd aan lijst én weekplanning!");
      } catch (error) {
        alert("Fout bij opslaan: " + error);
      }
    } else {
      alert("Vul aub alle velden in (Titel, Datum, Start- & Eindtijd, Type).");
    }
  };

  const handleDeleteEvent = async (eventItem: EventItem) => {
    if (confirm("Event verwijderen?")) {
      const result = await deleteEventAction(eventItem);
      if (!result.success) alert("Fout bij verwijderen: " + result.error);
    }
  };

  const handleAddPlayer = async () => {
    if (newPlayer.handle && rosterGame) {
      const result = await addPlayerAction(rosterGame, newPlayer);
      if (result.success) {
        setNewPlayer({ name: "", handle: "", role: "", rank: "" });
      } else {
        alert("Fout: " + result.error);
      }
    }
  };

  const handleDeletePlayer = async (idx: number) => {
    const result = await deletePlayerAction(rosterGame, idx);
    if (!result.success) alert("Fout: " + result.error);
  };

  const handleDeleteReservation = async (resItem: Reservation) => {
    if (confirm("Reservatie verwijderen?")) {
      const result = await deleteReservationAction(resItem);
      if (!result.success) alert("Fout: " + result.error);
    }
  };

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    const result = await updateReservationStatusAction(reservationId, newStatus);
    if (!result.success) alert("Fout: " + result.error);
  };

  const handleResetStrikes = async (sNumber: string) => {
    if (!confirm(`Weet je zeker dat je de strikes voor ${sNumber} wilt resetten? Dit deblokkeert de student.`)) return;
    const result = await resetStrikesAction(sNumber);
    if (!result.success) alert("Fout: " + result.error);
  };

  const handleApproveScore = async (score: Highscore) => {
    const result = await approveScoreAction(score.id);
    if (!result.success) alert("Fout: " + result.error);
  };

  const handleDeleteScore = async (score: Highscore) => {
    if (confirm("Score verwijderen?")) {
      const result = await deleteScoreAction(score);
      if (!result.success) alert("Fout: " + result.error);
    }
  };

  const updateSettings = async () => {
    const result = await updateSettingsAction(settings, lists, inventory);
    if (result.success) alert("Instellingen opgeslagen!");
    else alert("Fout: " + result.error);
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
      const result = await updateInventoryAction(newInv);
      if (!result.success) alert("Fout bij opslaan inventory: " + result.error);
    }
  };

  const saveTimetable = async () => {
    const result = await saveTimetableAction(timetable);
    if (result.success) {
      alert("Uurrooster succesvol opgeslagen!");
    } else {
      alert("Fout bij opslaan: " + result.error);
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

  const filteredReservations = reservations.filter((r) => {
    const matchesDate = reservationFilterDate ? r.date === reservationFilterDate : true;
    const searchLower = reservationSearchQuery.toLowerCase();
    const matchesSearch = reservationSearchQuery ? (r.sNumber && r.sNumber.toLowerCase().includes(searchLower)) || (r.email && r.email.toLowerCase().includes(searchLower)) : true;
    return matchesDate && matchesSearch;
  });

  const filteredNoShows = noShows.filter((log) => {
    const searchLower = noShowSearchQuery.toLowerCase();
    return noShowSearchQuery ? (log.sNumber && log.sNumber.toLowerCase().includes(searchLower)) || (log.email && log.email.toLowerCase().includes(searchLower)) : true;
  });

  return {
    user,
    setUser,
    loading,
    events,
    reservations,
    filteredReservations,
    reservationFilterDate,
    setReservationFilterDate,
    reservationSearchQuery,
    setReservationSearchQuery,
    noShowSearchQuery,
    setNoShowSearchQuery,
    filteredNoShows,
    highscores,
    rosters,
    timetable,
    noShows,
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
    handleStatusUpdate,
    handleResetStrikes,
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
