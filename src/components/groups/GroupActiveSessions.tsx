
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDuration } from "@/utils/timeUtils";
import { ActiveSession } from "@/hooks/useActiveSessions";

interface GroupActiveSessionsProps {
  sessions: ActiveSession[];
}

export const GroupActiveSessions = ({ sessions }: GroupActiveSessionsProps) => {
  const sortedSessions = [...sessions].sort((a, b) => b.total_duration - a.total_duration);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
        현재 활동 중 ({sortedSessions.length})
      </h3>
      <div className="space-y-2">
        {sortedSessions.map((session) => (
          <div key={session.id} className="bg-zinc-700/50 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{session.task_name?.substring(0, 2) || "??"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xs font-medium text-zinc-300 truncate max-w-[100px]">
                  {session.task_name}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {session.is_paused ? '일시정지' : '공부중'}
                </div>
              </div>
            </div>
            <div className="text-xs text-zinc-300">
              {formatDuration(session.total_duration)}
            </div>
          </div>
        ))}
        {sortedSessions.length === 0 && (
          <div className="text-xs text-zinc-400 text-center py-2">
            현재 공부 중인 멤버가 없습니다
          </div>
        )}
      </div>
    </div>
  );
};
