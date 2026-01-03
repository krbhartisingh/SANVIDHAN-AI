
export enum UserMode {
  CITIZEN = 'Citizen',
  STUDENT = 'Student',
  LEGAL = 'Legal Awareness'
}

export enum SubscriptionPlan {
  FREE = 'Free',
  PREMIUM = 'Premium',
  STUDENT_INSTITUTION = 'Student/Institution'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isVoice?: boolean;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Bookmark {
  id: string;
  articleId: string;
  title: string;
  content: string;
}

export interface AppState {
  mode: UserMode;
  plan: SubscriptionPlan;
  language: string;
  isDarkMode: boolean;
  messages: Message[];
  bookmarks: Bookmark[];
  constitutionPdf: string | null; // base64
}
