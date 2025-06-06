
import React, { useState } from "react";
import { useUserStatus } from "@/contexts/UserStatusContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Crown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SettingsModal } from "../settings/SettingsModal";
import { useSidebar } from "@/components/ui/sidebar";

// Define avatar sizes first
const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

export const UserProfile: React.FC<{
  userId?: string;
  showSettings?: boolean;
  size?: "sm" | "md" | "lg";
}> = ({ userId, showSettings = true, size = "md" }) => {
  const { status } = useUserStatus();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { state } = useSidebar();
  
  const email = "";

  if (true) {
    return (
      <div className="border-t border-zinc-700 flex w-full items-center gap-2 font-normal whitespace-nowrap justify-between mt-auto px-3 py-4">
        <div className="flex items-center gap-2 text-white">
          <Avatar className={avatarSizes[size]}>
            <AvatarFallback className="bg-zinc-700 text-white">
              <User size={18} />
            </AvatarFallback>
          </Avatar>
          {state === "expanded" && <span className="text-sm">로그인 해주세요</span>}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-orange-600";
      case "timing":
        return "bg-red-500";
      case "resting":
        return "bg-yellow-400";
      case "offline":
        return "bg-zinc-400";
      default:
        return "bg-zinc-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "온라인";
      case "timing":
        return "집중 중";
      case "resting":
        return "휴식 중";
      case "offline":
        return "오프라인";
      default:
        return "상태 알 수 없음";
    }
  };

  return (
    <>
      <div className="border-t border-zinc-700 flex w-full items-center gap-2 font-normal whitespace-nowrap justify-between mt-auto px-3 py-4">
        <div className="flex items-center gap-2 text-white">
          <div className="relative">
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={"https://github.com/shadcn.png"} />
              <AvatarFallback className="bg-zinc-700 text-white">
                {email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute bottom-0 right-0 ${getStatusColor(status)} h-2.5 w-2.5 rounded-full border border-zinc-800`} 
              aria-label={getStatusText(status)}
            />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="text-sm flex items-center gap-1 truncate max-w-[130px]">
                {email}
                <Crown className="h-4 w-4 text-yellow-500" aria-label="Free Plan" />
              </span>
              <span className="text-xs text-zinc-400">{getStatusText(status)}</span>
            </div>
          )}
        </div>
        {showSettings && state === "expanded" && (
          <button 
            className="text-zinc-400 hover:text-white p-1"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={18} />
          </button>
        )}
      </div>
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal} 
      />
    </>
  );
};
