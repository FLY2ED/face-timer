import { Group, Task, User, Message, TimerSession } from "@/types";

// 사용자 데이터
export const users: User[] = [
  {
    id: "user1",
    name: "나",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    totalTime: 23400000, // 6.5 시간을 밀리초로
  },
  {
    id: "user2",
    name: "홍길동",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    totalTime: 18000000, // 5 시간을 밀리초로
  },
  {
    id: "user3",
    name: "김철수",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
    totalTime: 28800000, // 8 시간을 밀리초로
  },
  {
    id: "user4",
    name: "이영희",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
    totalTime: 14400000, // 4 시간을 밀리초로
  },
  {
    id: "user5",
    name: "박지민",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user5",
    totalTime: 36000000, // 10 시간을 밀리초로
  }
];

// 그룹 데이터
export const groups: Group[] = [
  {
    id: "group1",
    name: "Naldadev Company",
    icon: "https://cdn.builder.io/api/v1/image/assets/d7c89c52e3414f6099da7e8a2dd0a8eb/b18a53d2bf232f2c093469b4019f5f69c38c4161?placeholderIfAbsent=true",
    members: [users[0], users[1], users[2]],
  },
  {
    id: "group2",
    name: "정보처리산업기사 준비",
    icon: "https://cdn.builder.io/api/v1/image/assets/d7c89c52e3414f6099da7e8a2dd0a8eb/fa3d7d11711ea73ccb3adcac5d20daba27210c01?placeholderIfAbsent=true",
    members: [users[0], users[3], users[4]],
  }
];

// 작업 데이터
export const tasks: Task[] = [
  {
    id: "task1",
    title: "시간 관리 플랫폼 개발",
    completed: false,
    groupId: "group1",
    icon: "https://cdn.builder.io/api/v1/image/assets/d7c89c52e3414f6099da7e8a2dd0a8eb/47d50fc4ee18e87903d3b4e7a5700031f0704c7a?placeholderIfAbsent=true",
  },
  {
    id: "task2",
    title: "정보처리산업기사",
    completed: false,
    groupId: "group2",
    icon: "https://cdn.builder.io/api/v1/image/assets/d7c89c52e3414f6099da7e8a2dd0a8eb/71bc4628e9d03addfa0523912da54dffaa8f366e?placeholderIfAbsent=true",
  },
  {
    id: "task3",
    title: "프론트엔드 리팩토링",
    completed: false,
    groupId: "group1",
  },
  {
    id: "task4",
    title: "데이터베이스 설계",
    completed: true,
    groupId: "group1",
  },
  {
    id: "task5",
    title: "운영체제 공부",
    completed: false,
    groupId: "group2",
  },
];

// 메시지 데이터
export const messages: Message[] = [
  {
    id: "msg1",
    groupId: "group1",
    userId: "user2",
    userName: "홍길동",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    content: "오늘 프론트엔드 작업 마무리했습니다.",
    timestamp: new Date(2024, 3, 14, 9, 30),
  },
  {
    id: "msg2",
    groupId: "group1",
    userId: "user3",
    userName: "김철수",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
    content: "API 연동 작업 중입니다. 오늘 중으로 완료할 예정입니다.",
    timestamp: new Date(2024, 3, 14, 10, 15),
  },
  {
    id: "msg3",
    groupId: "group2",
    userId: "user4",
    userName: "이영희",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
    content: "데이터베이스 파트 문제 풀었습니다. 공유해 드릴게요.",
    timestamp: new Date(2024, 3, 14, 11, 0),
  },
];

// 타이머 세션 데이터
export const timerSessions: TimerSession[] = [
  {
    id: "session1",
    taskId: "task1",
    userId: "user1",
    groupId: "group1",
    startTime: new Date(2024, 3, 13, 10, 0),
    endTime: new Date(2024, 3, 13, 12, 30),
    duration: 9000000, // 2.5시간을 밀리초로
  },
  {
    id: "session2",
    taskId: "task2",
    userId: "user1",
    groupId: "group2",
    startTime: new Date(2024, 3, 13, 14, 0),
    endTime: new Date(2024, 3, 13, 16, 0),
    duration: 7200000, // 2시간을 밀리초로
  },
];

export const defaultTasks: Task[] = [
  {
    id: "default-1",
    title: "학습",
    icon: "GraduationCap",
    requiresAuth: false
  },
  {
    id: "default-2",
    title: "업무",
    icon: "Briefcase",
    requiresAuth: false
  },
  {
    id: "default-3",
    title: "독서",
    icon: "BookOpen",
    requiresAuth: false
  },
  {
    id: "default-4",
    title: "코딩",
    icon: "Code",
    requiresAuth: false
  },
];
