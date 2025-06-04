import React, { useState, useEffect } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { Button } from "@/components/ui/button";
import { Plus, Clock, BookOpen, Briefcase, MoreHorizontal, GraduationCap, Code, Music, Dumbbell, Coffee, Heart } from "lucide-react";
import { AddTaskDialog } from "./AddTaskDialog";
import { cn } from "@/lib/utils";
import { defaultTasks as mockTasks, users as mockUsers } from "@/data/mockData";
import { Task as AppTask } from "@/types";

interface Task {
  id: string;
  title: string;
  icon?: string;
  group_id: string;
  color?: string;
}

// 아이콘 매핑 객체 (아이콘 이름과 컴포넌트 매핑)
const iconMapping: Record<string, React.ElementType> = {
  GraduationCap,
  Briefcase,
  BookOpen,
  Code,
  Music,
  Dumbbell,
  Coffee,
  Heart,
  MoreHorizontal,
  // 이름으로 Lucide 아이콘 매핑
  Clock,
  Plus
};

interface TaskSelectorProps {
  onRequireAuth: (action: string) => boolean;
}

const MOCK_CURRENT_USER_ID = mockUsers[0]?.id || "user1";

export const TaskSelector: React.FC<TaskSelectorProps> = ({ onRequireAuth }) => {
  const { startTimer, activeTask } = useTimer();
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log("Fetching tasks (local) using mockData.defaultTasks");
      setTasks(mockTasks);
    } catch (error) {
      console.error("Error fetching tasks (local):", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const handleTaskAdded = (event: Event) => {
      const customEvent = event as CustomEvent<AppTask>;
      setTasks(prevTasks => [...prevTasks, customEvent.detail]);
    };

    window.addEventListener('taskAdded', handleTaskAdded);
    return () => window.removeEventListener('taskAdded', handleTaskAdded);
  }, []);

  const handleAddTask = () => {
    if (onRequireAuth('새 작업 추가')) {
      setShowAddTask(true);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center">
        <div className="w-full max-w-sm space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-zinc-700/20 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0 && !showAddTask) {
    return (
      <div className="mt-8 flex flex-col items-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Clock className="h-8 w-8 text-zinc-400" />
          <div className="space-y-1">
            <p className="text-sm text-zinc-300">아직 작업이 없습니다</p>
            <p className="text-xs text-zinc-500">새 작업을 추가하고 시간을 측정해보세요</p>
          </div>
        </div>
        <AddTaskDialog
          open={showAddTask}
          onOpenChange={setShowAddTask}
          onAddTask={(newTask) => {
            window.dispatchEvent(new CustomEvent('taskAdded', { detail: newTask }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="w-full max-w-sm space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => startTimer(task)}
            className={cn(
              "w-full p-3 flex items-center gap-3 rounded-md text-white",
              "hover:bg-white/10 transition-colors",
              activeTask?.id === task.id && "bg-blue-500/20 ring-1 ring-blue-500"
            )}
          >
            <div className="flex-shrink-0">
              {task.icon && iconMapping[task.icon] ? (
                <div 
                  className="h-6 w-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: task.color || "#3F3F46" }}
                >
                  {React.createElement(iconMapping[task.icon], { 
                    className: "w-4 h-4 text-white"
                  })}
                </div>
              ) : (
                <div 
                  className="h-6 w-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: task.color || "#3F3F46" }}
                >
                  <span className="text-xs font-medium">
                    {task.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm">{task.title}</span>
          </button>
        ))}
      </div>

      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        onAddTask={(newTask) => {
          setTasks(prev => [...prev, newTask]);
        }}
      />
    </div>
  );
};