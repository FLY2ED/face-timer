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
  resetDailyRecords: () => void;
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
  resetDailyRecords: () => {},
};

const TimerContext = createContext<TimerContextType>(defaultContext);

export const useTimer = () => useContext(TimerContext);

// 로컬 스토리지 키
const TIMER_STATE_KEY = "timer_state";
const TASK_TIMES_KEY = "task_times";
const LAST_RESET_DATE_KEY = "last_reset_date";

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

  // 하루 기록 초기화 체크 함수
  const checkAndResetDaily = () => {
    try {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem(LAST_RESET_DATE_KEY);
      
      console.log("📅 날짜 체크:", { today, lastResetDate });
      
      if (lastResetDate !== today) {
        console.log("🔄 하루가 지나서 기록을 초기화합니다.");
        
        // 기록 초기화
        setTaskTimes({});
        localStorage.removeItem(TASK_TIMES_KEY);
        localStorage.removeItem(TIMER_STATE_KEY);
        
        // 현재 실행 중인 타이머도 초기화
        setActiveTask(null);
        setIsActive(false);
        setIsPaused(false);
        setElapsedTime(0);
        setLastElapsedTime(0);
        setStartTime(null);
        setPausedTime(0);
        
        // 마지막 초기화 날짜 업데이트
        localStorage.setItem(LAST_RESET_DATE_KEY, today);
        
        console.log("✅ 하루 기록 초기화 완료");
      }
    } catch (error) {
      console.error("하루 기록 초기화 체크 중 오류:", error);
    }
  };

  // 수동 하루 기록 초기화 함수
  const resetDailyRecords = () => {
    try {
      console.log("🔄 수동으로 하루 기록을 초기화합니다.");
      
      // 기록 초기화
      setTaskTimes({});
      localStorage.removeItem(TASK_TIMES_KEY);
      localStorage.removeItem(TIMER_STATE_KEY);
      
      // 현재 실행 중인 타이머도 초기화
      setActiveTask(null);
      setIsActive(false);
      setIsPaused(false);
      setElapsedTime(0);
      setLastElapsedTime(0);
      setStartTime(null);
      setPausedTime(0);
      
      // 마지막 초기화 날짜를 오늘로 설정
      const today = new Date().toDateString();
      localStorage.setItem(LAST_RESET_DATE_KEY, today);
      
      console.log("✅ 하루 기록 수동 초기화 완료");
    } catch (error) {
      console.error("하루 기록 수동 초기화 중 오류:", error);
    }
  };

  // 로컬 스토리지에서 타이머 상태 불러오기
  useEffect(() => {
    // 먼저 하루 초기화 체크
    checkAndResetDaily();
    
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

  // 앱이 활성화될 때마다 날짜 체크 (포커스 이벤트)
  useEffect(() => {
    const handleFocus = () => {
      checkAndResetDaily();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAndResetDaily();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  // isPaused 상태 변화 추적
  useEffect(() => {
    console.log("🔄 isPaused 상태 변화:", {
      이전값: "추적불가",
      현재값: isPaused,
      isActive,
      activeTask: activeTask?.title || null,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [isPaused]);

  // isActive 상태 변화 추적
  useEffect(() => {
    console.log("🔄 isActive 상태 변화:", {
      이전값: "추적불가", 
      현재값: isActive,
      isPaused,
      activeTask: activeTask?.title || null,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [isActive]);

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
    console.log("⏸️ pauseTimer 호출됨 - 현재 상태:", {
      isActive,
      isPaused,
      elapsedTime,
      activeTask: activeTask?.title || null,
      조건충족: isActive && !isPaused
    });
    
    if (isActive && !isPaused) {
      console.log("✅ pauseTimer 조건 충족 - 일시정지 실행");
      setIsPaused(true);
      // 일시정지 시 현재 경과 시간 저장
      setLastElapsedTime(elapsedTime);
      console.log(`✅ 타이머 일시정지 완료: ${elapsedTime}ms에서 멈춤`);
    } else {
      console.log("❌ pauseTimer 조건 미충족:", {
        isActive: isActive ? "✅" : "❌",
        isPausedNot: !isPaused ? "✅" : "❌",
        현재isPaused값: isPaused
      });
    }
  };

  const resumeTimer = () => {
    console.log("▶️ resumeTimer 호출됨 - 현재 상태:", {
      isPaused,
      isActive,
      lastElapsedTime,
      elapsedTime,
      activeTask: activeTask?.title || null,
      조건충족: isPaused
    });
    
    if (isPaused) {
      console.log("✅ resumeTimer 조건 충족 - 재개 실행");
      console.log("타이머 재개 전:", {
        lastElapsedTime,
        현재시간: Date.now()
      });
      
      // 일시정지된 시간부터 계속하기 위해 시작 시간 조정
      // 현재 시간에서 마지막으로 기록된 경과 시간을 빼면 시작 시간이 됨
      const newStartTime = Date.now() - lastElapsedTime;
      setStartTime(newStartTime);
      setIsPaused(false);
      
      console.log("✅ 타이머 재개 완료:", {
        조정된시작시간: newStartTime,
        계속할경과시간: lastElapsedTime
      });
    } else {
      console.log("❌ resumeTimer 조건 미충족 - isPaused가 false임:", {
        현재isPaused값: isPaused,
        isActive,
        elapsedTime
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
        resetDailyRecords,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
