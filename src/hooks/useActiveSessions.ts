import { useState, useEffect } from 'react';
// import { supabase } from "@/integrations/supabase/client"; // Supabase 클라이언트 임포트 삭제
// import { useAuth } from "@/contexts/AuthContext"; // useAuth 임포트 삭제

export interface ActiveSession {
  id: string;
  user_id: string;
  group_id?: string;
  start_time: string;
  is_paused: boolean;
  paused_duration: number;
  total_duration: number;
  task_name?: string;
}

export function useActiveSessions(groupId?: string) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  // const { user } = useAuth(); // user 객체 사용 삭제

  useEffect(() => {
    // Supabase 관련 로직 (fetchSessions, channel 구독 등) 전체 삭제
    console.log("useActiveSessions (local): Returning empty sessions. GroupId received:", groupId);
    setSessions([]); // 항상 빈 배열 반환
  }, [groupId]); // groupId는 파라미터로 받을 수 있으므로 의존성 유지 (현재는 사용되지 않음)

  return sessions;
}
