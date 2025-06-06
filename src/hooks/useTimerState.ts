import { useState, useRef, useCallback, useEffect } from 'react';
import { Task } from '@/types';
import { FaceAnalysisResult } from '@/hooks/useFaceDetection';
import { useTimer } from '@/contexts/TimerContext';
import { formatDuration } from '@/utils/timeUtils';

// 타이머 상태 관리용 커스텀 훅
export const useTimerState = () => {
  // 기존 TimerContext 사용
  const timerContext = useTimer();
  
  // 카메라 & 얼굴 감지 상태
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isWaitingForFace, setIsWaitingForFace] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);
  const [faceDetectedStartTime, setFaceDetectedStartTime] = useState<number | null>(null);
  const [lastAnalysisResult, setLastAnalysisResult] = useState<FaceAnalysisResult | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [formattedTime, setFormattedTime] = useState("00:00:00");
  const [taskTimes, setTaskTimes] = useState<Record<string, number>>({});
  
  // Refs
  const faceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 작업 시간 로드
  const loadTaskTimes = useCallback(() => {
    try {
      const savedTaskTimes = JSON.parse(localStorage.getItem("task_times") || "{}");
      setTaskTimes(savedTaskTimes);
    } catch {
      setTaskTimes({});
    }
  }, []);

  // 모든 작업의 총 시간 계산
  const getTotalTaskTime = useCallback(() => {
    return Object.values(taskTimes).reduce((total, time) => total + time, 0);
  }, [taskTimes]);

  // 포맷된 시간 업데이트
  useEffect(() => {
    if (timerContext.isActive) {
      // 타이머 진행 중에는 현재 경과 시간 표시
      setFormattedTime(formatDuration(timerContext.elapsedTime));
    } else if (timerContext.activeTask) {
      // 타이머 정지 상태이지만 활성 작업이 있으면 해당 작업의 총 시간 표시
      const activeTaskTotalTime = (taskTimes[timerContext.activeTask.id] || 0) + timerContext.elapsedTime;
      setFormattedTime(formatDuration(activeTaskTotalTime));
    } else {
      // 작업이 없으면 전체 총 시간 표시
      const totalTime = getTotalTaskTime();
      setFormattedTime(formatDuration(totalTime));
    }
  }, [timerContext.elapsedTime, timerContext.isActive, timerContext.activeTask, getTotalTaskTime, taskTimes]);

  // 작업 시간 주기적 로드
  useEffect(() => {
    loadTaskTimes();
    const interval = setInterval(loadTaskTimes, 1000);
    const handleStorageChange = () => loadTaskTimes();
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [loadTaskTimes]);

  // 카메라 모드 관련 액션들
  const cameraActions = {
    enableCameraMode: useCallback(() => {
      setIsCameraMode(true);
    }, []),

    disableCameraMode: useCallback(() => {
      setIsCameraMode(false);
      setIsWaitingForFace(false);
      setCanStartTimer(false);
      setFaceDetectedStartTime(null);
      setLastAnalysisResult(null);
      setIsVideoReady(false);
    }, []),

    startFaceWaiting: useCallback(() => {
      setIsWaitingForFace(true);
      setCanStartTimer(false);
      setFaceDetectedStartTime(null);
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
    }, []),

    stopFaceWaiting: useCallback(() => {
      setIsWaitingForFace(false);
    }, []),

    setFaceDetectedStartTime: useCallback((time: number | null) => {
      setFaceDetectedStartTime(time);
    }, []),

    setCanStartTimer: useCallback((canStart: boolean) => {
      setCanStartTimer(canStart);
    }, []),

    setLastAnalysisResult: useCallback((result: FaceAnalysisResult | null) => {
      setLastAnalysisResult(result);
    }, []),

    setIsVideoReady: useCallback((ready: boolean) => {
      setIsVideoReady(ready);
    }, []),

    setIsWaitingForFace: useCallback((waiting: boolean) => {
      setIsWaitingForFace(waiting);
    }, []),

    setIsCameraMode: useCallback((mode: boolean) => {
      setIsCameraMode(mode);
    }, []),

    setTaskTimes: useCallback((times: Record<string, number>) => {
      setTaskTimes(times);
    }, []),

    setFormattedTime: useCallback((time: string) => {
      setFormattedTime(time);
    }, []),

    resetTimer: useCallback(() => {
      timerContext.resetTimer();
      // 얼굴 감지 상태 리셋
      setIsWaitingForFace(false);
      setCanStartTimer(false);
      setFaceDetectedStartTime(null);
      setLastAnalysisResult(null);
      setIsVideoReady(false);
      // 카메라 모드 비활성화
      setIsCameraMode(false);
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
    }, [timerContext]),

    resetAllFaceStates: useCallback(() => {
      setIsWaitingForFace(false);
      setCanStartTimer(false);
      setFaceDetectedStartTime(null);
      setLastAnalysisResult(null);
      setIsVideoReady(false);
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
    }, []),
  };

  // 타이머 액션들 (TimerContext 래핑)
  const timerActions = {
    startTimer: useCallback((task: Task) => {
      const previousTime = taskTimes[task.id] || 0;
      timerContext.startTimer(task);
      cameraActions.stopFaceWaiting();
      cameraActions.setCanStartTimer(false);
    }, [timerContext, taskTimes, cameraActions]),

    handleStopTimer: useCallback(() => {
      console.log("🛑 타이머 정지 시작");
      
      if (timerContext.activeTask) {
        console.log("Timer session stopped (local):", {
          taskId: timerContext.activeTask.id,
          duration: timerContext.elapsedTime,
        });
        
        // 작업 시간 저장
        const currentTaskTimes = { ...taskTimes };
        currentTaskTimes[timerContext.activeTask.id] = timerContext.elapsedTime;
        localStorage.setItem('task_times', JSON.stringify(currentTaskTimes));
        setTaskTimes(currentTaskTimes);
      }
      
      // 타이머 정지 (stopTimer 사용하여 시간 기록 보존)
      timerContext.stopTimer();
      
      // 얼굴 감지 관련 상태 완전 초기화
      cameraActions.resetAllFaceStates();
      
      // 카메라 모드 비활성화
      cameraActions.disableCameraMode();
      
      console.log("✅ 타이머 정지 완료");
    }, [timerContext, cameraActions, taskTimes]),

    pauseTimer: useCallback(() => {
      timerContext.pauseTimer();
    }, [timerContext]),

    resumeTimer: useCallback(() => {
      timerContext.resumeTimer();
    }, [timerContext]),

    handlePause: useCallback(() => {
      if (timerContext.isPaused) {
        timerContext.resumeTimer();
      } else {
        timerContext.pauseTimer();
      }
    }, [timerContext]),
  };

  // 5초 타이머 시작
  const startFaceDetectionTimer = useCallback(() => {
    if (faceDetectedStartTime) return; // 이미 시작됨
    
    console.log("👤 첫 얼굴 감지 시작 - 5초 대기 시작");
    const currentTime = Date.now();
    setFaceDetectedStartTime(currentTime);
    
    faceDetectionTimeoutRef.current = setTimeout(() => {
      console.log("⏰ 5초 대기 완료 - 타이머 시작 가능");
      setCanStartTimer(true);
    }, 5000);
  }, [faceDetectedStartTime]);

  return {
    // 상태들
    ...timerContext,
    isCameraMode,
    isWaitingForFace,
    canStartTimer,
    faceDetectedStartTime,
    lastAnalysisResult,
    isVideoReady,
    formattedTime,
    taskTimes,
    
    // Refs
    faceDetectionTimeoutRef,
    
    // 액션들
    ...cameraActions,
    ...timerActions,
    startFaceDetectionTimer,
    loadTaskTimes,
    getTotalTaskTime,
  };
}; 