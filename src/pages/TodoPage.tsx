
import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
import { tasks as initialTasks } from "@/data/mockData";
import { Task } from "@/types";

const TodoPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskText, setNewTaskText] = useState("");
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState("");
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask: Task = {
      id: `task${Date.now()}`,
      title: newTaskText,
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };
  
  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  const startEditTask = (task: Task) => {
    setEditTaskId(task.id);
    setEditTaskText(task.title);
  };
  
  const handleSaveEdit = () => {
    if (!editTaskText.trim() || !editTaskId) return;
    
    setTasks(tasks.map(task => 
      task.id === editTaskId ? { ...task, title: editTaskText } : task
    ));
    
    setEditTaskId(null);
    setEditTaskText("");
  };
  
  return (
    <div className="bg-zinc-900 overflow-hidden min-h-screen font-['Pretendard']">
      <div className="gap-5 flex">
        <div className="w-64 max-md:w-full max-md:ml-0">
          <Sidebar />
        </div>
        <div className="flex-1 p-6">
          <h1 className="text-white text-xl font-bold mb-6">할 일 관리</h1>
          
          <form onSubmit={handleAddTask} className="flex mb-6 gap-2">
            <Input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="새로운 할 일을 입력하세요"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <Button type="submit" className="bg-zinc-700 hover:bg-zinc-600">
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </form>
          
          <div className="space-y-2">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-center bg-zinc-800 p-3 rounded-md"
              >
                <Checkbox 
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task.id)}
                  className="mr-2"
                />
                
                {editTaskId === task.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editTaskText}
                      onChange={(e) => setEditTaskText(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white"
                      autoFocus
                    />
                    <Button onClick={handleSaveEdit} size="sm">
                      저장
                    </Button>
                  </div>
                ) : (
                  <>
                    <span 
                      className={`flex-1 text-white ${task.completed ? 'line-through text-zinc-400' : ''}`}
                    >
                      {task.title}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => startEditTask(task)}
                      className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                할 일이 없습니다. 새로운 할 일을 추가해보세요!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoPage;
