import React, { createContext, useContext, useState, useEffect } from "react";
import { Task } from "@/types";

interface TimerContextType {
  activeTask: Task | null;
  isActive: boolean;
  isPaused: boolean;
  elapsedTime: number;
  startTimer: (task: Task) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const defaultContext: TimerContextType = {
  activeTask: null,
  isActive: false,
  isPaused: false,
  elapsedTime: 0,
  startTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  stopTimer: () => {},
  resetTimer: () => {},
};

const TimerContext = createContext<TimerContextType>(defaultContext);

export const useTimer = () => useContext(TimerContext);

// 로컬 스토리지 키
const TIMER_STATE_KEY = "timer_state";
const TASK_TIMES_KEY = "task_times";

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const [lastElapsedTime, setLastElapsedTime] = useState<number>(0);
  
  // 작업별 누적 시간을 저장하는 객체
  const [taskTimes, setTaskTimes] = useState<Record<string, number>>({});

  // 로컬 스토리지에서 타이머 상태 불러오기
  useEffect(() => {
    try {
      const savedTaskTimes = localStorage.getItem(TASK_TIMES_KEY);
      if (savedTaskTimes) {
        setTaskTimes(JSON.parse(savedTaskTimes));
      }

      const savedTimerState = localStorage.getItem(TIMER_STATE_KEY);
      if (savedTimerState) {
        const { task, elapsed, active, paused } = JSON.parse(savedTimerState);
        if (task) {
          setActiveTask(task);
          setElapsedTime(elapsed || 0);
          setLastElapsedTime(elapsed || 0);
          
          // 활성 상태였다면 재시작, 아니면 중지 상태로 유지
          if (active && !paused) {
            setIsActive(true);
            setIsPaused(false);
            setStartTime(Date.now() - elapsed);
          } else {
            setIsActive(active || false);
            setIsPaused(paused || false);
          }
        }
      }
    } catch (error) {
      console.error("타이머 상태 로드 중 오류:", error);
    }
  }, []);

  // 타이머 상태 저장
  const saveTimerState = () => {
    try {
      localStorage.setItem(TASK_TIMES_KEY, JSON.stringify(taskTimes));
      
      if (activeTask) {
        localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
          task: activeTask,
          elapsed: elapsedTime,
          active: isActive,
          paused: isPaused
        }));
      }
    } catch (error) {
      console.error("타이머 상태 저장 중 오류:", error);
    }
  };

  // 타이머 상태가 변경될 때마다 저장
  useEffect(() => {
    saveTimerState();
  }, [activeTask, elapsedTime, isActive, isPaused, taskTimes]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        if (startTime) {
          const currentElapsed = now - startTime;
          setElapsedTime(currentElapsed);
          setLastElapsedTime(currentElapsed);
        }
      }, 10);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isPaused, startTime]);

  const startTimer = (task: Task) => {
    // 이전 작업이 있었던 경우 해당 작업의 누적 시간 사용
    const previousTimeForTask = taskTimes[task.id] || 0;
    
    setActiveTask(task);
    setIsActive(true);
    setIsPaused(false);
    setPausedTime(0);
    
    if (previousTimeForTask > 0) {
      // 이전에 작업했던 시간이 있으면 이어서 진행
      console.log(`작업 ${task.id} 이어서 시작: ${previousTimeForTask}ms 부터`);
      setStartTime(Date.now() - previousTimeForTask);
      setElapsedTime(previousTimeForTask);
      setLastElapsedTime(previousTimeForTask);
    } else {
      // 새 작업이면 0부터 시작
      console.log(`작업 ${task.id} 새로 시작`);
      setStartTime(Date.now());
      setElapsedTime(0);
      setLastElapsedTime(0);
    }
  };

  const pauseTimer = () => {
    if (isActive && !isPaused) {
      setIsPaused(true);
      // 일시정지 시 현재 경과 시간 저장
      setLastElapsedTime(elapsedTime);
      // console.log(`타이머 일시정지: ${elapsedTime}ms에서 멈춤`);
    }
  };

  const resumeTimer = () => {
    if (isPaused) {
      console.log("타이머 재개 전:", {
        lastElapsedTime,
        현재시간: Date.now()
      });
      
      // 일시정지된 시간부터 계속하기 위해 시작 시간 조정
      // 현재 시간에서 마지막으로 기록된 경과 시간을 빼면 시작 시간이 됨
      const newStartTime = Date.now() - lastElapsedTime;
      setStartTime(newStartTime);
      setIsPaused(false);
      
      console.log("타이머 재개 후:", {
        조정된시작시간: newStartTime,
        계속할경과시간: lastElapsedTime
      });
    }
  };

  const stopTimer = () => {
    // 작업별 누적 시간 저장
    if (isActive && activeTask) {
      const taskId = activeTask.id;
      const updatedTaskTimes = { ...taskTimes };
      updatedTaskTimes[taskId] = elapsedTime;
      
      console.log(`작업 ${taskId} 종료: ${elapsedTime}ms 저장됨`);
      setTaskTimes(updatedTaskTimes);
      setLastElapsedTime(elapsedTime);
      
      // localStorage에 저장
      localStorage.setItem(TASK_TIMES_KEY, JSON.stringify(updatedTaskTimes));
    }
    
    setIsActive(false);
    setIsPaused(false);
    // activeTask는 유지 - setActiveTask(null);
    
    setStartTime(null);
    setPausedTime(0);
    
    // 타이머가 멈추면 현재 상태를 localStorage에 저장
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
      task: activeTask,
      elapsed: elapsedTime,
      active: false,
      paused: false
    }));
  };

  const resetTimer = () => {
    // 작업별 시간 초기화도 추가
    if (activeTask) {
      const taskId = activeTask.id;
      const updatedTaskTimes = { ...taskTimes };
      delete updatedTaskTimes[taskId];
      setTaskTimes(updatedTaskTimes);
      
      // localStorage에 저장
      localStorage.setItem(TASK_TIMES_KEY, JSON.stringify(updatedTaskTimes));
    }
    
    setActiveTask(null);
    setIsActive(false);
    setIsPaused(false);
    setElapsedTime(0);
    setLastElapsedTime(0);
    setStartTime(null);
    setPausedTime(0);
    
    // 타이머 상태 초기화
    localStorage.removeItem(TIMER_STATE_KEY);
  };

  return (
    <TimerContext.Provider
      value={{
        activeTask,
        isActive,
        isPaused,
        elapsedTime,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
