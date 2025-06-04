import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Task } from "@/types";
import { groups } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Briefcase, MoreHorizontal, GraduationCap, Code, Music, Dumbbell, Coffee, Heart, Zap, Film, Paintbrush, Book, Monitor, Users, Star, Home, MapPin, Clock } from "lucide-react";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask?: (task: Task) => void;
}

// 어두운 테마에 맞는 노션 스타일의 색상 팔레트
const taskColors = [
  { name: "기본", value: "#37352F" },
  { name: "회색", value: "#787774" },
  { name: "갈색", value: "#9F6B53" },
  { name: "주황", value: "#D9730D" },
  { name: "노랑", value: "#CB912F" },
  { name: "초록", value: "#448361" },
  { name: "파랑", value: "#337EA9" },
  { name: "보라", value: "#9065B0" },
  { name: "분홍", value: "#C14C8A" },
  { name: "빨강", value: "#D44C47" },
  // 추가 색상
  { name: "연두", value: "#83B555" },
  { name: "청록", value: "#4299A1" },
  { name: "남색", value: "#1857B6" },
  { name: "자주", value: "#6B399C" },
  { name: "카키", value: "#5D5D2F" },
  { name: "라벤더", value: "#9A6DD7" },
  { name: "코랄", value: "#E07B67" },
  { name: "터쿼이즈", value: "#4DBBAC" },
];

// 확장된 아이콘 목록
const taskIcons = [
  { name: "학습", value: "GraduationCap", icon: GraduationCap },
  { name: "업무", value: "Briefcase", icon: Briefcase },
  { name: "독서", value: "BookOpen", icon: BookOpen },
  { name: "코딩", value: "Code", icon: Code },
  { name: "음악", value: "Music", icon: Music },
  { name: "운동", value: "Dumbbell", icon: Dumbbell },
  { name: "휴식", value: "Coffee", icon: Coffee },
  { name: "취미", value: "Heart", icon: Heart },
  { name: "영감", value: "Zap", icon: Zap },
  { name: "영화", value: "Film", icon: Film },
  { name: "예술", value: "Paintbrush", icon: Paintbrush },
  { name: "공부", value: "Book", icon: Book },
  { name: "기술", value: "Monitor", icon: Monitor },
  { name: "모임", value: "Users", icon: Users },
  { name: "중요", value: "Star", icon: Star },
  { name: "집", value: "Home", icon: Home },
  { name: "장소", value: "MapPin", icon: MapPin },
  { name: "시간", value: "Clock", icon: Clock },
  { name: "기타", value: "MoreHorizontal", icon: MoreHorizontal },
];

export const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ open, onOpenChange, onAddTask }) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedColor, setSelectedColor] = useState("#37352F");
  const [selectedIcon, setSelectedIcon] = useState(taskIcons[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      icon: selectedIcon.value,
      color: selectedColor,
      groupId: selectedGroup || undefined,
      requiresAuth: true,
    };

    try {
      // Supabase에 작업 저장
      // const { data, error } = await supabase
      //   .from('tasks')
      //   .insert([{
      //       user_id: "1",
      //     title: taskTitle,
      //     icon: selectedIcon.value,
      //     group_id: selectedGroup || null,
      //     color: selectedColor
      //   }]);

      // if (error) throw error;

      if (onAddTask) {
        onAddTask(newTask);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("작업 추가 중 오류 발생:", error);
      alert("작업을 추가하는 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTaskTitle("");
    setSelectedGroup("");
    setSelectedColor("#37352F");
    setSelectedIcon(taskIcons[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-800 border-zinc-700 rounded-lg shadow-lg p-0">
        <div className="p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-lg font-medium text-zinc-200">새 작업 추가</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 작업명 입력 필드 - 노션 스타일 간소화된 입력 */}
            <div className="space-y-2">
              <Input
                id="task-name"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="text-lg font-medium border-0 border-b border-zinc-700 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-zinc-500 bg-transparent text-zinc-200"
                placeholder="작업 이름을 입력하세요"
                required
              />
            </div>
            
            {/* 그룹 선택 */}
            <div className="space-y-2">
              <Label htmlFor="group" className="text-sm text-zinc-400">
                그룹
              </Label>
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
              >
                <SelectTrigger className="w-full border-zinc-700 bg-zinc-800 text-zinc-200">
                  <SelectValue placeholder="그룹 선택" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 아이콘과 색상 선택 탭 */}
            <Tabs defaultValue="icon" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-700 rounded-lg p-1">
                <TabsTrigger value="icon" className="rounded-md text-sm text-zinc-300 data-[state=active]:bg-zinc-600 data-[state=active]:text-zinc-100">아이콘</TabsTrigger>
                <TabsTrigger value="color" className="rounded-md text-sm text-zinc-300 data-[state=active]:bg-zinc-600 data-[state=active]:text-zinc-100">색상</TabsTrigger>
              </TabsList>
              
              {/* 아이콘 선택 */}
              <TabsContent value="icon" className="mt-4">
                <div className="grid grid-cols-5 gap-2">
                  {taskIcons.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm transition-all ${
                        selectedIcon.value === icon.value
                          ? "bg-zinc-700 ring-1 ring-zinc-600"
                          : "hover:bg-zinc-700/50"
                      }`}
                      onClick={() => setSelectedIcon(icon)}
                    >
                      <div 
                        className="w-8 h-8 mb-1 flex items-center justify-center rounded-md"
                        style={{ backgroundColor: selectedColor }}
                      >
                        <icon.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs text-zinc-300 font-medium">{icon.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
              
              {/* 색상 선택 */}
              <TabsContent value="color" className="mt-4">
                <div className="grid grid-cols-6 gap-3">
                  {taskColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`relative h-12 rounded-md transition-all ${
                        selectedColor === color.value
                          ? "ring-2 ring-offset-2 ring-offset-zinc-800 ring-zinc-400"
                          : "hover:opacity-80"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      aria-label={`색상: ${color.name}`}
                    >
                      {selectedColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* 미리보기 - 노션 스타일 간소화 */}
            <div className="mt-4 py-4 border-t border-zinc-700">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: selectedColor }}
                >
                  <selectedIcon.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-zinc-300">
                  {taskTitle || "새 작업"}
                </span>
              </div>
            </div>
            
            <DialogFooter className="pt-3 border-t border-zinc-700">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mr-2 bg-transparent border-zinc-600 hover:bg-zinc-700 text-zinc-300"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={!taskTitle || isSubmitting} 
                className="bg-zinc-600 hover:bg-zinc-500 text-white"
              >
                {isSubmitting ? "추가 중..." : "추가하기"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
