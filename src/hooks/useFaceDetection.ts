import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import { toast } from "sonner";

// 1. 인터페이스 정의 제거 및 타입 별칭 사용
// type BoxData extends faceapi.Box {}
// type DetectionData extends faceapi.FaceDetection {}
// type LandmarksData extends faceapi.FaceLandmarks68 {}

// FullFaceDescriptionType 정의 수정
type FullFaceDescriptionType = {
  detection: faceapi.FaceDetection;    // faceapi.FaceDetection 직접 사용
  landmarks: faceapi.FaceLandmarks68;  // faceapi.FaceLandmarks68 직접 사용
  expressions: faceapi.FaceExpressions;
};

export interface FaceAnalysisResult {
  isDrowsy: boolean;
  isAttentive: boolean;
  emotion: string;
  ear: number;
  mar: number; // Mouth Aspect Ratio
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown';
  headPose: {
    yaw: number;    // 좌우 회전
    pitch: number;  // 상하 회전
    roll: number;   // 기울기
  };
  blinkRate: number;
  attentionScore: number; // 0-100 점수
  fatigueLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onFaceDetected: (result?: FaceAnalysisResult) => void;
  onFaceNotDetected: () => void;
  showPreview: boolean;
}

// 고급 EAR 계산 (더 정확한 눈 감김 비율)
function computeAdvancedEAR(eye: faceapi.Point[]): number {
  if (eye.length < 6) {
    console.warn("⚠️ EAR 계산: 눈 랜드마크 포인트 부족", { points: eye.length });
    return 0.25; // 기본값
  }
  
  const euclideanDistance = (a: faceapi.Point, b: faceapi.Point) => 
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  
  // 수직 거리들
  const vertical1 = euclideanDistance(eye[1], eye[5]);
  const vertical2 = euclideanDistance(eye[2], eye[4]);
  
  // 수평 거리
  const horizontal = euclideanDistance(eye[0], eye[3]);
  
  // EAR 계산 (더 정교한 공식)
  const ear = (vertical1 + vertical2) / (2.0 * horizontal);
  
  // 디버깅: 가끔씩 EAR 계산 과정 로그 (5% 확률)
  if (Math.random() < 0.05) {
    console.log("👁️ EAR 계산:", {
      vertical1: vertical1.toFixed(2),
      vertical2: vertical2.toFixed(2),
      horizontal: horizontal.toFixed(2),
      ear: ear.toFixed(3),
      eyePoints: eye.length
    });
  }
  
  return ear;
}

// MAR 계산 (입 벌림 비율 - 하품 감지용)
function computeMAR(mouth: faceapi.Point[]): number {
  if (mouth.length < 20) return 0; // 기본값
  
  const euclideanDistance = (a: faceapi.Point, b: faceapi.Point) => 
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  
  // 입 세로 거리들
  const vertical1 = euclideanDistance(mouth[13], mouth[19]); // 상단-하단
  const vertical2 = euclideanDistance(mouth[14], mouth[18]); // 중앙 상-하
  const vertical3 = euclideanDistance(mouth[15], mouth[17]); // 내부 상-하
  
  // 입 가로 거리
  const horizontal = euclideanDistance(mouth[12], mouth[16]); // 좌-우 모서리
  
  return (vertical1 + vertical2 + vertical3) / (3.0 * horizontal);
}

// 머리 자세 추정 (Head Pose Estimation)
function estimateHeadPose(landmarks: faceapi.FaceLandmarks68): { yaw: number; pitch: number; roll: number } {
  // 주요 얼굴 포인트들
  const noseTip = landmarks.getNose()[3]; // 코끝
  const chin = landmarks.getJawOutline()[8]; // 턱
  const leftEyeCorner = landmarks.getLeftEye()[0]; // 왼쪽 눈 모서리
  const rightEyeCorner = landmarks.getRightEye()[3]; // 오른쪽 눈 모서리
  const leftMouth = landmarks.getMouth()[0]; // 입 왼쪽
  const rightMouth = landmarks.getMouth()[6]; // 입 오른쪽
  
  // Yaw (좌우 회전) 계산
  const eyeCenter = {
    x: (leftEyeCorner.x + rightEyeCorner.x) / 2,
    y: (leftEyeCorner.y + rightEyeCorner.y) / 2
  };
  const noseToEyeCenter = noseTip.x - eyeCenter.x;
  const yaw = Math.atan2(noseToEyeCenter, Math.abs(leftEyeCorner.x - rightEyeCorner.x)) * (180 / Math.PI);
  
  // Pitch (상하 회전) 계산
  const eyeToNose = noseTip.y - eyeCenter.y;
  const noseToMouth = Math.abs(noseTip.y - (leftMouth.y + rightMouth.y) / 2);
  const pitch = Math.atan2(eyeToNose, noseToMouth) * (180 / Math.PI);
  
  // Roll (기울기) 계산
  const eyeSlope = (rightEyeCorner.y - leftEyeCorner.y) / (rightEyeCorner.x - leftEyeCorner.x);
  const roll = Math.atan(eyeSlope) * (180 / Math.PI);
  
  return { yaw, pitch, roll };
}

// 고급 시선 추적 알고리즘
function advancedGazeEstimation(landmarks: faceapi.FaceLandmarks68): 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown' {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  
  if (!leftEye || !rightEye || !nose) return 'unknown';
  
  // 눈동자 중심 추정
  const leftEyeCenter = {
    x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
    y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
  };
  
  const rightEyeCenter = {
    x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
    y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
  };
  
  const noseTip = nose[3];
  const eyeCenter = {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2
  };
  
  // 시선 벡터 계산
  const gazeVector = {
    x: noseTip.x - eyeCenter.x,
    y: noseTip.y - eyeCenter.y
  };
  
  // 임계값 설정 (더 정확한 판단)
  const horizontalThreshold = 8;
  const verticalThreshold = 6;
  
  if (Math.abs(gazeVector.x) > horizontalThreshold) {
    return gazeVector.x > 0 ? 'right' : 'left';
  }
  if (Math.abs(gazeVector.y) > verticalThreshold) {
    return gazeVector.y > 0 ? 'down' : 'up';
  }
  
  return 'center';
}

// 집중도 점수 계산 알고리즘
function calculateAttentionScore(
  ear: number, 
  mar: number, 
  headPose: { yaw: number; pitch: number; roll: number },
  gazeDirection: string,
  blinkRate: number
): number {
  let score = 100;
  
  // EAR 기반 감점 (눈 감김)
  if (ear < 0.15) score -= 40; // 심각한 졸음
  else if (ear < 0.20) score -= 25; // 중간 졸음
  else if (ear < 0.25) score -= 10; // 가벼운 졸음
  
  // MAR 기반 감점 (하품)
  if (mar > 0.7) score -= 30; // 하품
  else if (mar > 0.5) score -= 15; // 입 벌림
  
  // 머리 자세 기반 감점
  const totalHeadMovement = Math.abs(headPose.yaw) + Math.abs(headPose.pitch) + Math.abs(headPose.roll);
  if (totalHeadMovement > 45) score -= 25; // 심한 고개 움직임
  else if (totalHeadMovement > 25) score -= 15; // 중간 고개 움직임
  
  // 시선 방향 기반 감점
  if (gazeDirection !== 'center') score -= 20;
  
  // 깜빡임 빈도 기반 감점 (개선된 로직)
  if (blinkRate < 8) score -= 35; // 매우 졸림 (심각한 깜빡임 부족)
  else if (blinkRate < 12) score -= 20; // 졸림 (깜빡임 부족)
  else if (blinkRate > 35) score -= 25; // 매우 긴장/스트레스 (과도한 깜빡임)
  else if (blinkRate > 25) score -= 10; // 약간 긴장 (높은 깜빡임)
  // 12-25회/분은 정상 범위로 감점하지 않음
  
  return Math.max(0, Math.min(100, score));
}

// 피로도 레벨 판단
function assessFatigueLevel(attentionScore: number, ear: number, consecutiveDrowsyFrames: number): 'low' | 'medium' | 'high' {
  if (attentionScore < 30 || ear < 0.15 || consecutiveDrowsyFrames > 10) {
    return 'high';
  } else if (attentionScore < 60 || ear < 0.20 || consecutiveDrowsyFrames > 5) {
    return 'medium';
  }
  return 'low';
}

export const useFaceDetection = ({
  videoRef,
  canvasRef,
  onFaceDetected,
  onFaceNotDetected,
  showPreview,
}: UseFaceDetectionProps) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(Date.now());
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null);
  
  const [blinkHistory, setBlinkHistory] = useState<number[]>([]);
  const [consecutiveDrowsyFrames, setConsecutiveDrowsyFrames] = useState(0);
  const [earHistory, setEarHistory] = useState<number[]>([]);
  const [attentionHistory, setAttentionHistory] = useState<number[]>([]);
  
  // 깜빡임 감지를 위한 상태 추가
  const [blinkTimestamps, setBlinkTimestamps] = useState<number[]>([]);
  const [isEyeClosed, setIsEyeClosed] = useState(false);
  const [lastBlinkTime, setLastBlinkTime] = useState(0);
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const lastFullDetectionsRef = useRef<FullFaceDescriptionType[]>([]); 
  const smoothedBoxesRef = useRef<Map<number, faceapi.Rect>>(new Map());
  const isDetectingRef = useRef(false);

  // 깜빡임 감지 함수
  const detectBlink = useCallback((ear: number): number => {
    const currentTime = Date.now();
    const BLINK_THRESHOLD = 0.25; // 임계값을 0.21에서 0.25로 상향 조정
    const MIN_BLINK_DURATION = 100; // 최소 지속시간을 80ms에서 100ms로 조정
    const MAX_BLINK_DURATION = 500; // 최대 지속시간을 400ms에서 500ms로 조정
    
    // 디버깅: EAR 값과 상태 로깅 (10프레임마다)
    if (Math.random() < 0.1) { // 10% 확률로 로그 출력
      console.log("👁️ 깜빡임 감지:", {
        ear: ear.toFixed(3),
        threshold: BLINK_THRESHOLD,
        isEyeClosed,
        timeSinceLastBlink: currentTime - lastBlinkTime
      });
    }
    
    // 눈이 감긴 상태 감지
    if (ear < BLINK_THRESHOLD && !isEyeClosed) {
      console.log("👁️ 눈 감김 감지:", { ear: ear.toFixed(3), time: currentTime });
      setIsEyeClosed(true);
      setLastBlinkTime(currentTime);
    }
    // 눈이 다시 뜬 상태 감지 (깜빡임 완료)
    else if (ear >= BLINK_THRESHOLD && isEyeClosed) {
      const blinkDuration = currentTime - lastBlinkTime;
      console.log("👁️ 눈 뜸 감지:", { 
        ear: ear.toFixed(3), 
        duration: blinkDuration,
        isValid: blinkDuration >= MIN_BLINK_DURATION && blinkDuration <= MAX_BLINK_DURATION
      });
      
      // 유효한 깜빡임인지 확인 (너무 짧거나 길지 않은지)
      if (blinkDuration >= MIN_BLINK_DURATION && blinkDuration <= MAX_BLINK_DURATION) {
        console.log("✅ 유효한 깜빡임 감지됨!", { duration: blinkDuration });
        setBlinkTimestamps(prev => {
          const newTimestamps = [...prev, currentTime];
          const filtered = newTimestamps.filter(timestamp => currentTime - timestamp <= 60000);
          console.log("📊 깜빡임 기록 업데이트:", { 
            newCount: filtered.length,
            recentBlinks: filtered.slice(-5)
          });
          return filtered;
        });
      } else {
        console.log("❌ 무효한 깜빡임:", { 
          duration: blinkDuration,
          tooShort: blinkDuration < MIN_BLINK_DURATION,
          tooLong: blinkDuration > MAX_BLINK_DURATION
        });
      }
      
      setIsEyeClosed(false);
    }
    
    // 현재 1분간 깜빡임 횟수 계산
    const recentBlinks = blinkTimestamps.filter(timestamp => currentTime - timestamp <= 60000);
    
    // 깜빡임 카운트 변경 시 로그
    if (recentBlinks.length !== blinkTimestamps.length) {
      console.log("📈 깜빡임 카운트 업데이트:", { 
        currentCount: recentBlinks.length,
        totalRecords: blinkTimestamps.length
      });
    }
    
    return recentBlinks.length;
  }, [isEyeClosed, lastBlinkTime, blinkTimestamps]);

  // 깜빡임 기반 졸음 판단
  const assessDrowsinessFromBlinks = useCallback((blinksPerMinute: number): { isDrowsyFromBlinks: boolean; blinkStatus: string } => {
    if (blinksPerMinute < 8) {
      return { isDrowsyFromBlinks: true, blinkStatus: '매우 졸림' };
    } else if (blinksPerMinute < 12) {
      return { isDrowsyFromBlinks: true, blinkStatus: '졸림' };
    } else if (blinksPerMinute <= 25) {
      return { isDrowsyFromBlinks: false, blinkStatus: '정상' };
    } else if (blinksPerMinute <= 35) {
      return { isDrowsyFromBlinks: false, blinkStatus: '약간 긴장' };
    } else {
      return { isDrowsyFromBlinks: false, blinkStatus: '매우 긴장' };
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updateCanvasGeometry = () => {
      console.log("🎨 updateCanvasGeometry 호출됨:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        clientWidth: video.clientWidth,
        clientHeight: video.clientHeight,
        readyState: video.readyState,
        currentTime: video.currentTime
      });

      if (!video.videoWidth || !video.videoHeight) {
        console.warn("⚠️ 비디오 원본 크기 정보 없음, 대기 중...");
        setIsCameraReady(false);
        return;
      }

      if (video.clientWidth === 0 || video.clientHeight === 0) {
        console.warn("⚠️ 비디오 요소 크기 정보 없음, 대기 중...");
        setIsCameraReady(false);
        return;
      }

      const devicePixelRatio = window.devicePixelRatio || 1;
      const videoClientWidth = video.clientWidth;
      const videoClientHeight = video.clientHeight;
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const clientAspectRatio = videoClientWidth / videoClientHeight;
      let renderedVideoWidth, renderedVideoHeight, offsetX, offsetY;

      if (videoAspectRatio > clientAspectRatio) {
        renderedVideoWidth = videoClientWidth;
        renderedVideoHeight = videoClientWidth / videoAspectRatio;
        offsetX = 0;
        offsetY = (videoClientHeight - renderedVideoHeight) / 2;
      } else {
        renderedVideoHeight = videoClientHeight;
        renderedVideoWidth = videoClientHeight * videoAspectRatio;
        offsetY = 0;
        offsetX = (videoClientWidth - renderedVideoWidth) / 2;
      }

      console.log("✅ 캔버스 지오메트리 계산 완료:", {
        비디오원본: `${video.videoWidth}x${video.videoHeight}`,
        비디오요소: `${videoClientWidth}x${videoClientHeight}`,
        렌더링영역: `${Math.round(renderedVideoWidth)}x${Math.round(renderedVideoHeight)}`,
        오프셋: `${Math.round(offsetX)}, ${Math.round(offsetY)}`,
        비율차이: videoAspectRatio > clientAspectRatio ? '가로레터박스' : '세로레터박스'
      });

      canvas.style.width = `${renderedVideoWidth}px`;
      canvas.style.height = `${renderedVideoHeight}px`;
      canvas.style.left = `${offsetX}px`;
      canvas.style.top = `${offsetY}px`;
      canvas.style.position = 'absolute';

      canvas.width = Math.round(renderedVideoWidth * devicePixelRatio);
      canvas.height = Math.round(renderedVideoHeight * devicePixelRatio);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      }
      
      faceapi.matchDimensions(canvas, { width: renderedVideoWidth, height: renderedVideoHeight });
      
      console.log("✅ 카메라 준비 완료 설정");
      setIsCameraReady(true);
    };

    const observer = new ResizeObserver(updateCanvasGeometry);
    observer.observe(video);
    video.addEventListener('loadedmetadata', updateCanvasGeometry);
    video.addEventListener('play', updateCanvasGeometry);
    video.addEventListener('resize', updateCanvasGeometry);
    
    // 추가: 비디오 스트림 변경 시에도 지오메트리 업데이트
    video.addEventListener('loadeddata', updateCanvasGeometry);

    if (video.videoWidth && video.videoHeight && video.clientWidth && video.clientHeight) {
      updateCanvasGeometry();
    }

    return () => {
      observer.unobserve(video);
      observer.disconnect();
      video.removeEventListener('loadedmetadata', updateCanvasGeometry);
      video.removeEventListener('play', updateCanvasGeometry);
      video.removeEventListener('resize', updateCanvasGeometry);
      video.removeEventListener('loadeddata', updateCanvasGeometry);
      setIsCameraReady(false);
    };
  }, [videoRef, canvasRef, isCameraReady]);

  const memoizedStopDetection = useCallback(() => {
    console.log("🛑 얼굴 인식 중지 요청 (memoized)");
    setIsDetecting(false);
    isDetectingRef.current = false;
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const cssDrawingWidth = parseFloat(canvasRef.current.style.width) || 0;
        const cssDrawingHeight = parseFloat(canvasRef.current.style.height) || 0;
        if (cssDrawingWidth > 0 && cssDrawingHeight > 0) {
            ctx.clearRect(0, 0, cssDrawingWidth, cssDrawingHeight);
        }
      }
    }
    lastFullDetectionsRef.current = [];
    frameCountRef.current = 0;
    setConsecutiveDrowsyFrames(0);
    setEarHistory([]);
    setAttentionHistory([]);
    // 깜빡임 관련 상태 초기화
    setBlinkTimestamps([]);
    setIsEyeClosed(false);
    setLastBlinkTime(0);
    smoothedBoxesRef.current.clear();
  }, [canvasRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleStreamChange = () => {
        console.log("📹 비디오 스트림 변경 감지 (loadeddata)");
        setIsCameraReady(false); 
        if (isDetectingRef.current) {
          memoizedStopDetection();
        }
      };
      video.addEventListener('loadeddata', handleStreamChange);
      return () => {
        video.removeEventListener('loadeddata', handleStreamChange);
      };
    }
  }, [videoRef, memoizedStopDetection]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("🧠 AI 모델 로딩 시작...");
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setIsModelLoaded(true); console.log("🎯 모든 AI 모델 로딩 완료!");
      } catch (error) {
        console.error("❌ 모델 로딩 실패:", error);
        setModelLoadingError("AI 모델을 로드하지 못했습니다.");
        toast.error("AI 모델 로딩에 실패했습니다.");
      }
    };
    loadModels();
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  
  const drawDetections = useCallback((
    canvas: HTMLCanvasElement,
    fullDetections: FullFaceDescriptionType[],
    videoForOriginalDimsRef: React.RefObject<HTMLVideoElement>
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    // 기존 방식대로 videoRef에서 클라이언트 크기 가져오기
    const videoElement = videoForOriginalDimsRef.current;
    if (!videoElement || videoElement.clientWidth === 0 || videoElement.clientHeight === 0) {
      console.warn("⚠️ drawDetections: 비디오 요소가 없거나 크기가 0입니다.", {
        hasVideoElement: !!videoElement,
        videoClientWidth: videoElement?.clientWidth,
        videoClientHeight: videoElement?.clientHeight,
        videoReadyState: videoElement?.readyState,
      });
      return;
    }

    const cssDrawingWidth = videoElement.clientWidth;
    const cssDrawingHeight = videoElement.clientHeight;

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
 
    // 캔버스를 실제 크기로 확대 (scale() 사용)
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, cssDrawingWidth, cssDrawingHeight);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, cssDrawingWidth, cssDrawingHeight);
    ctx.restore();

    if (fullDetections.length === 0) {
      const time = Date.now() / 1000;
      const pulseIntensity = 0.5 + 0.3 * Math.sin(time * 2);
      const guideWidth = Math.min(cssDrawingWidth * 0.6, 250);
      const guideHeight = guideWidth * 1.2;
      const guideX = (cssDrawingWidth - guideWidth) / 2;
      const guideY = (cssDrawingHeight - guideHeight) / 2;

      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.6})`;
      ctx.lineWidth = 2 / dpr;
      ctx.setLineDash([10 / dpr, 5 / dpr]);
      ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
      ctx.restore();

      ctx.save();
      const cornerSize = 15;
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
      ctx.lineWidth = 3 / dpr;
      ctx.setLineDash([]);
      const corners = [
        [guideX, guideY], [guideX + guideWidth, guideY],
        [guideX, guideY + guideHeight], [guideX + guideWidth, guideY + guideHeight]
      ];
      corners.forEach(([xPos, yPos], i) => {
        ctx.beginPath();
        if (i === 0) { ctx.moveTo(xPos, yPos + cornerSize); ctx.lineTo(xPos, yPos); ctx.lineTo(xPos + cornerSize, yPos); }
        else if (i === 1) { ctx.moveTo(xPos, yPos + cornerSize); ctx.lineTo(xPos, yPos); ctx.lineTo(xPos - cornerSize, yPos); }
        else if (i === 2) { ctx.moveTo(xPos, yPos - cornerSize); ctx.lineTo(xPos, yPos); ctx.lineTo(xPos + cornerSize, yPos); }
        else { ctx.moveTo(xPos, yPos - cornerSize); ctx.lineTo(xPos, yPos); ctx.lineTo(xPos - cornerSize, yPos); }
        ctx.stroke();
      });
      ctx.restore();
      
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.8})`;
      ctx.font = `16px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textX = cssDrawingWidth / 2;
      const textY = guideY - 20;
      ctx.fillText('얼굴을 화면에 맞춰주세요', textX, textY);
      ctx.restore();
      return;
    }

    const displaySize = { width: cssDrawingWidth, height: cssDrawingHeight };

    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      console.warn("⚠️ drawDetections: 얼굴 박스 스케일링을 위한 원본 비디오 크기 정보 없음");
      return;
    }

    fullDetections.forEach((fullDescription, index) => {
      const detectionBox = fullDescription.detection.box;
      if (!detectionBox) return;

      const currentRect = new faceapi.Rect(detectionBox.x, detectionBox.y, detectionBox.width, detectionBox.height);
      let smoothedBox = currentRect;
      const previousSmoothedBox = smoothedBoxesRef.current.get(index);
      if (previousSmoothedBox) {
        smoothedBox = new faceapi.Rect(
          lerp(previousSmoothedBox.x, currentRect.x, SMOOTHING_FACTOR),
          lerp(previousSmoothedBox.y, currentRect.y, SMOOTHING_FACTOR),
          lerp(previousSmoothedBox.width, currentRect.width, SMOOTHING_FACTOR),
          lerp(previousSmoothedBox.height, currentRect.height, SMOOTHING_FACTOR)
        );
      }
      smoothedBoxesRef.current.set(index, smoothedBox);

      const scaleX = cssDrawingWidth / videoElement.videoWidth;
      const scaleY = cssDrawingHeight / videoElement.videoHeight;
      const x = smoothedBox.x * scaleX;
      const y = smoothedBox.y * scaleY;
      const width = smoothedBox.width * scaleX;
      const height = smoothedBox.height * scaleY;
      
      ctx.save();
      const cornerLineLength = 30;
      const cornerRadius = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 4 / dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const rectX = x; const rectY = y; const rectWidth = width; const rectHeight = height;
      const cornersForRect = [
        { x: rectX, y: rectY, type: 'topLeft' }, { x: rectX + rectWidth, y: rectY, type: 'topRight' },
        { x: rectX, y: rectY + rectHeight, type: 'bottomLeft' }, { x: rectX + rectWidth, y: rectY + rectHeight, type: 'bottomRight' }
      ];
      cornersForRect.forEach(corner => {
        ctx.beginPath();
        if (corner.type === 'topLeft') { ctx.moveTo(corner.x + cornerLineLength, corner.y); ctx.lineTo(corner.x + cornerRadius, corner.y); ctx.quadraticCurveTo(corner.x, corner.y, corner.x, corner.y + cornerRadius); ctx.lineTo(corner.x, corner.y + cornerLineLength); }
        else if (corner.type === 'topRight') { ctx.moveTo(corner.x - cornerLineLength, corner.y); ctx.lineTo(corner.x - cornerRadius, corner.y); ctx.quadraticCurveTo(corner.x, corner.y, corner.x, corner.y + cornerRadius); ctx.lineTo(corner.x, corner.y + cornerLineLength); }
        else if (corner.type === 'bottomLeft') { ctx.moveTo(corner.x, corner.y - cornerLineLength); ctx.lineTo(corner.x, corner.y - cornerRadius); ctx.quadraticCurveTo(corner.x, corner.y, corner.x + cornerRadius, corner.y); ctx.lineTo(corner.x + cornerLineLength, corner.y); }
        else { ctx.moveTo(corner.x, corner.y - cornerLineLength); ctx.lineTo(corner.x, corner.y - cornerRadius); ctx.quadraticCurveTo(corner.x, corner.y, corner.x - cornerRadius, corner.y); ctx.lineTo(corner.x - cornerLineLength, corner.y); }
        ctx.stroke();
      });
      ctx.restore();
      
      const resizedResult = faceapi.resizeResults(fullDescription, displaySize) as FullFaceDescriptionType;
      if (resizedResult && resizedResult.landmarks) {
        faceapi.draw.drawFaceLandmarks(canvas, resizedResult.landmarks);
      }
    });

    if (smoothedBoxesRef.current.size > fullDetections.length) {
      const newSmoothedBoxes = new Map<number, faceapi.Rect>();
      fullDetections.forEach((_, index) => {
        if (smoothedBoxesRef.current.has(index)) {
          newSmoothedBoxes.set(index, smoothedBoxesRef.current.get(index)!);
        }
      });
      smoothedBoxesRef.current = newSmoothedBoxes;
    }
  }, []);

  const startDetection = useCallback(() => {
    console.log("🚀 startDetection 호출됨 - 상태 확인:", {
      isModelLoaded,
      isDetectingRef: isDetectingRef.current,
      isCameraReady,
      videoRef: !!videoRef.current,
      canvasRef: !!canvasRef.current,
      videoReadyState: videoRef.current?.readyState,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight,
      videoClientWidth: videoRef.current?.clientWidth,
      videoClientHeight: videoRef.current?.clientHeight
    });

    if (!isModelLoaded) { 
      console.log("❌ AI 모델이 로드되지 않음");
      toast.error("AI 모델 로딩 필요"); 
      return; 
    }
    if (isDetectingRef.current) { 
      console.log("⚠️ 이미 감지 실행 중"); 
      return; 
    }

    // isCameraReady 체크를 더 유연하게 변경
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.log("❌ 비디오 또는 캔버스 요소가 없음");
      toast.error("카메라 요소 초기화 실패");
      return;
    }

    // 비디오가 준비되지 않은 경우 대기
    if (video.readyState < 2) {
      console.log("⏳ 비디오 로딩 대기 중...", { readyState: video.readyState });
      setTimeout(() => startDetection(), 500);
      return;
    }

    // 비디오 메타데이터 확인
    if (!video.videoWidth || !video.videoHeight) {
      console.log("⏳ 비디오 메타데이터 대기 중...", { 
        videoWidth: video.videoWidth, 
        videoHeight: video.videoHeight 
      });
      setTimeout(() => startDetection(), 500);
      return;
    }

    console.log("✅ 모든 조건 충족, 감지 시작");
    
    setIsDetecting(true);
    isDetectingRef.current = true;
    setLastDetectionTime(Date.now());
    frameCountRef.current = 0;

    let lastAnimateTime = 0;
    const animate = (currentTime: number) => {
      if (!isDetectingRef.current) return;
      animationFrameRef.current = requestAnimationFrame(animate);
      if (currentTime - lastAnimateTime < 16) return; // 약 60fps
      lastAnimateTime = currentTime;
      if (canvasRef.current && showPreview) {
        drawDetections(canvasRef.current, lastFullDetectionsRef.current, videoRef);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (video && isDetectingRef.current && video.readyState >= video.HAVE_ENOUGH_DATA) {
        frameCountRef.current++;
        try {
          const detection = await faceapi
            .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
            .withFaceLandmarks().withFaceExpressions();
          
          // 단일 감지 결과를 배열로 변환하여 기존 로직과 호환
          const detections: FullFaceDescriptionType[] = detection ? [detection] : [];
          lastFullDetectionsRef.current = detections;
          
          if (detection) {
            setLastDetectionTime(Date.now());
            const desc = detection;
            const { yaw, pitch, roll } = estimateHeadPose(desc.landmarks);
            const ear = (computeAdvancedEAR(desc.landmarks.getLeftEye()) + computeAdvancedEAR(desc.landmarks.getRightEye())) / 2;
            const mar = computeMAR(desc.landmarks.getMouth());
            const gaze = advancedGazeEstimation(desc.landmarks);
            const emotion = desc.expressions.asSortedArray()[0]?.expression || 'neutral';
            
            // 실제 깜빡임 카운트
            const blinkRate = detectBlink(ear);
            const { isDrowsyFromBlinks, blinkStatus } = assessDrowsinessFromBlinks(blinkRate);
            
            // 디버깅: 주요 값들 로그 (20프레임마다)
            if (frameCountRef.current % 20 === 0) {
              console.log("🔍 얼굴 분석 결과:", {
                frame: frameCountRef.current,
                ear: ear.toFixed(3),
                mar: mar.toFixed(3),
                blinkRate,
                blinkStatus,
                isDrowsyFromBlinks,
                emotion,
                leftEyeEAR: computeAdvancedEAR(desc.landmarks.getLeftEye()).toFixed(3),
                rightEyeEAR: computeAdvancedEAR(desc.landmarks.getRightEye()).toFixed(3)
              });
            }
            
            // 기존 졸음 감지 로직과 깜빡임 기반 졸음 감지 결합
            const isDrowsyFromEyes = ear < 0.20;
            const isDrowsyFromMouth = mar > 0.4;
            const isDrowsyFromHead = Math.abs(pitch) > 25;
            
            const isDrowsy = isDrowsyFromEyes || isDrowsyFromMouth || isDrowsyFromHead || isDrowsyFromBlinks;
            
            if (isDrowsy) setConsecutiveDrowsyFrames(prev => prev + 1); else setConsecutiveDrowsyFrames(0);
            const newEarHistory = [...earHistory, ear].slice(-30);
            setEarHistory(newEarHistory);
            
            const attentionScore = calculateAttentionScore(ear, mar, { yaw, pitch, roll }, gaze, blinkRate);
            const fatigueLevel = assessFatigueLevel(attentionScore, ear, consecutiveDrowsyFrames);
            const newAttentionHistory = [...attentionHistory, attentionScore].slice(-60);
            setAttentionHistory(newAttentionHistory);
            onFaceDetected({
              isDrowsy, isAttentive: attentionScore > 70, emotion, ear, mar, 
              gazeDirection: gaze, headPose: { yaw, pitch, roll }, 
              blinkRate, attentionScore, fatigueLevel, confidence: Math.round(desc.detection.score * 100)
            });
          } else {
            lastFullDetectionsRef.current = [];
            if (Date.now() - lastDetectionTime > 5000) {
              onFaceNotDetected(); setLastDetectionTime(Date.now());
            }
          }
        } catch (err) { console.error("얼굴 분석 오류:", err); }
      }
    }, 150);
  }, [isModelLoaded, isCameraReady, showPreview, onFaceDetected, onFaceNotDetected, videoRef, canvasRef, earHistory, attentionHistory, drawDetections, memoizedStopDetection, detectBlink, assessDrowsinessFromBlinks]);
  
  const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
  const SMOOTHING_FACTOR = 0.2;

  return {
    isModelLoaded,
    isDetecting,
    isCameraReady,
    startDetection,
    stopDetection: memoizedStopDetection,
    modelLoadingError
  };
};

