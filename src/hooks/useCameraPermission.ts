import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface CameraDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface CameraPermissionState {
  permission: 'granted' | 'denied' | 'prompt' | 'loading' | 'unknown';
  stream: MediaStream | null;
  error: string | null;
  availableCameras: CameraDevice[];
  selectedCameraId: string | null;
}

// Secure Context 확인 함수
const isSecureContext = (): boolean => {
  return window.isSecureContext || 
         location.protocol === 'https:' || 
         location.hostname === 'localhost' || 
         location.hostname === '127.0.0.1';
};

// 저장된 카메라 설정 조회
const getSavedCameraId = (): string | null => {
  try {
    return localStorage.getItem('selectedCameraId');
  } catch {
    return null;
  }
};

// 카메라 설정 저장
const saveCameraId = (deviceId: string): void => {
  try {
    localStorage.setItem('selectedCameraId', deviceId);
  } catch (error) {
    console.warn('카메라 설정 저장 실패:', error);
  }
};

export const useCameraPermission = () => {
  const [state, setState] = useState<CameraPermissionState>({
    permission: 'unknown',
    stream: null,
    error: null,
    availableCameras: [],
    selectedCameraId: getSavedCameraId()
  });

  // 사용 가능한 카메라 목록 조회
  const getAvailableCameras = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      if (!isSecureContext()) {
        return [];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `카메라 ${device.deviceId.substr(0, 8)}...`,
          groupId: device.groupId
        }));

      setState(prev => ({ ...prev, availableCameras: videoDevices }));
      return videoDevices;
    } catch (error) {
      console.error('카메라 목록 조회 실패:', error);
      return [];
    }
  }, []);

  // 현재 권한 상태 확인
  const checkPermission = useCallback(async () => {
    try {
      // Secure Context 확인
      if (!isSecureContext()) {
        console.warn('HTTP 환경에서는 카메라 접근이 제한됩니다');
        return 'unknown';
      }

      if (!navigator.permissions || !navigator.permissions.query) {
        console.log('권한 API가 지원되지 않음');
        return 'unknown';
      }

      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      // 권한이 허용된 경우 카메라 목록도 조회
      if (result.state === 'granted') {
        await getAvailableCameras();
      }
      
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.warn('권한 확인 실패:', error);
      return 'unknown';
    }
  }, [getAvailableCameras]);

  // 특정 카메라로 스트림 생성
  const createStreamWithCamera = useCallback(async (deviceId?: string) => {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        ...(deviceId && { deviceId: { exact: deviceId } })
      }
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  // 카메라 권한 요청
  const requestPermission = useCallback(async (specificDeviceId?: string) => {
    setState(prev => ({ ...prev, permission: 'loading', error: null }));
    
    try {
      // Secure Context 확인
      if (!isSecureContext()) {
        const errorMessage = 'HTTP 환경에서는 카메라에 접근할 수 없습니다. HTTPS 사이트에서 이용해주세요.';
        setState(prev => ({
          ...prev,
          permission: 'denied',
          stream: null,
          error: errorMessage
        }));
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMessage = '이 브라우저에서는 카메라를 지원하지 않습니다.';
        setState(prev => ({
          ...prev,
          permission: 'denied',
          stream: null,
          error: errorMessage
        }));
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      // 기존 스트림 정리
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }

      // 선택된 카메라 ID 결정
      const deviceId = specificDeviceId || state.selectedCameraId;
      
      const stream = await createStreamWithCamera(deviceId || undefined);
      
      // 카메라 목록 업데이트
      const cameras = await getAvailableCameras();
      
      // 실제 사용된 카메라 ID 확인
      const videoTrack = stream.getVideoTracks()[0];
      const actualDeviceId = videoTrack.getSettings().deviceId;
      
      // 설정 저장
      if (actualDeviceId) {
        saveCameraId(actualDeviceId);
      }
      
      setState(prev => ({
        ...prev,
        permission: 'granted',
        stream,
        error: null,
        availableCameras: cameras,
        selectedCameraId: actualDeviceId || null
      }));
      
      toast.success('카메라 권한이 허용되었습니다!');
      
      // 권한 허용 성공 시 실제 카메라 정보도 함께 반환
      const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
      
      return { 
        success: true, 
        stream,
        deviceInfo: {
          label: videoTrack.label,
          deviceId: actualDeviceId,
          capabilities
        }
      };
    } catch (error: unknown) {
      console.error('카메라 권한 요청 실패:', error);
      
      let errorMessage = '카메라 접근에 실패했습니다.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '카메라가 다른 애플리케이션에서 사용 중입니다.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = '요청된 카메라 설정을 지원하지 않습니다.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'HTTPS 환경에서만 카메라를 사용할 수 있습니다.';
        } else if (error.name === 'ConstraintNotSatisfiedError') {
          errorMessage = '선택한 카메라를 사용할 수 없습니다. 다른 카메라를 선택해주세요.';
        }
      }
      
      setState(prev => ({
        ...prev,
        permission: 'denied',
        stream: null,
        error: errorMessage
      }));
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.stream, state.selectedCameraId, createStreamWithCamera, getAvailableCameras]);

  // 카메라 선택
  const selectCamera = useCallback(async (deviceId: string) => {
    if (!deviceId) return { success: false, error: '유효하지 않은 카메라 ID입니다.' };
    
    console.log('카메라 선택:', deviceId);
    setState(prev => ({ ...prev, selectedCameraId: deviceId }));
    
    // 이미 권한이 있는 경우 바로 카메라 전환
    if (state.permission === 'granted') {
      return await requestPermission(deviceId);
    }
    
    // 저장만 하고 권한 요청은 하지 않음
    saveCameraId(deviceId);
    return { success: true };
  }, [state.permission, requestPermission]);

  // 카메라 스트림 중지
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, stream: null }));
    }
  }, [state.stream]);

  // 초기 권한 상태 확인
  useEffect(() => {
    const initializePermission = async () => {
      const permission = await checkPermission();
      setState(prev => ({ ...prev, permission }));
    };
    
    initializePermission();
  }, [checkPermission]);

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    requestPermission,
    stopCamera,
    checkPermission,
    getAvailableCameras,
    selectCamera
  };
}; 