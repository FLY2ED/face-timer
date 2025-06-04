import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  Clock,
  Moon,
  Sun,
  User,
  CreditCard,
  Camera,
  MessageSquare,
  Globe,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { users as mockUsers } from "@/data/mockData";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_USER = mockUsers[0] || { id: "user1", name: "나", email: "user@example.local", avatar: "" };

type SettingsObjectCategories = 'notifications' | 'appearance' | 'timer';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string>(MOCK_USER.name);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(MOCK_USER.avatar || "");
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      emailDigest: true,
      groupMessages: true,
    },
    appearance: {
      darkMode: true,
      compactMode: false,
    },
    timer: {
      soundEnabled: true,
      autoBreak: true,
      breakInterval: 25,
      breakDuration: 5,
      autoCameraDetection: false,
    },
    language: "ko",
  });

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      let updatedAvatarUrl = avatarUrl;
      
      if (avatar) {
        updatedAvatarUrl = URL.createObjectURL(avatar);
        console.log("Avatar updated locally (no server upload):", updatedAvatarUrl);
      }
      
      toast.success("프로필이 로컬에서 업데이트되었습니다 (서버 저장 없음).");
      setAvatarUrl(updatedAvatarUrl);
      MOCK_USER.name = displayName;
      MOCK_USER.avatar = updatedAvatarUrl;
      
    } catch (error) {
      console.error("프로필 업데이트 오류 (로컬):", error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`프로필 업데이트 실패 (로컬): ${message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB를 초과할 수 없습니다.");
        return;
      }
      
      setAvatar(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleViewPricing = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  const updateSetting = (
    category: SettingsObjectCategories,
    setting: string,
    value: boolean | string | number
  ) => {
    setSettings((prev) => {
      const categorySettings = prev[category];
      return {
        ...prev,
        [category]: {
          ...categorySettings,
          [setting]: value,
        },
      };
    });
  };

  const handleLogout = async () => {
    console.log("Logout requested (local) - closing modal.");
    toast.success("로그아웃 되었습니다 (로컬).");
    onOpenChange(false);
  };

  const switchClasses = "data-[state=unchecked]:bg-zinc-800 data-[state=checked]:bg-zinc-600 [&_span[data-state=unchecked]]:bg-zinc-400 [&_span[data-state=checked]]:bg-zinc-300";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900/95 backdrop-blur-sm text-white border-zinc-700 sm:max-w-[600px] max-h-[85vh] overflow-y-auto shadow-xl rounded-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-semibold">설정</DialogTitle>
          <DialogDescription className="text-zinc-400">
            NALDA 앱의 다양한 설정을 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <div className="px-6">
            <TabsList className="grid grid-cols-4 bg-zinc-800 p-1 rounded-lg">
              <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100 py-1.5 text-sm">
                <User className="h-4 w-4 mr-2" />
                프로필
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100 py-1.5 text-sm">
                <SettingsIcon className="h-4 w-4 mr-2" /> 
                환경설정
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100 py-1.5 text-sm">
                <Bell className="h-4 w-4 mr-2" />
                알림
              </TabsTrigger>
              <TabsTrigger value="subscription" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100 py-1.5 text-sm">
                <CreditCard className="h-4 w-4 mr-2" />
                구독
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 py-4">
            <TabsContent value="profile" className="mt-4">
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-zinc-700">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-zinc-700 text-zinc-300 text-2xl">
                      {displayName?.substring(0, 1).toUpperCase() || MOCK_USER.email?.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline"
                    className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 hover:border-zinc-600 text-sm px-4 py-1.5 h-auto rounded-md"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    프로필 이미지 변경
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-zinc-400 text-xs">이름</Label>
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-md mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-zinc-400 text-xs">이메일</Label>
                    <Input
                      id="email"
                      value={MOCK_USER.email || ""}
                      disabled
                      className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 rounded-md mt-1"
                    />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? "저장 중..." : "프로필 저장"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-medium text-zinc-200">외관</h3>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Moon className="h-4 w-4 text-zinc-400" />
                    <span>다크 모드</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.appearance.darkMode}
                    onCheckedChange={(checked) =>
                      updateSetting("appearance", "darkMode", checked)
                    }
                  />
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Sun className="h-4 w-4 text-zinc-400" /> 
                    <span>컴팩트 모드</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) =>
                      updateSetting("appearance", "compactMode", checked)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-medium text-zinc-200">타이머</h3>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>소리 알림</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.timer.soundEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("timer", "soundEnabled", checked)
                    }
                  />
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>자동 휴식</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.timer.autoBreak}
                    onCheckedChange={(checked) =>
                      updateSetting("timer", "autoBreak", checked)
                    }
                  />
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Camera className="h-4 w-4 text-zinc-400" />
                    <span>카메라 자동 감지</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.timer.autoCameraDetection}
                    onCheckedChange={(checked) =>
                      updateSetting("timer", "autoCameraDetection", checked)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-medium text-zinc-200">언어</h3>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Globe className="h-4 w-4 text-zinc-400" />
                    <span>언어 설정</span>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      updateSetting("appearance", "language", e.target.value)
                    }
                    className="bg-zinc-700 border border-zinc-600 text-zinc-200 rounded-md px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4 space-y-4">
                <h3 className="text-base font-medium text-zinc-200">알림 설정</h3>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Bell className="h-4 w-4 text-zinc-400" />
                    <span>푸시 알림</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.notifications.pushEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "pushEnabled", checked)
                    }
                  />
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <MessageSquare className="h-4 w-4 text-zinc-400" />
                    <span>그룹 메시지 알림</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.notifications.groupMessages}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "groupMessages", checked)
                    }
                  />
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Bell className="h-4 w-4 text-zinc-400" />
                    <span>주간 이메일 요약</span>
                  </div>
                  <Switch
                    className={switchClasses}
                    checked={settings.notifications.emailDigest}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "emailDigest", checked)
                    }
                  />
                </div>
            </TabsContent>

            <TabsContent value="subscription" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                  <h3 className="text-base font-medium text-zinc-200 mb-2">현재 구독</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-white">무료</p>
                      <p className="text-sm text-zinc-400">기본 기능만 이용 가능</p>
                    </div>
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 h-auto rounded-md" onClick={handleViewPricing}>업그레이드</Button>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                  <h3 className="text-base font-medium text-zinc-200 mb-2">무료 요금제 한도</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">그룹 참여</span>
                      <span className="text-zinc-200">3/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">이력 조회</span>
                      <span className="text-zinc-200">7일</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">카메라 자동 감지</span>
                      <span className="text-blue-400">프로 전용</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                  <h3 className="text-base font-medium text-zinc-200 mb-2">결제 내역</h3>
                  <p className="text-sm text-zinc-400">결제 내역이 없습니다.</p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-6 px-6 pb-6 pt-4 border-t border-zinc-700">
          <Button
            variant="destructive"
            className="w-full font-semibold py-2.5 rounded-md"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
