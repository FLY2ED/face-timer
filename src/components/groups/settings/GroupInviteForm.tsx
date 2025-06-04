
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GroupInviteFormProps {
  groupId: string;
}

export const GroupInviteForm = ({ groupId }: GroupInviteFormProps) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !groupId) return;
    
    setIsInviting(true);
    
    try {
      toast({
        title: "초대 전송됨",
        description: `${inviteEmail}로 초대 링크가 전송되었습니다`,
      });
      
      setInviteEmail("");
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({
        title: "오류",
        description: "초대 전송 중 문제가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm">
        새 멤버를 초대하려면 이메일을 입력하세요
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="이메일 주소"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="bg-zinc-700 border-zinc-600 text-white flex-1"
        />
        <Button 
          onClick={handleInviteMember}
          disabled={!inviteEmail.trim() || isInviting}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isInviting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "초대"
          )}
        </Button>
      </div>
      
      <div className="mt-6 bg-zinc-700/50 rounded-lg p-4">
        <p className="text-sm text-zinc-300">
          초대 링크를 공유할 수도 있습니다:
        </p>
        <div className="flex gap-2 mt-2">
          <Input
            readOnly
            value={`${window.location.origin}/invite/${groupId}`}
            className="bg-zinc-700 border-zinc-600 text-white flex-1 text-sm"
          />
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/invite/${groupId}`);
              toast({
                title: "복사됨",
                description: "초대 링크가 클립보드에 복사되었습니다",
              });
            }}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            복사
          </Button>
        </div>
      </div>
    </div>
  );
};
