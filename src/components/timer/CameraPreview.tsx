import React, { useEffect, useState, useRef } from "react";
import { CameraOff, EyeOff, AlertCircle } from "lucide-react";

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  showPreview: boolean;
  isCameraEnabled: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  canvasRef,
  showPreview,
  isCameraEnabled,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 비디오 요소 모니터링 함수
  const monitorVideoElement = () => {
    if (!videoRef.current) {
      setError("비디오 요소를 찾을 수 없습니다");
      return;
    }

    if (videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA
      console.log("비디오가 재생 가능한 상태");
      videoRef.current.play()
        .then(() => console.log("비디오 재생 시작됨"))
        .catch(err => {
          console.error("비디오 재생 실패:", err);
          setError("비디오 재생 시작 실패");
        });
      
      // 성공적으로 재생되면 모니터링 중지
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    }
  };

  // 비디오 메타데이터가 로드되면 aspect ratio 계산
  const updateVideoAspectRatio = () => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      console.log(`비디오 크기: ${videoElement.videoWidth}x${videoElement.videoHeight}, 비율: ${aspectRatio}`);
      setVideoAspectRatio(aspectRatio);
    }
  };

  // 비디오 요소가 마운트된 후 준비되면 명시적으로 재생
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement && isCameraEnabled) {
      console.log("카메라 활성화 상태, 비디오 요소 설정 중...");
      setError(null);
      
      // 비디오 요소 상태 모니터링
      const handleCanPlay = () => {
        console.log("비디오가 재생 가능한 상태");
        updateVideoAspectRatio(); // aspect ratio 업데이트
        videoElement.play()
          .then(() => {
            console.log("비디오 재생 시작됨");
            setError(null); // 성공 시 에러 클리어
          })
          .catch(err => {
            console.error("비디오 재생 실패:", err);
            setError("비디오 재생 시작 실패");
          });
      };
      
      const handleLoadedMetadata = () => {
        console.log("비디오 메타데이터 로드 완료");
        updateVideoAspectRatio(); // aspect ratio 업데이트
      };
      
      const handleLoadedData = () => {
        console.log("비디오 데이터 로드 완료, 재생 시도");
        updateVideoAspectRatio(); // aspect ratio 업데이트
        videoElement.play()
          .then(() => console.log("loadeddata 이벤트로 비디오 재생 성공"))
          .catch(err => console.warn("loadeddata 이벤트로 비디오 재생 실패:", err));
      };
      
      const handleError = (e: Event) => {
        console.error("비디오 요소 오류:", e);
        setError("카메라 스트림을 표시할 수 없습니다");
      };
      
      // 여러 이벤트에 리스너 추가
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('error', handleError);
      
      // 즉시 재생 시도 (이미 준비된 경우)
      if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
        handleCanPlay();
      } else if (videoElement.readyState >= 1) { // HAVE_METADATA
        updateVideoAspectRatio();
      }
      
      // 지속적인 모니터링 설정 (500ms마다 체크)
      if (!monitorIntervalRef.current) {
        monitorIntervalRef.current = setInterval(monitorVideoElement, 500);
      }
      
      return () => {
        // 이벤트 리스너 정리
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleError);
        
        // 모니터링 인터벌 정리
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current);
          monitorIntervalRef.current = null;
        }
      };
    } else {
      // 카메라가 비활성화되면 모니터링 중지 및 aspect ratio 리셋
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      setVideoAspectRatio(null);
    }
  }, [videoRef, isCameraEnabled]);

  // 동적 스타일 계산
  const containerStyle = videoAspectRatio 
    ? { aspectRatio: videoAspectRatio.toString() }
    : {};

  return (
    <div 
      className="relative w-full bg-black rounded-lg overflow-hidden mb-3"
      style={videoAspectRatio ? containerStyle : { aspectRatio: '16/9' }}
    >
      {/* 디버깅 정보 표시 */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/80 text-white text-xs p-1 z-50 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}
      
      {/* 비디오 비율 정보 표시 (디버깅용) */}
      {videoAspectRatio && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/50 text-white text-xs p-1 z-40">
          {videoAspectRatio.toFixed(2)}:1
        </div>
      )}
      
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${!showPreview ? 'invisible' : ''}`}
        autoPlay
        muted
        playsInline
        style={{ 
          display: isCameraEnabled ? 'block' : 'none',
          backgroundColor: 'black'
        }}
      />
      
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ 
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          zIndex: 10,
          position: 'absolute',
          backgroundColor: 'transparent'
        }}
      />
      
      {!showPreview && isCameraEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <EyeOff className="w-8 h-8 text-zinc-500" />
        </div>
      )}
      
      {!isCameraEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <CameraOff className="w-10 h-10 text-zinc-600" />
        </div>
      )}
    </div>
  );
};
