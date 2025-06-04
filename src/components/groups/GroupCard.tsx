
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GroupCardProps {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  members?: number;
  onJoinGroup: (groupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  id,
  name,
  icon,
  category,
  members,
  onJoinGroup,
}) => {
  return (
    <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg hover:bg-zinc-800 transition-all duration-200">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm">{name}</p>
            {members !== undefined && (
              <Badge variant="outline" className="text-xs bg-zinc-800">
                {members}명
              </Badge>
            )}
          </div>
          {category && (
            <Badge className="mt-1 text-[10px] bg-zinc-700 text-white">
              {category}
            </Badge>
          )}
        </div>
      </div>
      <Button 
        size="sm" 
        onClick={() => onJoinGroup(id)}
        className="bg-zinc-700 hover:bg-zinc-600"
      >
        참여하기
      </Button>
    </div>
  );
};
