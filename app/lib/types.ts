export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

export interface Player {
  name: string;
  handle: string;
  role: string;
  rank: string;
}

export interface RosterData {
  [game: string]: Player[];
}

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
  type: "open" | "team" | "event";
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface Highscore {
  id: string;
  game: string;
  player: string;
  score: number;
  status: "pending" | "approved";
  timestamp: any;
}

export interface SiteSettings {
  googleFormUrl: string;
}

export interface SiteLists {
  rosterGames: string[];
  highscoreGames: string[];
  eventTypes: string[];
}

export interface Reservation {
  id: string;
  sNumber: string;
  email: string;
  inventory: "PC" | "PS5";
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}
