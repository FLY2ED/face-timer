import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { SearchGroupDialog } from "./SearchGroupDialog";
import { AddGroupDialog } from "./AddGroupDialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  icon?: string;
}

export const GroupList: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const [isSearchGroupOpen, setIsSearchGroupOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      console.log("Fetching groups (local) - returning empty list for now.");
      setGroups([]);
    } catch (error) {
      console.error("Error fetching groups (local):", error);
      toast({
        title: "오류 (로컬)",
        description: "그룹 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = () => {
    setIsAddGroupOpen(true);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      console.log(`Joining group (local): ${groupId}`);

      setIsSearchGroupOpen(false);
      fetchGroups();

      toast({
        title: "참여 완료 (로컬)",
        description: "그룹에 성공적으로 참여했습니다 (실제 서버 저장 없음).",
      });
    } catch (error) {
      console.error("Error joining group (local):", error);
      toast({
        title: "오류 (로컬)",
        description: "그룹 참여 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="mt-6 px-2">
        {state === "expanded" && (
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-zinc-400 text-xs font-medium tracking-[0.56px]">그룹</h2>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-7 w-7" 
                onClick={() => setIsSearchGroupOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-7 w-7" 
                onClick={handleAddGroup}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
        <div className={cn(
          "space-y-1",
          state === "collapsed" && "flex flex-col items-center gap-2"
        )}>
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={cn(
                "bg-zinc-700/20 rounded-md animate-pulse",
                state === "expanded" ? "h-8" : "h-8 w-8 rounded-full"
              )} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {state === "expanded" && (
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-zinc-400 text-xs font-medium tracking-[0.56px]">그룹</h2>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-7 w-7" 
              onClick={() => setIsSearchGroupOpen(true)}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-7 w-7" 
              onClick={handleAddGroup}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      
      <div className={cn(
        "space-y-0.5",
        state === "collapsed" && "flex flex-col items-center gap-2 py-2"
      )}>
        {groups.map(group => (
          state === "expanded" ? (
            <button
              key={group.id}
              onClick={() => navigate(`/group/${group.id}`)}
              className={cn(
                "w-full p-2 flex items-center gap-2 rounded-md",
                "hover:bg-white/5 transition-colors"
              )}
            >
              <div className="flex-shrink-0">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={group.icon} />
                  <AvatarFallback className="text-xs">
                    {group.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-sm text-zinc-300">{group.name}</span>
            </button>
          ) : (
            <button
              key={group.id}
              onClick={() => navigate(`/group/${group.id}`)}
              className="group"
            >
              <Avatar
                className={cn(
                  "h-8 w-8 transition-transform hover:scale-110",
                  "ring-1 ring-offset-1 ring-offset-zinc-800",
                  "hover:ring-blue-500"
                )}
              >
                <AvatarImage src={group.icon} />
                <AvatarFallback className="text-xs">
                  {group.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </button>
          )
        ))}
      </div>
      
      <SearchGroupDialog 
        open={isSearchGroupOpen} 
        onOpenChange={setIsSearchGroupOpen} 
        onJoinGroup={handleJoinGroup} 
      />
      
      <AddGroupDialog 
        open={isAddGroupOpen}
        onOpenChange={setIsAddGroupOpen}
        onGroupAdded={fetchGroups}
      />
    </div>
  );
};
