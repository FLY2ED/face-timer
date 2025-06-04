import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useCameraPermissionContext } from "@/contexts/CameraPermissionContext";

interface DOMError extends Error {
  name: string;
}

export const useCamera = () => {
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  // 권한 요청 상태 추적
  const [permissionRequested, setPermissionRequested] = useState(false);

  // 카메라 권한 컨텍스트에서 선택된 카메라 정보 가져오기
  const { selectedCameraId, stream: permissionStream } = useCameraPermissionContext();

  // 비디오 요소 관찰하는 함수
  const monitorVideoElement = useCallback(() => {
    const checkInterval = setInterval(() => {
      if (videoRef.current) {
        console.log("비디오 요소 감지됨");
        setIsVideoReady(true);
        
        // 권한 컨텍스트의 스트림이 있으면 그것을 사용, 없으면 저장된 스트림 사용
        const streamToUse = permissionStream || streamRef.current;
        if (streamToUse && videoRef.current) {
          console.log("스트림을 비디오 요소에 연결합니다");
          videoRef.current.srcObject = streamToUse;
          
          // 비디오 재생 시도
          videoRef.current.play()
            .then(() => console.log("지연된 비디오 재생 성공"))
            .catch(error => console.warn("지연된 비디오 재생 실패:", error));
        }
        
        clearInterval(checkInterval);
        return true;
      }
      return false;
    }, 300);
    
    // 30초 후에는 자동으로 중지 (안전 장치)
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
    
    return () => clearInterval(checkInterval);
  }, [permissionStream]);

  // 컴포넌트 마운트 시 비디오 요소 모니터링 시작
  useEffect(() => {
    const cleanup = monitorVideoElement();
    return cleanup;
  }, [monitorVideoElement]);

  // 카메라 정리 기능
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 카메라 스트림 요청 함수 - 선택된 카메라 ID 사용
  const requestCameraStream = useCallback(async (): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("카메라 API를 지원하지 않는 브라우저입니다");
      throw new Error("이 브라우저는 카메라 접근을 지원하지 않습니다.");
    }

    // 권한 요청 상태로 설정
    setPermissionRequested(true);
    
    try {
      console.log("카메라 권한 요청 시작...", selectedCameraId ? `선택된 카메라: ${selectedCameraId}` : '기본 카메라');
      
      // 권한 컨텍스트에 스트림이 있으면 그것을 사용
      if (permissionStream) {
        console.log("권한 컨텍스트의 스트림 사용");
        streamRef.current = permissionStream;
        
        // 비디오 요소가 있으면 연결
        if (videoRef.current) {
          console.log("비디오 요소에 스트림 연결");
          videoRef.current.srcObject = permissionStream;
          
          try {
            await videoRef.current.play();
            console.log("비디오 재생 시작됨");
          } catch (playError) {
            console.warn("자동 재생 실패 (사용자 상호작용 필요):", playError);
          }
        }
        
        return permissionStream;
      }
      
      // 권한 컨텍스트에 스트림이 없으면 직접 요청
      let stream: MediaStream | null = null;
      
      try {
        // 선택된 카메라가 있으면 해당 카메라 사용
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId ? {
            deviceId: { exact: selectedCameraId },
            width: { ideal: 640 },
            height: { ideal: 480 }
          } : {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("카메라 스트림 획득 성공");
      } catch (error) {
        console.warn("카메라 접근 실패, 기본 설정으로 시도:", error);
        
        // 두 번째 시도: 최소 설정으로 요청
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        });
        console.log("기본 설정으로 카메라 스트림 획득 성공");
      }
      
      if (!stream) {
        throw new Error("카메라 스트림을 가져오지 못했습니다");
      }
      
      console.log("카메라 스트림 획득 완료:", stream.id);
      
      // 스트림을 참조로 저장
      streamRef.current = stream;
      
      // 비디오 요소가 있으면 연결, 없으면 나중에 연결
      if (videoRef.current) {
        console.log("비디오 요소에 스트림 연결");
        videoRef.current.srcObject = stream;
        
        // 비디오 재생 강제 시작
        try {
          await videoRef.current.play();
          console.log("비디오 재생 시작됨");
        } catch (playError) {
          console.warn("자동 재생 실패 (사용자 상호작용 필요):", playError);
        }
        
        await new Promise<void>((resolve) => {
          if (!videoRef.current) {
            resolve();
            return;
          }
          
          const handleLoadedMetadata = () => {
            console.log("비디오 메타데이터 로드됨");
            videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
            setIsVideoReady(true); // 비디오 준비 상태 업데이트
            resolve();
          };
          
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          
          if (videoRef.current.readyState >= 1) {
            handleLoadedMetadata();
          }
        });
      } else {
        console.log("비디오 요소가 아직 준비되지 않았습니다. 나중에 연결될 예정입니다.");
        // 비디오 요소 모니터링 시작
        monitorVideoElement();
      }
      
      return stream;
    } catch (error) {
      console.error("카메라 스트림 가져오기 오류:", error);
      throw error;
    }
  }, [selectedCameraId, permissionStream, monitorVideoElement]);

  const stopCamera = useCallback(() => {
    console.log("카메라 스트림 중지 중...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`트랙 중지: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      // 비디오 요소 완전 초기화
      videoRef.current.srcObject = null;
      videoRef.current.load(); // 비디오 요소 리셋
      console.log("비디오 요소에서 스트림 연결 해제 및 리셋됨");
    }
    
    setIsVideoReady(false); // 비디오 준비 상태도 리셋
    setPermissionRequested(false);
  }, []);

  const toggleCamera = useCallback(async () => {
    console.log("카메라 토글 요청됨, 현재 상태:", isCameraEnabled);
    try {
      setIsLoading(true);
      
      if (isCameraEnabled) {
        // 카메라를 끄는 경우
        stopCamera();
        setIsCameraEnabled(false);
        toast.success("카메라가 비활성화되었습니다.");
      } else {
        // 카메라를 켜는 경우 - 권한 요청을 먼저 하고 비디오 요소는 나중에 처리
        console.log("카메라 활성화 중...");
        
        // 권한 요청 및 스트림 획득 - 비디오 요소 존재 여부와 관계없이 실행
        await requestCameraStream();
        
        setIsCameraEnabled(true);
        toast.success("카메라가 활성화되었습니다.");
      }
    } catch (error: unknown) {
      console.error("카메라 접근 오류:", error);
      
      // 더 구체적인 오류 메시지 제공
      let errorMessage = "카메라 접근에 실패했습니다.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          errorMessage = "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.";
        } else if (error.name === 'NotFoundError' || error.message.includes('Requested device not found')) {
          errorMessage = "카메라를 찾을 수 없습니다. 기기에 연결된 카메라가 있는지 확인해주세요.";
        } else if (error.name === 'NotReadableError' || error.message.includes('Could not start video source')) {
          errorMessage = "카메라를 사용할 수 없습니다. 다른 앱이 카메라를 사용 중인지 확인해주세요.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "요청한 카메라 설정이 지원되지 않습니다. 기본 설정으로 시도해보세요.";
        } else if (error.name === 'AbortError') {
          errorMessage = "카메라 접근이 중단되었습니다. 다시 시도해주세요.";
        } else if (error.message.includes('비디오 요소')) {
          errorMessage = "카메라 초기화에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.";
        }
      }
      
      toast.error(errorMessage);
      setIsCameraEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [isCameraEnabled, requestCameraStream, stopCamera]);

  return {
    isCameraEnabled,
    isLoading,
    videoRef,
    toggleCamera,
    isVideoReady,
    permissionRequested
  };
};
