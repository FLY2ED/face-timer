
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GroupMember {
  id: string;
  user_id: string;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface GroupMemberListProps {
  members: GroupMember[];
  isCreator: boolean;
  currentUserId?: string;
  onRemoveMember?: (memberId: string) => void;
  loading?: boolean;
}

export const GroupMemberList = ({ 
  members, 
  isCreator, 
  currentUserId,
  onRemoveMember,
  loading
}: GroupMemberListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          그룹에 멤버가 없습니다
        </div>
      ) : (
        members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {member.display_name?.substring(0, 2) || "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {member.display_name || "사용자"}
                </div>
                <div className="text-xs text-zinc-400">
                  {new Date(member.joined_at).toLocaleDateString()}부터 참여
                </div>
              </div>
            </div>

            {isCreator && member.user_id !== currentUserId && (
              <Button 
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-500/10"
                onClick={() => onRemoveMember?.(member.user_id)}
              >
                제거
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
};
