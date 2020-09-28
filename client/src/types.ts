import { Moment } from "moment";

export interface Series {
  id: number;
  idMal: number;
  title: { english: string; romaji: string; userPreferred: string };
  description: string;
  siteUrl: string;
  coverImage: { extraLarge: string; medium: string };
  episodes: number;
}

export interface EventSeries {
  id: number;
  seriesId: number;
  details: Series | undefined;
  episode: number;
  episodes: number;
}

export interface User {
  id?: number;
  name: string;
  avatar: string;
  email: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  image?: string;
  start: Moment;
  end: Moment;
  series: EventSeries[];
  attendees?: User[];
  attending?: number;
  streamer?: User;
  streaming?: boolean;
  roomcode?: string;
}

export interface Poll {
  id?: number;
  title: string;
  description?: string;
  end: Moment;
  options: PollOption[];
}

export enum PollOptionType {
  General = "General",
  Series = "Series"
}

export interface PollOption {
  id: number;
  content: number | string | Series | undefined;
  type: PollOptionType;
  users?: User[];
  voted?: boolean;
}
