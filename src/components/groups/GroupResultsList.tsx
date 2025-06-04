
import React from "react";
import { GroupCard } from "./GroupCard";

interface Group {
  id: string;
  name: string;
  icon: string;
  category?: string;
  members?: number;
}

interface GroupListProps {
  groups: Group[];
  onJoinGroup: (groupId: string) => void;
}

export const GroupList: React.FC<GroupListProps> = ({ groups, onJoinGroup }) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        검색 결과가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {groups.map(group => (
        <GroupCard
          key={group.id}
          {...group}
          onJoinGroup={onJoinGroup}
        />
      ))}
    </div>
  );
};
