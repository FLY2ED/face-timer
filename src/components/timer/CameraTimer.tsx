import React, { useRef, useState, useCallback, useEffect } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { Camera, Eye, EyeOff, AlertCircle, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { CameraPreview } from "./CameraPreview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CameraModal } from "./CameraModal";

export const CameraTimer: React.FC = () => {
  const { isActive, pauseTimer, resumeTimer, activeTask } = useTimer();
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { isCameraEnabled, isLoading, videoRef, toggleCamera } = useCamera();
  
  const { isDetecting, startDetection, stopDetection, isModelLoaded, modelLoadingError } = useFaceDetection({
    videoRef,
    canvasRef,
    showPreview,
    onFaceDetected: () => {
      if (isActive && !activeTask) {
        resumeTimer();
      }
    },
    onFaceNotDetected: () => {
      if (isActive) {
        pauseTimer();
      }
    }
  });

  // 카메라 상태가 변경될 때 디버그 정보 업데이트
  useEffect(() => {
    if (isCameraEnabled) {
      if (videoRef.current) {
        const readyState = videoRef.current.readyState;
        const states = ["HAVE_NOTHING", "HAVE_METADATA", "HAVE_CURRENT_DATA", "HAVE_FUTURE_DATA", "HAVE_ENOUGH_DATA"];
        setDebugInfo(`카메라 준비 상태: ${states[readyState] || readyState}`);
      } else {
        setDebugInfo("비디오 요소가 준비되지 않음");
      }
    } else {
      setDebugInfo(null);
    }
  }, [isCameraEnabled, videoRef]);

  // 카메라가 켜진 후 비디오 요소가 준비되면 얼굴 감지 시작
  useEffect(() => {
    if (isCameraEnabled && videoRef.current && isModelLoaded && !isDetecting) {
      const checkVideoReady = setTimeout(() => {
        if (videoRef.current?.readyState >= 2) {
          console.log("비디오 요소 준비됨, 얼굴 감지 시작");
          startDetection();
          setShowPreview(true);
        }
      }, 1500); // 비디오가 로드될 시간을 주기 위해 약간의 지연
      
      return () => clearTimeout(checkVideoReady);
    }
  }, [isCameraEnabled, isModelLoaded, isDetecting, videoRef, startDetection]);

  const handleCameraToggle = useCallback(async () => {
    console.log("카메라 토글 요청됨, 현재 상태:", isCameraEnabled);
    try {
      if (isCameraEnabled) {
        // 카메라를 끄는 경우
        stopDetection();
        setShowPreview(false);
        await toggleCamera(); // 카메라 끄기
      } else {
        // 카메라를 켜는 경우
        // 카메라 켜기 전에 비디오 요소가 렌더링될 시간을 주기 위해 약간 지연
        await new Promise(resolve => setTimeout(resolve, 200));
        await toggleCamera(); // 카메라 켜기
        
        // 모델이 로드된 경우 얼굴 감지는 useEffect에서 처리
        if (!isModelLoaded) {
          toast.info("얼굴 인식 모델 로드 중입니다.");
        }
      }
    } catch (error) {
      console.error("카메라 토글 오류:", error);
    }
  }, [isCameraEnabled, toggleCamera, stopDetection, isModelLoaded]);

  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-zinc-800/50 via-zinc-800/40 to-zinc-900/50 rounded-lg border border-zinc-700/30 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-md backdrop-blur-sm border border-blue-500/10">
            <Camera className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">카메라 타이머</h3>
            <p className="text-xs text-zinc-400">AI 얼굴 인식으로 자동 타이머 제어</p>
          </div>
        </div>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/50 rounded-md">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          )}
          <Switch
            checked={isCameraEnabled}
            onCheckedChange={handleCameraToggle}
            disabled={isLoading}
            className={cn(
              "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500",
              "bg-zinc-700/50 border border-zinc-600/50",
              "data-[state=unchecked]:bg-zinc-800/50",
              "transition-all duration-200",
              "hover:bg-zinc-700/70 data-[state=checked]:hover:from-blue-600 data-[state=checked]:hover:to-purple-600",
              isLoading && "opacity-50"
            )}
          />
        </div>
      </div>

      {isCameraEnabled && (
        <>
          {/* 디버그 정보 표시 */}
          {debugInfo && (
            <div className="mt-2 p-1 bg-blue-500/10 rounded-md flex items-center text-xs text-blue-300">
              <Info className="w-3 h-3 mr-1" />
              {debugInfo}
            </div>
          )}
          
          {modelLoadingError && (
            <Alert className="mt-4 mb-4 bg-red-900/20 border-red-900/50 text-red-200 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {modelLoadingError}
              </AlertDescription>
            </Alert>
          )}

          <CameraPreview
            videoRef={videoRef}
            canvasRef={canvasRef}
            showPreview={showPreview}
            isCameraEnabled={isCameraEnabled}
          />

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              variant="outline"
              onClick={toggleDetection} 
              disabled={!isCameraEnabled || !isModelLoaded}
              className={cn(
                "w-full h-8 text-xs backdrop-blur-sm",
                isDetecting 
                  ? "bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-900/50 text-red-200 hover:from-red-900/30 hover:to-red-800/30" 
                  : "bg-gradient-to-r from-zinc-700/20 to-zinc-600/20 border-zinc-600/50 text-zinc-300 hover:from-zinc-700/30 hover:to-zinc-600/30"
              )}
            >
              {isDetecting ? "감지 중지" : "얼굴 감지 시작"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={!isCameraEnabled}
              className="w-full h-8 text-xs backdrop-blur-sm bg-gradient-to-r from-zinc-700/20 to-zinc-600/20 border-zinc-600/50 text-zinc-300 hover:from-zinc-700/30 hover:to-zinc-600/30"
            >
              {showPreview ? <EyeOff className="mr-2 h-3 w-3" /> : <Eye className="mr-2 h-3 w-3" />}
              {showPreview ? "미리보기 숨기기" : "미리보기 보기"}
            </Button>
          </div>

          {/* 시작하기 버튼 */}
          <Button
            className="w-full h-10 mt -4 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
            onClick={() => setModalOpen(true)}
          >
            시작하기
          </Button>

          <div className="mt-4 text-xs text-zinc-400 space-y-1">
            <p>얼굴이 감지되면 자동으로 타이머가 시작되고, 얼굴이 5초 이상 감지되지 않으면 자동으로 일시정지됩니다.</p>
            {!isModelLoaded && !modelLoadingError && (
              <p className="text-blue-400/80">
                AI 얼굴 인식 모델을 로드 중입니다. 잠시만 기다려주세요...
              </p>
            )}
          </div>
        </>
      )}

      {/* CameraModal 모달 */}
      <CameraModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
