import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, UserPlus } from "lucide-react";
import { GroupMemberList } from "./settings/GroupMemberList";
import { GroupInviteForm } from "./settings/GroupInviteForm";
import { GroupInfoForm } from "./settings/GroupInfoForm";
import { toast } from "@/hooks/use-toast";
import { users as mockUsers, groups as mockGroups } from "@/data/mockData";
import { User as AppUser } from "@/types";

interface GroupMember {
  id: string;
  user_id: string;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

const MOCK_CURRENT_USER_ID = mockUsers[0]?.id || "user1";

export const GroupSettings: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { groupId } = useParams<{ groupId: string }>();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && groupId) {
      const fetchGroupData = async () => {
        setLoading(true);
        try {
          console.log(`Fetching group data for groupId: ${groupId} (local)`);
          const group = mockGroups.find(g => g.id === groupId);
          if (group) {
            setGroupName(group.name);
            setGroupDescription(group.description || "");
            setIsCreator(group.created_by === MOCK_CURRENT_USER_ID || (groupId === "group1" && MOCK_CURRENT_USER_ID === "user1"));

            const membersFromMock = group.members?.map((member: AppUser, index: number) => ({
              id: `mock-member-${index}`,
              user_id: member.id,
              joined_at: new Date().toISOString(),
              display_name: member.name,
              avatar_url: member.avatar,
            })) || [];
            setGroupMembers(membersFromMock);

          } else {
            setGroupName("알 수 없는 그룹");
            setGroupDescription("");
            setGroupMembers([]);
            setIsCreator(false);
          }

        } catch (error) {
          console.error("Error fetching group data (local):", error);
          toast({
            title: "오류 (로컬)",
            description: "그룹 정보를 로드하는 중 문제가 발생했습니다",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchGroupData();
    }
  }, [open, groupId]);

  const handleUpdateGroupInfo = (name: string, description: string) => {
    setGroupName(name);
    setGroupDescription(description);
    console.log("Group info updated (local):", { name, description });
    toast({ title: "그룹 정보 업데이트 (로컬)", description: "로컬에서 그룹 정보가 업데이트되었습니다." });
  };

  const handleRemoveMember = async (memberId: string) => {
    console.log("Removing member (local):", memberId);
    setGroupMembers(prev => prev.filter(member => member.id !== memberId));
    toast({ title: "멤버 삭제 (로컬)", description: "로컬에서 멤버가 삭제되었습니다." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-800 text-white border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">그룹 설정</DialogTitle>
          <DialogDescription className="text-zinc-400">
            그룹 정보를 관리하고 멤버를 초대하세요
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-700">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              정보
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              멤버 ({groupMembers.length})
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              초대
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            <GroupInfoForm
              groupId={groupId!}
              groupName={groupName}
              groupDescription={groupDescription}
              isCreator={isCreator}
              onUpdate={handleUpdateGroupInfo}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-4 space-y-4">
            <GroupMemberList
              members={groupMembers}
              isCreator={isCreator}
              currentUserId={MOCK_CURRENT_USER_ID}
              onRemoveMember={handleRemoveMember}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="invite" className="mt-4 space-y-4">
            <GroupInviteForm groupId={groupId!} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
