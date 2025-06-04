import React, { useState } from "react";
import { Timer } from "../timer/Timer";
import { TaskSelector } from "../tasks/TaskSelector";
import { useTimer } from "@/contexts/TimerContext";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { AddTaskDialog } from "../tasks/AddTaskDialog";
import { cn } from "@/lib/utils";

export const MainContent: React.FC = () => {
  const { isActive } = useTimer();
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
    setIsCameraMode(isOn);
  };

  return (
    <main className={cn(
      "flex w-full flex-col text-white mx-auto relative transition-all duration-500",
      isCameraMode 
        ? "max-w-4xl ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-900 rounded-lg" 
        : "max-w-sm"
    )}>
      <div className={cn(
        "p-4 rounded-lg transition-all duration-500",
        isCameraMode && "bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"
      )}>
        <Timer onCameraModeChange={handleCameraModeChange} />
        <TaskSelector onRequireAuth={handleRequireAuth} />
      </div>
      
      {isAuthenticated && (
        <>
          <Button
            onClick={handleAddTask}
            className="fixed bottom-8 right-8 flex items-center gap-2 px-4 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 shadow-lg border border-zinc-600 transition-colors duration-200"
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
