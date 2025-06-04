
export interface Task {
  id: string;
  title: string;
  icon?: string;
  requiresAuth?: boolean;
  groupId?: string;
  color?: string;
  completed?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  totalTime?: number;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  members?: User[];
}

export interface Message {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
}

export interface TimerSession {
  id: string;
  taskId: string;
  userId: string;
  groupId?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
  color?: string;
}

export interface DailyStats {
  date: string;
  duration: number;
  tasks: {
    [key: string]: number;
  };
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  duration: number;
  tasks: {
    [key: string]: number;
  };
}

export interface MonthlyStats {
  month: string;
  year: string;
  duration: number;
  tasks: {
    [key: string]: number;
  };
}

export interface RankingUser {
  id: string;
  name: string;
  avatar?: string;
  totalTime: number;
  rank: number;
  category?: string;
}
