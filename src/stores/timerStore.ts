import { useReducer, useCallback } from 'react';
import { FaceAnalysisResult } from '@/hooks/useFaceDetection';

// Task 타입 임시 정의 (기존 타입 파일 대신)
interface Task {
  id: string;
  title: string;
  icon?: string;
  color?: string;
}

// 타이머 상태 타입 정의
export interface TimerState {
  // 타이머 기본 상태
  isActive: boolean;
  isPaused: boolean;
  elapsedTime: number;
  activeTask: Task | null;
  
  // 카메라 & 얼굴 감지 상태
  isCameraMode: boolean;
  isWaitingForFace: boolean;
  canStartTimer: boolean;
  faceDetectedStartTime: number | null;
  lastAnalysisResult: FaceAnalysisResult | null;
  
  // 기타 상태
  isVideoReady: boolean;
  formattedTime: string;
  taskTimes: Record<string, number>;
}

// 액션 타입 정의
export type TimerAction =
  | { type: 'START_TIMER'; payload: { task: Task; previousTime?: number } }
  | { type: 'STOP_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'SET_FORMATTED_TIME'; payload: string }
  | { type: 'SET_TASK_TIMES'; payload: Record<string, number> }
  | { type: 'ENABLE_CAMERA_MODE' }
  | { type: 'DISABLE_CAMERA_MODE' }
  | { type: 'START_FACE_WAITING' }
  | { type: 'STOP_FACE_WAITING' }
  | { type: 'SET_CAN_START_TIMER'; payload: boolean }
  | { type: 'SET_FACE_DETECTED_TIME'; payload: number | null }
  | { type: 'SET_ANALYSIS_RESULT'; payload: FaceAnalysisResult | null }
  | { type: 'SET_VIDEO_READY'; payload: boolean }
  | { type: 'RESET_ALL_FACE_STATES' };

// 초기 상태
const initialState: TimerState = {
  isActive: false,
  isPaused: false,
  elapsedTime: 0,
  activeTask: null,
  isCameraMode: false,
  isWaitingForFace: false,
  canStartTimer: false,
  faceDetectedStartTime: null,
  lastAnalysisResult: null,
  isVideoReady: false,
  formattedTime: "00:00:00",
  taskTimes: {},
};

// Reducer 함수
export const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        activeTask: action.payload.task,
        isActive: true,
        isPaused: false,
        elapsedTime: action.payload.previousTime || 0,
        isWaitingForFace: false,
        canStartTimer: false,
      };

    case 'STOP_TIMER': {
      // 작업별 시간 저장
      const updatedTaskTimes = { ...state.taskTimes };
      if (state.activeTask && state.isActive) {
        updatedTaskTimes[state.activeTask.id] = state.elapsedTime;
      }
      return {
        ...state,
        isActive: false,
        isPaused: false,
        taskTimes: updatedTaskTimes,
      };
    }

    case 'RESET_TIMER': {
      // 작업별 시간 저장 후 완전 초기화
      const finalTaskTimes = { ...state.taskTimes };
      if (state.activeTask && state.isActive) {
        finalTaskTimes[state.activeTask.id] = state.elapsedTime;
      }
      return {
        ...initialState,
        taskTimes: finalTaskTimes,
        formattedTime: state.formattedTime, // 포맷된 시간은 유지
      };
    }

    case 'PAUSE_TIMER':
      return {
        ...state,
        isPaused: true,
      };

    case 'RESUME_TIMER':
      return {
        ...state,
        isPaused: false,
      };

    case 'UPDATE_ELAPSED_TIME':
      return {
        ...state,
        elapsedTime: action.payload,
      };

    case 'SET_FORMATTED_TIME':
      return {
        ...state,
        formattedTime: action.payload,
      };

    case 'SET_TASK_TIMES':
      return {
        ...state,
        taskTimes: action.payload,
      };

    case 'ENABLE_CAMERA_MODE':
      return {
        ...state,
        isCameraMode: true,
      };

    case 'DISABLE_CAMERA_MODE':
      return {
        ...state,
        isCameraMode: false,
        isWaitingForFace: false,
        canStartTimer: false,
        faceDetectedStartTime: null,
        lastAnalysisResult: null,
        isVideoReady: false,
      };

    case 'START_FACE_WAITING':
      return {
        ...state,
        isWaitingForFace: true,
        canStartTimer: false,
        faceDetectedStartTime: null,
      };

    case 'STOP_FACE_WAITING':
      return {
        ...state,
        isWaitingForFace: false,
      };

    case 'SET_CAN_START_TIMER':
      return {
        ...state,
        canStartTimer: action.payload,
      };

    case 'SET_FACE_DETECTED_TIME':
      return {
        ...state,
        faceDetectedStartTime: action.payload,
      };

    case 'SET_ANALYSIS_RESULT':
      return {
        ...state,
        lastAnalysisResult: action.payload,
      };

    case 'SET_VIDEO_READY':
      return {
        ...state,
        isVideoReady: action.payload,
      };

    case 'RESET_ALL_FACE_STATES':
      return {
        ...state,
        isWaitingForFace: false,
        canStartTimer: false,
        faceDetectedStartTime: null,
        lastAnalysisResult: null,
        isVideoReady: false,
      };

    default:
      return state;
  }
};

// 커스텀 훅 - Pinia store처럼 사용
export const useTimerStore = () => {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  // Actions (메서드들)
  const actions = {
    startTimer: useCallback((task: Task, previousTime?: number) => {
      dispatch({ type: 'START_TIMER', payload: { task, previousTime } });
    }, []),

    stopTimer: useCallback(() => {
      dispatch({ type: 'STOP_TIMER' });
    }, []),

    resetTimer: useCallback(() => {
      dispatch({ type: 'RESET_TIMER' });
    }, []),

    pauseTimer: useCallback(() => {
      dispatch({ type: 'PAUSE_TIMER' });
    }, []),

    resumeTimer: useCallback(() => {
      dispatch({ type: 'RESUME_TIMER' });
    }, []),

    updateElapsedTime: useCallback((time: number) => {
      dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: time });
    }, []),

    setFormattedTime: useCallback((time: string) => {
      dispatch({ type: 'SET_FORMATTED_TIME', payload: time });
    }, []),

    setTaskTimes: useCallback((times: Record<string, number>) => {
      dispatch({ type: 'SET_TASK_TIMES', payload: times });
    }, []),

    enableCameraMode: useCallback(() => {
      dispatch({ type: 'ENABLE_CAMERA_MODE' });
    }, []),

    disableCameraMode: useCallback(() => {
      dispatch({ type: 'DISABLE_CAMERA_MODE' });
    }, []),

    startFaceWaiting: useCallback(() => {
      dispatch({ type: 'START_FACE_WAITING' });
    }, []),

    stopFaceWaiting: useCallback(() => {
      dispatch({ type: 'STOP_FACE_WAITING' });
    }, []),

    setCanStartTimer: useCallback((canStart: boolean) => {
      dispatch({ type: 'SET_CAN_START_TIMER', payload: canStart });
    }, []),

    setFaceDetectedTime: useCallback((time: number | null) => {
      dispatch({ type: 'SET_FACE_DETECTED_TIME', payload: time });
    }, []),

    setAnalysisResult: useCallback((result: FaceAnalysisResult | null) => {
      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: result });
    }, []),

    setVideoReady: useCallback((ready: boolean) => {
      dispatch({ type: 'SET_VIDEO_READY', payload: ready });
    }, []),

    resetAllFaceStates: useCallback(() => {
      dispatch({ type: 'RESET_ALL_FACE_STATES' });
    }, []),
  };

  return {
    // 상태들
    ...state,
    // 액션들
    ...actions,
  };
}; 