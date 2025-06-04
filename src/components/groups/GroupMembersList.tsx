
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { User } from "@/types";

interface GroupMembersListProps {
  members: User[];
}

export const GroupMembersList = ({ members }: GroupMembersListProps) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Users className="h-3 w-3" />
        멤버 ({members.length})
      </h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-zinc-300">{member.name}</span>
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-xs text-zinc-400 text-center py-2">
            그룹에 멤버가 없습니다
          </div>
        )}
      </div>
    </div>
  );
};
