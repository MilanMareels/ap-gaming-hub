// Admin Page types
export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

export interface Highscore {
  id: string;
  game: string;
  player: string;
  score: number;
  status: string;
}

export interface Reservation {
  id: string;
  sNumber: string;
  email: string;
  inventory: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface RosterData {
  [game: string]: { name: string; handle: string; role: string; rank: string }[];
}

export interface DaySchedule {
  day: string;
  slots: { start: string; end: string; label: string; type: "open" | "team" | "closed" }[];
}
