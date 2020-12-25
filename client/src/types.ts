import { Moment } from "moment";

export interface Series {
  id: number;
  aniId: number;
  malId: number;
  title: string;
  description: string;
  siteUrl: string;
  image: string;
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
  discordImage?: string;
  start: Moment;
  end: Moment;
  media: Media[];
  attendees?: User[];
  attending?: number;
  streamer?: User;
  streaming?: boolean;
  roomcode?: string;
}

export interface Poll {
  id?: number;
  title: string;
  image: string;
  discordImage: string;
  description?: string;
  end: Moment;
  options: PollOption[];
}

export interface MediaReference {
  id?: number;
  name: string;
  type: string;
  apiId: string | null;
  url: string;
}

export interface Media {
  id?: number;
  type: string;
  title: string;
  description: string;
  genres: string[];
  image: string;
  trailer: string;
  episodes: number;
  duration: number;
  references: MediaReference[];
  EventMedia?: { episode: number; episodes: number; order: number };
}

export interface PollOption {
  id: number;
  content: string | undefined;
  media?: Media;
  votes: number[];
  voted?: number;
}
