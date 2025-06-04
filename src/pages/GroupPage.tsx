import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { Group, User } from "@/types";
// import { supabase } from "@/integrations/supabase/client";
import { GroupSettings } from "@/components/groups/GroupSettings";
import { useActiveSessions } from "@/hooks/useActiveSessions";
import { GroupMessages } from "@/components/groups/GroupMessages";
import { GroupActiveSessions } from "@/components/groups/GroupActiveSessions";
import { GroupMembersList } from "@/components/groups/GroupMembersList";
import { groups as mockGroups, users as mockUsers } from "@/data/mockData";

const GroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const activeSessions = useActiveSessions(groupId);
  
  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupData = async () => {
      setLoading(true);
      try {
        console.log(`Fetching group data for groupId: ${groupId} (local)`);
        const foundGroup = mockGroups.find(g => g.id === groupId);
        
        if (foundGroup) {
          setGroup(foundGroup);
          setMembers(foundGroup.members || []);
        } else {
          setGroup(null);
          setMembers([]);
        }
      } catch (error) {
        console.error("Error fetching group data (local):", error);
        setGroup(null);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);
  
  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full text-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
        </div>
      </PageLayout>
    );
  }
  
  if (!group) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-full text-white">
          <h1 className="text-2xl font-bold mb-4">그룹을 찾을 수 없습니다 (로컬)</h1>
          <p className="text-zinc-400">요청하신 ID의 그룹이 목업 데이터에 없습니다.</p>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="flex flex-col h-screen">
        <header className="bg-zinc-800 p-4 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{group.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-white">{group.name}</h1>
                <p className="text-sm text-zinc-400">{members.length}명의 멤버</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="bg-zinc-700 border-zinc-600"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={18} />
            </Button>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          <GroupMessages groupId={groupId!} members={members} />
          
          <div className="w-64 border-l border-zinc-700 bg-zinc-800 p-4 hidden md:block">
            <div className="mb-6">
              <h2 className="text-md font-bold text-white mb-4">그룹 정보</h2>
              <p className="text-sm text-zinc-400">{group.description || '설명이 없습니다.'}</p>
            </div>
            
            <GroupActiveSessions sessions={activeSessions} />
            <GroupMembersList members={members} />
          </div>
        </div>
      </div>
      
      <GroupSettings 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </PageLayout>
  );
};

export default GroupPage;
