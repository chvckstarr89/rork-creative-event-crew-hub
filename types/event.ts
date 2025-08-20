export interface ShotItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  location?: string;
  equipment?: string[];
  assignedTo?: string[];
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  type: 'photo' | 'video' | 'both';
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  type: 'preparation' | 'shooting' | 'break' | 'transition';
}

export interface Note {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  coverImage: string;
  client: string;
  type: 'wedding' | 'corporate' | 'portrait' | 'commercial' | 'documentary';
  team: TeamMember[];
  shotList: ShotItem[];
  timeline: TimelineItem[];
  notes: Note[];
  status: 'upcoming' | 'active' | 'completed';
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'photographer' | 'videographer' | 'assistant' | 'director';
  avatar?: string;
  isOnline?: boolean;
}