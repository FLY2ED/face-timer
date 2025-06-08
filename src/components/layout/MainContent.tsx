import React, { useState } from "react";
import { Timer } from "../timer/Timer";
import { TaskSelector } from "../tasks/TaskSelector";
import { useTimer } from "@/contexts/TimerContext";
import { Button } from "../ui/button";
import { Plus, RotateCcw } from "lucide-react";
import { AddTaskDialog } from "../tasks/AddTaskDialog";
import { cn } from "@/lib/utils";

export const MainContent: React.FC = () => {
  const { isActive, resetDailyRecords } = useTimer();
  const isAuthenticated = true;
  const [showAddTask, setShowAddTask] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);

  const handleRequireAuth = (action: string) => {
    console.log(`Action requiring auth (local): ${action} - allowing.`);
    return true;
  };

  const handleAddTask = () => {
    if (handleRequireAuth('새 작업 추가')) {
      setShowAddTask(true);
    }
  };

  const handleCameraModeChange = (isOn: boolean) => {
    console.log("📷 MainContent: 카메라 모드 변경", { isOn });
    setIsCameraMode(isOn);
  };

  return (
    <main className={cn(
      "flex w-full flex-col text-white mx-auto relative transition-all duration-500",
      isCameraMode 
        ? "max-w-4xl ring-2 ring-orange-500/50 ring-offset-zinc-900 rounded-3xl" 
        : "max-w-sm"
    )}>
      <div className={cn(
        "px-10 pb-6 pt-3 rounded-lg transition-all duration-500",
        isCameraMode && "bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/10"
      )}>
        <Timer onCameraModeChange={handleCameraModeChange} />
        <TaskSelector 
          onRequireAuth={handleRequireAuth} 
          disabled={isActive}
        />
      </div>
      
      {isAuthenticated && (
        <>
          <Button
            variant="default"
            onClick={() => {
              if (
                window.confirm(
                  "정말로 오늘의 모든 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                )
              ) {
                resetDailyRecords();
              }
            }}
            className="fixed top-8 right-8 z-10 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800/50"
            title="기록 초기화"
          >
            기록 초기화
          </Button>

          <Button
            onClick={handleAddTask}
            className="fixed bottom-8 right-8 flex items-center gap-2 px-4 h-12 rounded-2xl bg-zinc-700 hover:bg-zinc-600 shadow-lg transition-colors duration-200"
          >
            <Plus className="h-5 w-5 text-zinc-200" />
            <span className="text-zinc-200">새 작업</span>
          </Button>

          <AddTaskDialog
            open={showAddTask}
            onOpenChange={setShowAddTask}
            onAddTask={(newTask) => {
              window.dispatchEvent(new CustomEvent('taskAdded', { detail: newTask }));
            }}
          />
        </>
      )}
    </main>
  );
};
