import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { formatDuration } from "@/utils/timeUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Square,
  AlertCircle,
  Clock,
  BookOpen,
  Briefcase,
  MoreHorizontal,
  GraduationCap,
  Code,
  Music,
  Dumbbell,
  Coffee,
  Heart,
  Settings,
  Eye,
  RotateCcw,
  ScanFace,
  Smile,
  Loader,
} from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection, FaceAnalysisResult } from "@/hooks/useFaceDetection";
import { useCameraPermissionContext } from "@/contexts/CameraPermissionContext";
import { CameraPreview } from "./CameraPreview";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { users as mockUsers } from "@/data/mockData"; // MOCK_USER 정의에 필요
import { useTimerState } from "@/hooks/useTimerState";

// 아이콘 매핑 객체 (TaskSelector와 동일)
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
  Clock,
};

// Secure Context 확인 함수
const isSecureContext = (): boolean => {
  return (
    window.isSecureContext ||
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
};

interface TimerProps {
  onCameraModeChange?: (isOn: boolean) => void;
}

const MOCK_USER_ID = mockUsers[0]?.id || "user1"; // 필요시 사용 (현재 Timer.tsx에서는 직접 사용 안함)

export const Timer: React.FC<TimerProps> = ({ onCameraModeChange }) => {
  // 새로운 타이머 상태 훅 사용
  const {
    // 모든 상태들
    isActive,
    isPaused,
    elapsedTime,
    activeTask,
    isCameraMode,
    isWaitingForFace,
    canStartTimer,
    faceDetectedStartTime,
    lastAnalysisResult,
    isVideoReady,
    formattedTime, // useTimerState에서 계산된 formattedTime 사용
    taskTimes,
    // Refs
    faceDetectionTimeoutRef,
    // 액션들
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    handleStopTimer,
    handlePause,
    enableCameraMode,
    disableCameraMode,
    startFaceWaiting,
    stopFaceWaiting,
    setCanStartTimer,
    setFaceDetectedStartTime,
    setLastAnalysisResult,
    setIsVideoReady,
    setIsWaitingForFace,
    setIsCameraMode,
    setTaskTimes,
    resetAllFaceStates,
    startFaceDetectionTimer,
    resetDailyRecords,
  } = useTimerState();
  
  // 카메라 권한 컨텍스트 추가
  const {
    permission: cameraPermission,
    requestPermission,
    availableCameras,
    selectedCameraId,
    openSelectionDialog,
  } = useCameraPermissionContext();
  
  const [restTime, setRestTime] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [hasTodaySession, setHasTodaySession] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null);
  const [isManualPause, setIsManualPause] = useState(false); // 수동 일시정지 여부
  const [pauseReason, setPauseReason] = useState<string | null>(null); // 일시정지 이유
  const [lastAutoResumeTime, setLastAutoResumeTime] = useState<number>(0); // 마지막 자동 재개 시간
  const [lastAutoPauseTime, setLastAutoPauseTime] = useState<number>(0); // 마지막 자동 일시정지 시간

  // -------------- 상태 Ref --------------
  // useFaceDetection 훅에서 전달받은 콜백이 최신 상태를 참조하도록 ref 사용
  const isCameraModeRef = useRef(isCameraMode);
  const isPausedRef = useRef(isPaused);
  const isWaitingForFaceRef = useRef(isWaitingForFace);
  const canStartTimerRef = useRef(canStartTimer);
  const isManualPauseRef = useRef(isManualPause);
  const isActiveRef = useRef(isActive);

  useEffect(() => { isCameraModeRef.current = isCameraMode; }, [isCameraMode]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isWaitingForFaceRef.current = isWaitingForFace; }, [isWaitingForFace]);
  useEffect(() => { canStartTimerRef.current = canStartTimer; }, [canStartTimer]);
  useEffect(() => { isManualPauseRef.current = isManualPause; }, [isManualPause]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // resume/pause 함수도 ref에 저장하여 항상 최신 함수를 호출하도록 함
  const resumeTimerRef = useRef(resumeTimer);
  const pauseTimerRef = useRef(pauseTimer);
  useEffect(() => { resumeTimerRef.current = resumeTimer; }, [resumeTimer]);
  useEffect(() => { pauseTimerRef.current = pauseTimer; }, [pauseTimer]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isCameraEnabled, videoRef, toggleCamera } = useCamera();
  
  // TimerContext 직접 접근 (상태 동기화 확인용)
  const timerContext = useTimer();

  // 얼굴 감지 콜백 (상태 ref 사용, dependencies 없음 -> 안정적인 레퍼런스 유지)
  const handleFaceDetected = useCallback((result: FaceAnalysisResult) => {
    if (!result) return;

    setLastAnalysisResult(result);

    // 얼굴 감지시 즉시 타이머 시작 (대기 중인 경우)
    if (isWaitingForFaceRef.current && !canStartTimerRef.current) {
      console.log("👀 얼굴 감지됨 - 타이머 시작 준비");
      setCanStartTimer(true);
      setFaceDetectedStartTime(Date.now());
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
    }

    // 자동 재개: 일시정지 상태이고 수동 일시정지가 아닌 경우
    if (
      isCameraModeRef.current &&
      isPausedRef.current &&
      !isManualPauseRef.current
    ) {
      console.log("▶️ 얼굴 감지 - 자동 재개");
      setIsManualPause(false);
      setPauseReason(null);
      resumeTimerRef.current();
    }
  }, []);

  const handleFaceNotDetected = useCallback(() => {
    // 얼굴 감지 대기 상태 리셋
    if (faceDetectionTimeoutRef.current) {
      clearTimeout(faceDetectionTimeoutRef.current);
      faceDetectionTimeoutRef.current = null;
    }
    setFaceDetectedStartTime(null);
    setCanStartTimer(false);

    // 자동 일시정지 조건 확인 로그
    console.log("🔍 자동 일시정지 조건 확인:", {
      isCameraMode: isCameraModeRef.current,
      isActive: isActiveRef.current,
      isPaused: isPausedRef.current,
      조건충족: isCameraModeRef.current && isActiveRef.current && !isPausedRef.current
    });

    // 자동 일시정지: 타이머가 활성 상태이고 일시정지되지 않았으면 일시정지
    if (
      isCameraModeRef.current &&
      isActiveRef.current &&
      !isPausedRef.current
    ) {
      console.log("⏸️ 얼굴 미감지 - 자동 일시정지");
      setIsManualPause(false);
      setPauseReason("얼굴이 감지되지 않아 일시정지되었습니다");
      pauseTimerRef.current();
    }
  }, []);

  const {
    isDetecting,
    startDetection,
    stopDetection,
    isModelLoaded,
    isCameraReady,
    isStable,
  } = useFaceDetection({
    videoRef,
    canvasRef,
    showPreview: true,
    onFaceDetected: handleFaceDetected,
    onFaceNotDetected: handleFaceNotDetected,
  });

  useEffect(() => {
    // 카메라 모드이고, 타이머가 비활성 상태이고, 모델이 로드됨 (작업 선택은 필요하지 않음)
    if (isCameraMode && !isActiveRef.current && isModelLoaded && !isDetecting) {
      console.log("🎬 얼굴 감지 시작 (작업 선택 불필요)");
      setIsWaitingForFace(true);
      setFaceDetectedStartTime(null);
      setCanStartTimer(false);
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
      startDetection();
    }
  }, [isCameraMode, isActiveRef.current, isModelLoaded, isDetecting]);

  useEffect(() => {
    if (!isCameraMode || isDetecting || !isModelLoaded || !isCameraEnabled) {
      return;
    }
    if (
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      videoRef.current.videoWidth > 0
    ) {
      startDetection();
    }
  }, [
    isCameraMode,
    isModelLoaded,
    isCameraEnabled,
    isCameraReady,
    isVideoReady,
    isDetecting,
    startDetection,
    videoRef,
  ]);

  // 안정화 상태 디버깅
  useEffect(() => {
    console.log("📱 안정화 상태 변화:", {
      isCameraMode,
      isDetecting,
      isStable,
      shouldShowStabilizing: isCameraMode && isDetecting && !isStable
    });
  }, [isCameraMode, isDetecting, isStable]);

  // canStartTimer가 true가 되면 작업 선택 없이는 대기, 작업이 있으면 타이머 시작
  useEffect(() => {
    if (canStartTimer && !isActiveRef.current) {
      if (activeTask) {
        console.log("🚀 자동 타이머 시작 (작업 이미 선택됨)");
        setIsWaitingForFace(false);
        setCanStartTimer(false);
        setPauseReason(null); // 타이머 시작시 일시정지 이유 초기화
        startTimer(activeTask);
      } else {
        console.log("⏳ 얼굴 인식 완료 - 작업 선택 대기 중");
        setIsWaitingForFace(false); // 얼굴 대기는 끝냄
        // canStartTimer는 유지하여 작업 선택 후 바로 시작되도록 함
      }
    }
  }, [canStartTimer, activeTask, isActiveRef.current, startTimer]);

  // 작업 선택 후 canStartTimer가 true이면 즉시 타이머 시작
  useEffect(() => {
    if (activeTask && canStartTimer && !isActiveRef.current && isCameraMode) {
      console.log("📋 작업 선택 후 즉시 타이머 시작");
      setCanStartTimer(false);
      setPauseReason(null); // 타이머 시작시 일시정지 이유 초기화
      startTimer(activeTask);
    }
  }, [activeTask, canStartTimer, isActiveRef.current, isCameraMode, startTimer]);

  // canStartTimer 상태 변화 추적
  useEffect(() => {
    console.log("🎛️ canStartTimer 상태 변화:", { 
      canStartTimer,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [canStartTimer]);

  // 간단한 상태 디버깅
  useEffect(() => {
    console.log("🔍 주요 상태:", { isCameraMode, isActive: isActiveRef.current, canStartTimer });
  }, [isCameraMode, isActiveRef.current, canStartTimer]);

  // isPaused 상태 변화 추적
  useEffect(() => {
    console.log("⏸️ isPaused 상태 변화:", { 
      isPaused, 
      isActive: isActiveRef.current, 
      isCameraMode,
      isManualPause,
      pauseReason,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [isPaused, isActiveRef.current, isCameraMode, isManualPause, pauseReason]);

  // 주요 상태들의 실시간 변화 추적
  useEffect(() => {
    // console.log("📊 전체 상태 스냅샷:", {
    //   isCameraMode: isCameraMode,
    //   useTimerState: {
    //     isActive: isActive,
    //     isPaused: isPaused,
    //     activeTask: activeTask?.title || "없음",
    //     elapsedTime: elapsedTime,
    //     formattedTime: formattedTime
    //   },
    //   timerContext: {
    //     isActive: timerContext.isActive,
    //     isPaused: timerContext.isPaused,
    //     activeTask: timerContext.activeTask?.title || "없음",
    //     elapsedTime: timerContext.elapsedTime
    //   },
    //   isWaitingForFace: isWaitingForFace,
    //   canStartTimer: canStartTimer,
    //   timestamp: new Date().toLocaleTimeString()
    // });
  }, [isCameraMode, isActiveRef.current, isPaused, activeTask, isWaitingForFace, canStartTimer, timerContext.isActive, timerContext.isPaused, timerContext.elapsedTime, formattedTime, elapsedTime]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
    };
  }, []);

  // 카메라 모드 꺼질 때 대기 상태 리셋
  useEffect(() => {
    if (!isCameraMode) {
      console.log("📷 카메라 모드 비활성화 - 대기 상태 리셋");
      if (faceDetectionTimeoutRef.current) {
        clearTimeout(faceDetectionTimeoutRef.current);
        faceDetectionTimeoutRef.current = null;
      }
      setFaceDetectedStartTime(null);
      setCanStartTimer(false);
      setIsWaitingForFace(false);
    }
  }, [isCameraMode]);

  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsCameraAvailable(false);
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        if (videoDevices.length === 0) {
          setIsCameraAvailable(null);
        } else {
          setIsCameraAvailable(true);
        }
      } catch (error) {
        console.error("카메라 가용성 확인 실패:", error);
        setIsCameraAvailable(null);
      }
    };
    checkCameraAvailability();
  }, []);

  useEffect(() => {
    const checkVideoReadyState = () => {
      if (videoRef.current) {
        const video = videoRef.current;
        const ready = video.readyState >= 2;
        setIsVideoReady(ready);
        if (!ready && isCameraEnabled) {
          setTimeout(checkVideoReadyState, 100);
        }
      } else if (isCameraEnabled) {
        setIsVideoReady(false);
        setTimeout(checkVideoReadyState, 200);
      } else {
        setIsVideoReady(false);
      }
    };
    if (isCameraEnabled) {
      checkVideoReadyState();
    } else {
      setIsVideoReady(false);
    }
  }, [isCameraEnabled, isCameraMode, videoRef]);

  const toggleCameraMode = async () => {
    const newMode = !isCameraMode;
    console.log("🔄 카메라 모드 전환 시작:", {
      newMode,
      currentCameraEnabled: isCameraEnabled,
    });

    if (newMode) {
      // 권한 확인
      if (cameraPermission !== "granted") {
        console.log("📋 카메라 권한 요청 중...");
        const result = await requestPermission();
        if (!result.success) {
          console.log("❌ 카메라 권한 거부됨");
          setTimeout(async () => {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
              );
              setIsCameraAvailable(videoDevices.length > 0);
            } catch (error) {
              console.error("카메라 재확인 실패:", error);
            }
          }, 1000);
          return;
        } else {
          console.log("✅ 카메라 권한 승인됨");
          setIsCameraAvailable(true);
        }
      }

      try {
        console.log("🎬 카메라 활성화 시작...");
        // 카메라 모드 진입 시 상태 초기화
        setLastAnalysisResult(null);
        setIsVideoReady(false);

        // 타이머가 아직 시작되지 않은 경우에만 얼굴 인식 대기 상태로 설정
        if (!isActiveRef.current) {
          setIsWaitingForFace(true);
        } else {
          setIsWaitingForFace(false);
        }

        // 카메라가 이미 활성화되어 있으면 일단 끄기
        if (isCameraEnabled) {
          console.log("📷 기존 카메라 비활성화...");
          await toggleCamera();
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // 카메라 활성화
        console.log("📷 카메라 활성화...");
        await toggleCamera();

        // 카메라 모드 즉시 설정
        setIsCameraMode(true);
        console.log("📷 Timer: 카메라 모드 활성화 콜백 호출");
        onCameraModeChange?.(true);

        // 비디오 준비 대기
        console.log("⏳ 비디오 준비 대기...");
        let attempts = 0;
        const maxAttempts = 30; // 15초까지 대기

        const waitForVideo = () => {
          attempts++;
          console.log(`🔍 비디오 상태 확인 ${attempts}/${maxAttempts}:`, {
            videoElement: !!videoRef.current,
            readyState: videoRef.current?.readyState,
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            isModelLoaded,
          });

          const video = videoRef.current;
          if (
            video &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            console.log("✅ 비디오 준비 완료, 감지 시작 시도");
            setIsVideoReady(true);

            if (isModelLoaded) {
              setTimeout(() => {
                console.log("🤖 AI 감지 시작 시도");
                startDetection();
              }, 500);
            }
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(waitForVideo, 500);
          } else {
            console.log("⚠️ 비디오 준비 시간 초과, 강제 시작");
            if (isModelLoaded) {
              startDetection();
            }
          }
        };

        // 비디오 준비 확인 시작
        setTimeout(waitForVideo, 1000);
      } catch (error) {
        console.error("❌ 카메라 접근 실패:", error);
        setIsCameraMode(false);
        onCameraModeChange?.(false);
        return;
      }
    } else {
      console.log("🛑 카메라 모드 비활성화");
      setIsCameraMode(false);
      console.log("📷 Timer: 카메라 모드 비활성화 콜백 호출");
      onCameraModeChange?.(false);
      stopDetection();
      setIsWaitingForFace(false);
      setLastAnalysisResult(null);
      setIsVideoReady(false);
      if (isCameraEnabled) {
        await toggleCamera();
      }
    }
  };



  // 오늘의 타이머 세션 확인 로직 (Supabase 의존성 제거)
  useEffect(() => {
    // if (!user) return; // user 확인 삭제
    // Supabase 호출 로직 삭제
    setHasTodaySession(false); // 로컬에서는 항상 false로 설정하여 휴식 타이머 비활성화
    // }, [user]); // user 의존성 삭제
  }, []);

  // 휴식 타이머 시작 로직 (hasTodaySession이 false이므로 실행되지 않음)
  useEffect(() => {
    if (!isActiveRef.current && !restTimerActive && hasTodaySession) {
      setRestTimerActive(true);
      setRestTime(0);
    } else if (isActiveRef.current) {
      setRestTimerActive(false);
      setRestTime(0);
    }
  }, [isActiveRef.current, restTimerActive, hasTodaySession]); // restTimerActive 의존성 추가

  // 휴식 타이머 실행 로직 (restTimerActive가 false이므로 실행되지 않음)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined; // 타입 명시
    if (restTimerActive && hasTodaySession) {
      interval = setInterval(() => {
        setRestTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [restTimerActive, hasTodaySession]);

  // 그룹 이름 가져오기 로직 삭제 (Supabase 및 activeTask.groupId 의존)
  // useEffect(() => { ... });

  // active_sessions 테이블 업데이트 로직 삭제 (Supabase 의존)
  // useEffect(() => { ... });

  return (
    <motion.div layout className="w-full">
      {/* 메인 타이머 디스플레이 */}
      {activeTask && (
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div
              className={cn("px-5 py-2 rounded-full text-sm font-medium", {
                "bg-zinc-500/20 text-zinc-300": !isActiveRef.current, // 대기중
                "bg-orange-300/20 text-orange-100": isActiveRef.current && isPaused, // 일시정지
                "bg-orange-500/20 text-orange-200": isActiveRef.current && !isPaused, // 진행중
              })}
            >
              {isActiveRef.current ? (isPaused ? "일시정지" : "진행중") : "대기중"}
            </div>
            
            {/* 일시정지 이유 표시 */}
            {isPaused && pauseReason && (
              <div className="px-5 py-2 rounded-full text-sm bg-yellow-500/20 text-yellow-200 text-center max-w-xs">
                {pauseReason}
              </div>
            )}
            
            {/* 카메라 모드 상태 표시 */}
            <div className="flex items-center gap-2">
              {isCameraMode && (
                <div className="pl-[18px] pr-5 py-2 rounded-full text-sm font-medium bg-orange-500/20 text-orange-200 flex items-center gap-2">
                  <Smile className="w-4 h-4" /> 얼굴 인식중
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div
        className={cn(
          "relative overflow-hidden rounded-[32px] bg-zinc-950 backdrop-blur-sm transition-all duration-500",
          isCameraMode ? "aspect-video" : ""
        )}
      >
        {isCameraMode && isCameraEnabled && (
          <div className="absolute inset-0">
            <CameraPreview
              videoRef={videoRef}
              canvasRef={canvasRef}
              showPreview={true}
              isCameraEnabled={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />
          </div>
        )}

        <div
          className={cn(
            "relative z-10 text-center transition-all duration-500",
            isCameraMode ? "py-12 px-8" : "py-12 px-8"
          )}
        >
          {isCameraMode &&
          (!isCameraEnabled || (!isVideoReady && !isCameraReady)) ? (
            <div className="space-y-6">
              <div className="text-6xl font-black text-white">
                {formattedTime}
              </div>
              <div className="flex flex-col items-center space-y-3">
                <Loader className="w-8 h-8 animate-spin text-orange-400" />
                <div className="text-lg text-zinc-300">카메라 준비 중...</div>
              </div>
            </div>
          ) : isCameraMode && isDetecting && !isStable ? (
            <div className="space-y-6">
              <div className="text-6xl font-black text-white">
                {formattedTime}
              </div>
              <div className="flex flex-col items-center space-y-3">
                <Loader className="w-8 h-8 animate-spin text-orange-400" />
                <div className="text-lg text-zinc-100 text-center">
                  얼굴 분석 준비 중...
                  <br />
                  <span className="text-sm text-zinc-100/60">
                    정확한 측정을 위해 잠시만 기다려주세요
                  </span>
                </div>
              </div>
            </div>
          ) : isWaitingForFace ? (
            <div className="space-y-6">
              <div className="text-6xl font-black text-white">
                {formattedTime}
              </div>
              <div className="flex flex-col items-center space-y-3">
                <Loader className="w-8 h-8 animate-spin text-orange-400" />
                <div className="text-lg text-zinc-300 text-center">
                  {isDetecting && !isStable ? (
                    <>
                      얼굴 분석 준비 중...
                      <br />
                      <span className="text-sm text-zinc-400">
                        정확한 측정을 위해 잠시만 기다려주세요
                      </span>
                    </>
                  ) : faceDetectedStartTime ? (
                    <>
                      얼굴 인식 완료!
                      <br />
                      <span className="text-sm text-zinc-400">
                        5초 후 자동으로 타이머가 시작됩니다...
                      </span>
                    </>
                  ) : (
                    <>
                      얼굴 인식 중...
                      <br />
                      <span className="text-sm text-zinc-400">
                        화면을 바라봐 주세요
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : canStartTimer && !activeTask ? (
            <div className="space-y-6">
              <div className="text-6xl font-black text-white">
                {formattedTime}
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div className="text-lg text-zinc-300 text-center">
                  얼굴 인식 완료!
                  <br />
                  <span className="text-sm text-orange-300 font-medium">
                    작업을 선택하면 타이머가 시작됩니다
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl font-extrabold text-white">
                {formattedTime}
              </div>

            </div>
          )}
        </div>

        <AnimatePresence>
          {(() => {
            const shouldShow = isCameraMode && lastAnalysisResult && isStable;
              //             console.log("🎨 UI 표시 조건 확인:", {
              //   isCameraMode,
              //   hasLastAnalysisResult: !!lastAnalysisResult,
              //   isStable,
              //   shouldShow,
              //   note: "타이머 상태와 관계없이 카메라 모드에서 안정화 완료시 표시"
              // });
            return shouldShow;
          })() && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 w-full z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {/* Single Row: All Analysis Results */}
                <div className="flex justify-between gap-1 text-xs bg-white/10 backdrop-blur-sm p-4">
                  {/* 졸음 감지 상태 */}
                  <div
                    className={cn(
                      "flex-1 backdrop-blur-md rounded-full px-2 py-2 flex items-center justify-center gap-1 font-semibold shadow-lg",
                      lastAnalysisResult.isDrowsy
                        ? "bg-red-600/30 text-red-100"
                        : lastAnalysisResult.fatigueLevel === "high"
                        ? "bg-red-600/30 text-red-100"
                        : lastAnalysisResult.fatigueLevel === "medium"
                        ? "bg-orange-500/30 text-orange-100"
                        : "bg-green-600/30 text-green-100"
                    )}
                  >
                    {lastAnalysisResult.isDrowsy ? "😴" : lastAnalysisResult.fatigueLevel === "high" ? "😵" : lastAnalysisResult.fatigueLevel === "medium" ? "😐" : "😊"}
                    <span className="text-[10px]">
                      {lastAnalysisResult.isDrowsy
                        ? "졸음"
                        : lastAnalysisResult.fatigueLevel === "high"
                        ? "피로"
                        : lastAnalysisResult.fatigueLevel === "medium"
                        ? "보통"
                        : "좋음"}
                    </span>
                  </div>

                  {/* 집중도 점수 */}
                  <div
                    className={cn(
                      "flex-1 backdrop-blur-md rounded-full px-2 py-2 flex items-center justify-center gap-1 shadow-lg",
                      lastAnalysisResult.attentionScore >= 80
                        ? "bg-green-500/20 text-green-200"
                        : lastAnalysisResult.attentionScore >= 60
                        ? "bg-yellow-500/20 text-yellow-200"
                        : lastAnalysisResult.attentionScore >= 40
                        ? "bg-orange-500/20 text-orange-200"
                        : "bg-red-500/20 text-red-200"
                    )}
                  >
                    집중도
                    <span className="text-[10px]">{lastAnalysisResult.attentionScore}점</span>
                  </div>

                  {/* 눈 */}
                  <div
                    className={cn(
                      "flex-1 backdrop-blur-md rounded-full px-2 py-2 flex items-center justify-center gap-1 shadow-lg",
                      lastAnalysisResult.ear < 0.15
                        ? "bg-red-500/20 text-red-200"
                        : lastAnalysisResult.ear < 0.22
                        ? "bg-yellow-500/20 text-yellow-200"
                        : "bg-green-500/20 text-green-200"
                    )}
                  >
                    👁️
                    <span className="text-[10px]">
                      {lastAnalysisResult.ear < 0.15
                        ? "감음"
                        : lastAnalysisResult.ear < 0.22
                        ? "깜빡임"
                        : lastAnalysisResult.ear < 0.35
                        ? "정상"
                        : "크게뜸"}
                    </span>
                  </div>

                  {/* 하품 여부 */}
                  <div
                    className={cn(
                      "flex-1 backdrop-blur-md rounded-full px-2 py-2 flex items-center justify-center gap-1 shadow-lg",
                      lastAnalysisResult.isYawning
                        ? "bg-orange-500/20 text-orange-200"
                        : "bg-teal-500/20 text-teal-200"
                    )}
                  >
                    🥱
                    <span className="text-[10px]">
                      {lastAnalysisResult.isYawning ? "하품중" : "정상"}
                    </span>
                  </div>

                  {/* 깜빡임 */}
                  <div
                    className={cn(
                      "flex-1 backdrop-blur-md rounded-full px-2 py-2 flex items-center justify-center gap-1 shadow-lg",
                      lastAnalysisResult.blinkRate < 6
                        ? "bg-red-500/20 text-red-200"
                        : lastAnalysisResult.blinkRate < 12
                        ? "bg-yellow-500/20 text-yellow-200"
                        : lastAnalysisResult.blinkRate <= 30
                        ? "bg-green-500/20 text-green-200"
                        : "bg-orange-500/20 text-orange-200"
                    )}
                  >
                    분당 깜빡임 횟수
                    <span className="text-[10px]">{lastAnalysisResult.blinkRate}</span>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

              <AnimatePresence mode="wait">
          {activeTask && (isActiveRef.current || isWaitingForFace) && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
                layout: { duration: 0.3, ease: "easeInOut" }
              }}
              className="flex gap-3 justify-center bg-zinc-950 rounded-3xl p-3 mt-2"
            >
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                if (isPaused) {
                  // 재개 시 수동 일시정지 상태 리셋
                  setIsManualPause(false);
                  setPauseReason(null);
                  console.log("▶️ 수동 재개");
                } else {
                  // 일시정지 시 수동 일시정지 표시
                  setIsManualPause(true);
                  setPauseReason("수동 일시정지");
                  console.log("⏸️ 수동 일시정지");
                }
                handlePause();
              }}
              disabled={isWaitingForFace}
              className="h-10 flex-1 px-4 bg-zinc-700/50 text-zinc-200 hover:bg-zinc-600/50 rounded-xl"
            >
              {isPaused ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
              <span className="w-full">
                {isPaused ? "다시 시작" : "일시정지"}
              </span>
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={async () => {
                console.log("🛑 정지 버튼 클릭 - 전체 정지 시작");
                
                // 1. 먼저 타이머 정지
                handleStopTimer();
                
                // 2. 수동 일시정지 상태 리셋
                setIsManualPause(false);
                setPauseReason(null);
                setLastAutoResumeTime(0);
                setLastAutoPauseTime(0);
                
                // 3. 카메라 모드가 켜져있으면 추가로 카메라 끄기
                if (isCameraMode && isCameraEnabled) {
                  console.log("🔄 추가 카메라 비활성화");
                  await toggleCamera();
                }
                
                // 4. 카메라 모드 상태 완전 리셋
                setIsCameraMode(false);
                onCameraModeChange?.(false);
                
                console.log("✅ 전체 정지 완료");
              }}
              className="h-10 flex-1 px-4 bg-zinc-300 text-zinc-900 hover:bg-white/30 rounded-xl flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              <span className="w-full">정지</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="flex justify-center gap-2 mt-2">
        <Button
          variant="default"
          onClick={toggleCameraMode}
          className={cn(
            "px-6 py-2 rounded-xl transition-all duration-200",
            isCameraMode
              ? "bg-orange-500/20 text-orange-200 hover:bg-orange-500/30 relative before:absolute before:inset-0 before:rounded-xl before:border before:border-orange-500/50 before:animate-[border-spin_2s_linear_infinite] hover:before:opacity-100 before:opacity-0 transition-all duration-300"
              : "bg-orange-700/50 text-white hover:bg-orange-700/30 relative before:absolute before:inset-0 before:rounded-xl before:border before:border-orange-500/50 before:animate-[border-spin_2s_linear_infinite] hover:before:opacity-100 before:opacity-0 transition-all duration-300"
          )}
        >
          {!isSecureContext()
            ? "HTTPS 환경에서만 사용 가능"
            : isCameraAvailable === null
            ? "카메라 확인 중..."
            : isCameraAvailable === false && cameraPermission === "granted"
            ? "카메라 없음 (권한 재요청)"
            : isCameraAvailable === false
            ? "카메라 권한 요청"
            : isCameraMode
            ? "카메라 끄기"
            : "AI 시간측정"}
        </Button>

        {cameraPermission === "granted" && availableCameras.length > 1 && (
          <Button
            variant="default"
            onClick={openSelectionDialog}
            className="px-4 py-2 rounded-lg bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:bg-zinc-700/30"
            title="카메라 선택"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};
