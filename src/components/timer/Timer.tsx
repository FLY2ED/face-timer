import React, { useState, useEffect, useRef } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { formatDuration } from "@/utils/timeUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Square, AlertCircle, Clock, BookOpen, Briefcase, MoreHorizontal, GraduationCap, Code, Music, Dumbbell, Coffee, Heart, Settings, Eye } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection, FaceAnalysisResult } from "@/hooks/useFaceDetection";
import { useCameraPermissionContext } from "@/contexts/CameraPermissionContext";
import { CameraPreview } from "./CameraPreview";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { users as mockUsers } from "@/data/mockData"; // MOCK_USER 정의에 필요

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
  return window.isSecureContext || 
         location.protocol === 'https:' || 
         location.hostname === 'localhost' || 
         location.hostname === '127.0.0.1';
};

interface TimerProps {
  onCameraModeChange?: (isOn: boolean) => void;
}

const MOCK_USER_ID = mockUsers[0]?.id || "user1"; // 필요시 사용 (현재 Timer.tsx에서는 직접 사용 안함)

export const Timer: React.FC<TimerProps> = ({ onCameraModeChange }) => {
  const {
    isActive,
    isPaused,
    elapsedTime,
    activeTask,
    pauseTimer,
    resumeTimer,
    stopTimer,
    startTimer
  } = useTimer();
  const [formattedTime, setFormattedTime] = useState("00:00:00");
  const [restTime, setRestTime] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [hasTodaySession, setHasTodaySession] = useState(false); // 기본값 false, Supabase 로직 제거
  // const { user } = useAuth(); // user 객체 사용 삭제
  // const sessions = useActiveSessions(activeTask?.groupId); // sessions 사용 삭제 (Supabase 의존)
  // const [groupName, setGroupName] = useState<string>(""); // groupName 상태 및 로직 삭제

  // 카메라 권한 컨텍스트 추가
  const { 
    permission: cameraPermission, 
    requestPermission, 
    availableCameras, 
    selectedCameraId,
    openSelectionDialog 
  } = useCameraPermissionContext();

  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isWaitingForFace, setIsWaitingForFace] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false); // 이 상태는 현재 사용되지 않는 것으로 보임. 필요시 검토.
  const [lastAnalysisResult, setLastAnalysisResult] = useState<FaceAnalysisResult | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isCameraEnabled, videoRef, toggleCamera } = useCamera();
  
  const { isDetecting, startDetection, stopDetection, isModelLoaded, isCameraReady } = useFaceDetection({
    videoRef,
    canvasRef,
    showPreview: true,
    onFaceDetected: (result) => {
      if (result) {
        setLastAnalysisResult(result);
        if (isWaitingForFace) {
          setIsWaitingForFace(false);
          if (activeTask && !isActive) {
            startTimer(activeTask);
          }
        } else if (isActive && isPaused && result.attentionScore > 50) {
          resumeTimer();
        }
        if ((result.fatigueLevel === 'high' || result.attentionScore < 30) && isActive && !isPaused) {
          pauseTimer();
        }
      }
    },
    onFaceNotDetected: () => {
      if (isActive && !isPaused) {
        pauseTimer();
      }
    }
  });

  useEffect(() => {
    if (isCameraMode && activeTask && !isActive && !isDetecting && isModelLoaded && isCameraEnabled && isCameraReady) {
      setIsWaitingForFace(true);
      startDetection();
    }
  }, [isCameraMode, activeTask, isActive, isDetecting, isModelLoaded, isCameraEnabled, isCameraReady]);

  useEffect(() => {
    if (!isCameraMode || isDetecting || !isModelLoaded || !isCameraEnabled) {
      return;
    }
    if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
      startDetection();
    } 
  }, [isCameraMode, isModelLoaded, isCameraEnabled, isCameraReady, isVideoReady, isDetecting, startDetection, videoRef]);

  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsCameraAvailable(false);
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
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
    console.log("🔄 카메라 모드 전환 시작:", { newMode, currentCameraEnabled: isCameraEnabled });

    if (newMode) {
      // 권한 확인
      if (cameraPermission !== 'granted') {
        console.log("📋 카메라 권한 요청 중...");
        const result = await requestPermission();
        if (!result.success) {
          console.log("❌ 카메라 권한 거부됨");
          setTimeout(async () => {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoDevices = devices.filter(device => device.kind === 'videoinput');
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
        setIsWaitingForFace(false);
        setLastAnalysisResult(null);
        setIsVideoReady(false);

        // 카메라가 이미 활성화되어 있으면 일단 끄기
        if (isCameraEnabled) {
          console.log("📷 기존 카메라 비활성화...");
          await toggleCamera();
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // 카메라 활성화
        console.log("📷 카메라 활성화...");
        await toggleCamera();
        
        // 카메라 모드 즉시 설정
        setIsCameraMode(true);
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
            isModelLoaded
          });

          const video = videoRef.current;
          if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
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

  useEffect(() => {
    setFormattedTime(formatDuration(elapsedTime));
  }, [elapsedTime]);

  // 오늘의 타이머 세션 확인 로직 (Supabase 의존성 제거)
  useEffect(() => {
    // if (!user) return; // user 확인 삭제
    // Supabase 호출 로직 삭제
    setHasTodaySession(false); // 로컬에서는 항상 false로 설정하여 휴식 타이머 비활성화
  // }, [user]); // user 의존성 삭제
  }, []);

  // 휴식 타이머 시작 로직 (hasTodaySession이 false이므로 실행되지 않음)
  useEffect(() => {
    if (!isActive && !restTimerActive && hasTodaySession) {
      setRestTimerActive(true);
      setRestTime(0);
    } else if (isActive) {
      setRestTimerActive(false);
      setRestTime(0);
    }
  }, [isActive, restTimerActive, hasTodaySession]); // restTimerActive 의존성 추가

  // 휴식 타이머 실행 로직 (restTimerActive가 false이므로 실행되지 않음)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined; // 타입 명시
    if (restTimerActive && hasTodaySession) {
      interval = setInterval(() => {
        setRestTime(prev => prev + 1);
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

  const handleStopTimer = async () => {
    // if (user && activeTask) { // user 확인 삭제
    if (activeTask) {
      // Supabase timer_sessions 저장 로직 삭제
      // Supabase profiles 업데이트 로직 삭제
      console.log("Timer session stopped (local):", { taskId: activeTask.id, duration: elapsedTime });
    }
    stopTimer();
    setIsWaitingForFace(false);
    if (isCameraMode) {
      stopDetection();
    }
  };

  const handlePause = () => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 메인 타이머 디스플레이 */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800/50 via-zinc-700/50 to-zinc-800/50 backdrop-blur-sm border border-zinc-700/30 transition-all duration-500",
        isCameraMode ? "aspect-video min-h-[400px]" : "min-h-[200px]"
      )}>
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
        
        <div className={cn(
          "relative z-10 text-center transition-all duration-500",
          isCameraMode ? "py-12 px-8" : "py-12 px-8"
        )}>
          {isCameraMode && (!isCameraEnabled || (!isVideoReady && !isCameraReady)) ? (
            <div className="space-y-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl font-black text-white"
              >
                {formattedTime}
              </motion.div>
              <div className="text-lg text-blue-300">
                📷 카메라 준비 중...
              </div>
            </div>
          ) : isWaitingForFace ? (
            <div className="space-y-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl font-black text-white"
              >
                {formattedTime}
              </motion.div>
              <div className="text-lg text-blue-300">
                📷 얼굴 인식 중... 화면을 바라봐 주세요
              </div>
              {activeTask && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="flex-shrink-0">
                    {activeTask.icon && iconMapping[activeTask.icon] ? (
                      <div 
                        className="h-8 w-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: activeTask.color || "#3F3F46" }}
                      >
                        {React.createElement(iconMapping[activeTask.icon], { 
                          className: "w-5 h-5 text-white"
                        })}
                      </div>
                    ) : (
                      <div 
                        className="h-8 w-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: activeTask.color || "#3F3F46" }}
                      >
                        <span className="text-sm text-white font-medium">
                          {activeTask.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-zinc-300">
                    {activeTask.title}
                  </h3>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="text-6xl font-black text-white mb-4">
                {formattedTime}
              </div>
              
              {activeTask ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="flex-shrink-0">
                      {activeTask.icon && iconMapping[activeTask.icon] ? (
                        <div 
                          className="h-8 w-8 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: activeTask.color || "#3F3F46" }}
                        >
                          {React.createElement(iconMapping[activeTask.icon], { 
                            className: "w-5 h-5 text-white"
                          })}
                        </div>
                      ) : (
                        <div 
                          className="h-8 w-8 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: activeTask.color || "#3F3F46" }}
                        >
                          <span className="text-sm text-white font-medium">
                            {activeTask.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-200">
                      {activeTask.title}
                    </h2>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      isActive
                        ? isPaused
                          ? "bg-blue-500/20 text-blue-200 border border-blue-500/30"
                          : "bg-green-500/20 text-green-200 border border-green-500/30"
                        : "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                    )}>
                      {isActive ? (isPaused ? "일시정지" : "진행중") : "대기중"}
                    </div>
                    {isCameraMode && (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                        🤖 AI 모니터링
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-lg text-zinc-400">작업을 선택해주세요</p>
              )}
            </>
          )}
        </div>

        <AnimatePresence>
          {isCameraMode && lastAnalysisResult && (isActive || isWaitingForFace) && (
            <motion.div 
              className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* Row 1: Main Status & Gaze Direction */}
              <div className="flex justify-between gap-2">
                <div
                  className={cn(
                    "flex-1 backdrop-blur-md rounded-lg px-4 py-2.5 border text-sm flex items-center justify-center gap-2 font-semibold shadow-lg",
                    lastAnalysisResult.fatigueLevel === 'high'
                      ? "bg-red-600/30 border-red-500/40 text-red-100"
                      : lastAnalysisResult.fatigueLevel === 'medium'
                      ? "bg-orange-500/30 border-orange-500/40 text-orange-100"
                      : "bg-green-600/30 border-green-500/40 text-green-100"
                  )}
                >
                  {lastAnalysisResult.isDrowsy ? "😴 졸음 감지됨" : 
                   lastAnalysisResult.fatigueLevel === 'high' ? "몹시 피로함" :
                   lastAnalysisResult.fatigueLevel === 'medium' ? "약간 피로함" : "😊 최상의 컨디션"}
                  <span className="text-xs opacity-80">
                    ({lastAnalysisResult.attentionScore}%)
                  </span>
                </div>
                
                <div
                  className="flex-1 backdrop-blur-md rounded-lg px-4 py-2.5 border bg-sky-600/30 border-sky-500/40 text-sky-100 text-sm flex items-center justify-center gap-2 font-semibold shadow-lg"
                >
                  🎯
                  <span>
                    {lastAnalysisResult.gazeDirection === 'center' ? '정면 응시 중' : 
                     lastAnalysisResult.gazeDirection === 'left' ? '왼쪽 주시' :
                     lastAnalysisResult.gazeDirection === 'right' ? '오른쪽 주시' :
                     lastAnalysisResult.gazeDirection === 'up' ? '위쪽 주시' :
                     lastAnalysisResult.gazeDirection === 'down' ? '아래쪽 주시' : '시선 확인 안됨'}
                  </span>
                </div>
              </div>
              
              {/* Row 2: EAR, MAR, Blinks */}
              <div className="flex justify-between gap-2">
                <div
                  className={cn(
                    "flex-1 backdrop-blur-md rounded-lg px-3 py-2 border text-xs flex items-center justify-center gap-2 shadow-md",
                    lastAnalysisResult.ear < 0.20 ? "bg-red-500/20 border-red-500/30 text-red-200" : "bg-purple-500/20 border-purple-500/30 text-purple-200"
                  )}
                >
                  <span className="text-base">👁️</span>
                  <span>눈={(lastAnalysisResult.ear * 100).toFixed(0)}%</span>
                </div>
                
                <div
                  className={cn(
                    "flex-1 backdrop-blur-md rounded-lg px-3 py-2 border text-xs flex items-center justify-center gap-2 shadow-md",
                    lastAnalysisResult.mar > 0.4 ? "bg-orange-500/20 border-orange-500/30 text-orange-200" : "bg-teal-500/20 border-teal-500/30 text-teal-200"
                  )}
                >
                  <span className="text-base">👄</span>
                  <span>입={(lastAnalysisResult.mar * 100).toFixed(0)}%</span>
                </div>
                
                <div
                  className="flex-1 backdrop-blur-md rounded-lg px-3 py-2 border bg-yellow-600/20 border-yellow-500/30 text-yellow-100 text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>깜빡임: {lastAnalysisResult.blinkRate}회/분</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      lastAnalysisResult.blinkRate < 8 ? 'bg-red-100 text-red-700' :
                      lastAnalysisResult.blinkRate < 12 ? 'bg-yellow-100 text-yellow-700' :
                      lastAnalysisResult.blinkRate <= 25 ? 'bg-green-100 text-green-700' :
                      lastAnalysisResult.blinkRate <= 35 ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {lastAnalysisResult.blinkRate < 8 ? '매우 졸림' :
                       lastAnalysisResult.blinkRate < 12 ? '졸림' :
                       lastAnalysisResult.blinkRate <= 25 ? '정상' :
                       lastAnalysisResult.blinkRate <= 35 ? '약간 긴장' :
                       '매우 긴장'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Row 3: Head Pose, Emotion, Confidence */}
              <div
                className="backdrop-blur-md rounded-lg px-4 py-2 border bg-indigo-600/30 border-indigo-500/40 text-indigo-100 text-xs flex justify-between items-center shadow-lg"
              >
                <span>고개: {Math.round(Math.abs(lastAnalysisResult.headPose.pitch))}°(상하) {Math.round(Math.abs(lastAnalysisResult.headPose.yaw))}°(좌우)</span>
                <span>감정: {lastAnalysisResult.emotion === 'happy' ? '😊' : lastAnalysisResult.emotion === 'neutral' ? '😐' : lastAnalysisResult.emotion === 'surprised' ? '😮' : lastAnalysisResult.emotion === 'sad' ? '😟' : '🤔'}</span>
                <span>신뢰도: {lastAnalysisResult.confidence}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeTask && (isActive || isWaitingForFace) && (
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePause}
            disabled={isWaitingForFace}
            className="h-12 px-6 bg-zinc-700/50 border-zinc-600 text-zinc-200 hover:bg-zinc-600/50"
          >
            {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
            {isPaused ? "재개" : "일시정지"}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleStopTimer}
            className="h-12 px-6 bg-red-700/50 border-red-600 text-red-200 hover:bg-red-600/50"
          >
            <Square className="w-5 h-5 mr-2" />
            정지
          </Button>
        </div>
      )}

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={toggleCameraMode}
          className={cn(
            "px-6 py-2 rounded-lg transition-all duration-200",
            isCameraMode
              ? "bg-blue-500/20 border-blue-500/50 text-blue-200 hover:bg-blue-500/30"
              : "bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:bg-zinc-600/50"
          )}
        >
          📷 {
            !isSecureContext() 
              ? "HTTPS 환경에서만 사용 가능"
              : isCameraAvailable === null 
              ? "카메라 확인 중..." 
              : isCameraAvailable === false && cameraPermission === 'granted'
              ? "카메라 없음 (권한 재요청)"
              : isCameraAvailable === false
              ? "카메라 권한 요청"
              : isCameraMode 
              ? "AI 모니터링 중지하기" 
              : "AI 모니터링 시작하기"
          }
        </Button>
        
        {cameraPermission === 'granted' && availableCameras.length > 1 && (
          <Button
            variant="outline"
            onClick={openSelectionDialog}
            className="px-4 py-2 rounded-lg bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:bg-zinc-600/50"
            title="카메라 선택"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};