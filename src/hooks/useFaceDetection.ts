import { useState, useEffect, useRef, useCallback } from "react";
import * as H from "@vladmandic/human";
import { toast } from "sonner";

// 1. 인터페이스 정의 제거 및 타입 별칭 사용
// type BoxData extends faceapi.Box {}
// type DetectionData extends faceapi.FaceDetection {}
// type LandmarksData extends faceapi.FaceLandmarks68 {}

// Human 라이브러리 타입 정의
interface FaceResult {
  mesh?: number[][];
  iris?: Array<{ center: number[] }>;
  emotion?: Array<{ emotion: string; score: number }>;
  boxScore?: number;
}

export interface FaceAnalysisResult {
  isDrowsy: boolean;
  isAttentive: boolean;
  emotion: string;
  ear: number;
  mar: number; // Mouth Aspect Ratio
  isYawning: boolean; // 하품 여부
  gazeDirection: 'left' | 'right' | 'up' | 'down' | 'center' | 'unknown';
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

// Human 라이브러리 설정
const humanConfig: Partial<H.Config> = {
  debug: false,
  backend: 'webgl',
  modelBasePath: 'https://vladmandic.github.io/human-models/models/',
  filter: { enabled: true, equalization: false, flip: false },
  face: { 
    enabled: true, 
    detector: { rotation: false, return: true, mask: false }, 
    mesh: { enabled: true }, 
    attention: { enabled: true }, 
    iris: { enabled: true }, 
    description: { enabled: true }, 
    emotion: { enabled: true }, 
    antispoof: { enabled: false }, // 성능 개선을 위해 비활성화
    liveness: { enabled: false }   // 성능 개선을 위해 비활성화
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  segmentation: { enabled: false },
  gesture: { enabled: false }, // 불필요한 기능 비활성화
};

// EAR (Eye Aspect Ratio) 계산 함수 - Human 라이브러리의 iris 데이터 사용
const computeEAR = (eyePoints: number[][]): number => {
  if (!eyePoints || eyePoints.length < 6) return 0.3;
  
  // 눈의 수직 거리 계산
  const verticalDist1 = Math.sqrt(
    Math.pow(eyePoints[1][0] - eyePoints[5][0], 2) + 
    Math.pow(eyePoints[1][1] - eyePoints[5][1], 2)
  );
  const verticalDist2 = Math.sqrt(
    Math.pow(eyePoints[2][0] - eyePoints[4][0], 2) + 
    Math.pow(eyePoints[2][1] - eyePoints[4][1], 2)
  );
  
  // 눈의 수평 거리 계산
  const horizontalDist = Math.sqrt(
    Math.pow(eyePoints[0][0] - eyePoints[3][0], 2) + 
    Math.pow(eyePoints[0][1] - eyePoints[3][1], 2)
  );
  
  if (horizontalDist === 0) return 0.3;
  
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
};

// MAR (Mouth Aspect Ratio) 계산 함수
const computeMAR = (mouthPoints: number[][]): number => {
  if (!mouthPoints || mouthPoints.length < 8) return 0.0;
  
  // 입의 수직 거리 계산
  const verticalDist1 = Math.sqrt(
    Math.pow(mouthPoints[2][0] - mouthPoints[6][0], 2) + 
    Math.pow(mouthPoints[2][1] - mouthPoints[6][1], 2)
  );
  const verticalDist2 = Math.sqrt(
    Math.pow(mouthPoints[3][0] - mouthPoints[5][0], 2) + 
    Math.pow(mouthPoints[3][1] - mouthPoints[5][1], 2)
  );
  
  // 입의 수평 거리 계산
  const horizontalDist = Math.sqrt(
    Math.pow(mouthPoints[0][0] - mouthPoints[4][0], 2) + 
    Math.pow(mouthPoints[0][1] - mouthPoints[4][1], 2)
  );
  
  if (horizontalDist === 0) return 0.0;
  
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
};

// 머리 자세 추정 (개선된 버전)
const estimateHeadPose = (face: FaceResult): { yaw: number; pitch: number; roll: number } => {
  if (!face.mesh || face.mesh.length < 468) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // 더 정확한 얼굴 랜드마크 포인트들 사용
  const noseTip = face.mesh[1];     // 코끝
  const noseBase = face.mesh[168];  // 코 기저
  const leftEyeOuter = face.mesh[33];   // 왼쪽 눈 외측
  const rightEyeOuter = face.mesh[263]; // 오른쪽 눈 외측
  const leftEyeInner = face.mesh[133];  // 왼쪽 눈 내측
  const rightEyeInner = face.mesh[362]; // 오른쪽 눈 내측
  const chin = face.mesh[175];      // 턱 끝
  const forehead = face.mesh[10];   // 이마

  // 안전성 검사
  if (!noseTip || !noseBase || !leftEyeOuter || !rightEyeOuter || 
      !leftEyeInner || !rightEyeInner || !chin || !forehead) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // 눈 중심점 계산
  const eyeCenter = [
    (leftEyeOuter[0] + rightEyeOuter[0] + leftEyeInner[0] + rightEyeInner[0]) / 4,
    (leftEyeOuter[1] + rightEyeOuter[1] + leftEyeInner[1] + rightEyeInner[1]) / 4
  ];

  // Yaw (좌우 회전) - 코와 눈 중심의 수평 오프셋 기반
  const faceWidth = Math.abs(rightEyeOuter[0] - leftEyeOuter[0]);
  const noseOffsetX = noseTip[0] - eyeCenter[0];
  let yaw = (noseOffsetX / faceWidth) * 60; // 정규화된 각도
  yaw = Math.max(-45, Math.min(45, yaw)); // -45도 ~ +45도로 제한

  // Pitch (상하 회전) - 이마-눈-턱의 수직 관계 기반
  const faceHeight = Math.abs(forehead[1] - chin[1]);
  const eyeToForeheadDist = Math.abs(forehead[1] - eyeCenter[1]);
  const eyeToChinDist = Math.abs(chin[1] - eyeCenter[1]);
  
  // 정상적인 비율에서의 편차 계산
  const normalRatio = 0.4; // 정상적으로 눈이 얼굴 높이의 40% 위치
  const currentRatio = eyeToForeheadDist / faceHeight;
  let pitch = (currentRatio - normalRatio) * 150; // 정규화된 각도
  pitch = Math.max(-30, Math.min(30, pitch)); // -30도 ~ +30도로 제한

  // Roll (기울기) - 두 눈의 기울기
  const eyeVector = [rightEyeOuter[0] - leftEyeOuter[0], rightEyeOuter[1] - leftEyeOuter[1]];
  let roll = Math.atan2(eyeVector[1], eyeVector[0]) * (180 / Math.PI);
  roll = Math.max(-30, Math.min(30, roll)); // -30도 ~ +30도로 제한

  return { yaw, pitch, roll };
};

// 시선 방향 추정 (개선된 버전)
const estimateGazeDirection = (face: FaceResult): 'left' | 'right' | 'up' | 'down' | 'center' | 'unknown' => {
  // iris 데이터 검증
  if (!face.iris || face.iris.length < 2) {
    // console.log("👁️ iris 데이터 없음:", { hasIris: !!face.iris, length: face.iris?.length });
    return 'unknown';
  }

  const leftIris = face.iris[0];
  const rightIris = face.iris[1];

  if (!leftIris || !rightIris || !leftIris.center || !rightIris.center) {
    console.log("👁️ iris center 데이터 부족:", { 
      leftIris: !!leftIris, 
      rightIris: !!rightIris,
      leftCenter: !!leftIris?.center,
      rightCenter: !!rightIris?.center
    });
    return 'unknown';
  }

  // Human 라이브러리의 mesh를 사용하여 눈 영역 계산
  if (!face.mesh || face.mesh.length < 468) {
    console.log("👁️ mesh 데이터 부족:", { hasMesh: !!face.mesh, length: face.mesh?.length });
    return 'unknown';
  }
  
  // 더 정확한 눈 랜드마크 사용
  const leftEyeInner = face.mesh[133];   // 왼쪽 눈 내측
  const leftEyeOuter = face.mesh[33];    // 왼쪽 눈 외측
  const rightEyeInner = face.mesh[362];  // 오른쪽 눈 내측
  const rightEyeOuter = face.mesh[263];  // 오른쪽 눈 외측
  
  if (!leftEyeInner || !leftEyeOuter || !rightEyeInner || !rightEyeOuter) {
    console.log("👁️ 눈 랜드마크 데이터 부족");
    return 'unknown';
  }
  
  // 왼쪽 눈과 오른쪽 눈의 중심점 계산
  const leftEyeCenter = [(leftEyeInner[0] + leftEyeOuter[0]) / 2, (leftEyeInner[1] + leftEyeOuter[1]) / 2];
  const rightEyeCenter = [(rightEyeInner[0] + rightEyeOuter[0]) / 2, (rightEyeInner[1] + rightEyeOuter[1]) / 2];
  
  // 각 눈에서 홍채의 상대적 위치 계산
  const leftGazeOffsetX = leftIris.center[0] - leftEyeCenter[0];
  const leftGazeOffsetY = leftIris.center[1] - leftEyeCenter[1];
  const rightGazeOffsetX = rightIris.center[0] - rightEyeCenter[0];
  const rightGazeOffsetY = rightIris.center[1] - rightEyeCenter[1];
  
  // 두 눈의 평균 시선 방향 계산
  const avgGazeX = (leftGazeOffsetX + rightGazeOffsetX) / 2;
  const avgGazeY = (leftGazeOffsetY + rightGazeOffsetY) / 2;
  
  // 눈 크기 기반 적응형 임계값 계산
  const eyeWidth = Math.abs(leftEyeOuter[0] - leftEyeInner[0]);
  const thresholdX = eyeWidth * 0.15; // 눈 너비의 15%
  const thresholdY = eyeWidth * 0.1;  // 눈 너비의 10%
  
  console.log("👁️ 시선 분석:", {
    leftGazeOffset: [leftGazeOffsetX.toFixed(2), leftGazeOffsetY.toFixed(2)],
    rightGazeOffset: [rightGazeOffsetX.toFixed(2), rightGazeOffsetY.toFixed(2)],
    avgGaze: [avgGazeX.toFixed(2), avgGazeY.toFixed(2)],
    thresholds: [thresholdX.toFixed(2), thresholdY.toFixed(2)],
    eyeWidth: eyeWidth.toFixed(2)
  });
  
  // 시선 방향 결정
  if (Math.abs(avgGazeX) < thresholdX && Math.abs(avgGazeY) < thresholdY) return 'center';
  if (avgGazeX > thresholdX) return 'right';
  if (avgGazeX < -thresholdX) return 'left';
  if (avgGazeY > thresholdY) return 'down';
  if (avgGazeY < -thresholdY) return 'up';
  
  return 'center';
};

// 주의집중도 점수 계산
const calculateAttentionScore = (
  ear: number, 
  mar: number, 
  headPose: { yaw: number; pitch: number; roll: number },
  gaze: string,
  blinkRate: number,
  gazeStability: number // 시선 안정성 점수 (0-100)
): number => {
  let score = 100;

  // 눈 감김 정도 (-40점)
  if (ear < 0.15) score -= 40;
  else if (ear < 0.20) score -= 20;
  else if (ear < 0.25) score -= 10;

  // 입 벌림 정도 (-20점)
  if (mar > 0.5) score -= 20;
  else if (mar > 0.3) score -= 10;

  // 머리 자세 (-30점)
  const headAngle = Math.abs(headPose.yaw) + Math.abs(headPose.pitch);
  if (headAngle > 30) score -= 30;
  else if (headAngle > 20) score -= 15;
  else if (headAngle > 10) score -= 5;

  // 시선 안정성 (-20점) - 시선이 얼마나 일정한 곳에 머물러 있는지
  const gazeStabilityPenalty = Math.round((100 - gazeStability) * 0.2); // 0-20점 차감
  score -= gazeStabilityPenalty;

  // 깜빡임 빈도 (-15점) - 10초 단위 측정에 맞게 조정
  if (blinkRate < 6) score -= 15;      // 10초에 1회 미만 (분당 6회 미만) - 매우 졸림
  else if (blinkRate < 12) score -= 10; // 10초에 2회 미만 (분당 12회 미만) - 졸림
  else if (blinkRate > 36) score -= 10; // 10초에 6회 초과 (분당 36회 초과) - 과도한 깜빡임

  return Math.max(0, Math.min(100, score));
};

// 피로도 레벨 평가
const assessFatigueLevel = (attentionScore: number, ear: number, consecutiveDrowsyFrames: number): 'low' | 'medium' | 'high' => {
  if (attentionScore < 40 || ear < 0.15 || consecutiveDrowsyFrames > 20) return 'high';   // 3초 지속
  if (attentionScore < 70 || ear < 0.20 || consecutiveDrowsyFrames > 10) return 'medium'; // 1.5초 지속
  return 'low';
};

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
  
  const lastDetectionsRef = useRef<H.Result | null>(null);
  const isDetectingRef = useRef(false);
  const humanRef = useRef<H.Human | null>(null);

  // 깜빡임 관련 ref로 순환 참조 방지
  const blinkTimestampsRef = useRef<number[]>([]);
  const isEyeClosedRef = useRef(false);
  const lastBlinkTimeRef = useRef(0);

  // 상태 히스토리도 ref로 관리하여 성능 개선
  const consecutiveDrowsyFramesRef = useRef(0);
  const earHistoryRef = useRef<number[]>([]);
  const attentionHistoryRef = useRef<number[]>([]);
  
  // 시선 안정성 추적을 위한 히스토리
  const gazeHistoryRef = useRef<string[]>([]);
  const GAZE_HISTORY_LENGTH = 30; // 최근 30프레임의 시선 방향 추적
  
  // 졸음 감지를 위한 고급 상태 추적
  const eyeClosedDurationRef = useRef(0); // 눈이 감긴 지속 시간
  const slowBlinkCountRef = useRef(0); // 느린 깜빡임 횟수
  const lastEyeStateRef = useRef<'open' | 'closed'>('open'); // 이전 눈 상태
  const eyeStateChangeTimeRef = useRef(Date.now()); // 마지막 눈 상태 변화 시간
  const headDropCountRef = useRef(0); // 머리가 떨어지는 횟수
  const lastHeadPitchRef = useRef(0); // 이전 머리 각도
  
  // 초기 프레임 안정화를 위한 카운터
  const stableFrameCountRef = useRef(0);
  const STABLE_FRAME_THRESHOLD = 10; // 10프레임 후부터 안정적인 결과 사용

  // 시선 안정성 계산 함수
  const calculateGazeStability = useCallback((currentGaze: string): number => {
    // 현재 시선을 히스토리에 추가
    gazeHistoryRef.current.push(currentGaze);
    
    // 히스토리 길이 제한
    if (gazeHistoryRef.current.length > GAZE_HISTORY_LENGTH) {
      gazeHistoryRef.current = gazeHistoryRef.current.slice(-GAZE_HISTORY_LENGTH);
    }
    
    // 최소 10개의 데이터가 있어야 계산
    if (gazeHistoryRef.current.length < 10) {
      return 70; // 초기값은 중간 정도
    }
    
    // 가장 빈번한 시선 방향 찾기
    const gazeCounts: { [key: string]: number } = {};
    gazeHistoryRef.current.forEach(gaze => {
      gazeCounts[gaze] = (gazeCounts[gaze] || 0) + 1;
    });
    
    const mostFrequentGaze = Object.keys(gazeCounts).reduce((a, b) => 
      gazeCounts[a] > gazeCounts[b] ? a : b
    );
    
    // 가장 빈번한 방향의 비율 계산
    const mostFrequentCount = gazeCounts[mostFrequentGaze];
    const stabilityRatio = mostFrequentCount / gazeHistoryRef.current.length;
    
    // 안정성 점수 계산 (0-100)
    // 80% 이상 일정하면 만점, 50% 미만이면 0점
    let stabilityScore = 0;
    if (stabilityRatio >= 0.8) {
      stabilityScore = 100;
    } else if (stabilityRatio >= 0.7) {
      stabilityScore = 85;
    } else if (stabilityRatio >= 0.6) {
      stabilityScore = 70;
    } else if (stabilityRatio >= 0.5) {
      stabilityScore = 50;
    } else {
      stabilityScore = Math.round(stabilityRatio * 100);
    }
    
    // console.log("👁️ 시선 안정성 분석:", {
    //   currentGaze,
    //   mostFrequentGaze,
    //   stabilityRatio: stabilityRatio.toFixed(2),
    //   stabilityScore,
    //   historyLength: gazeHistoryRef.current.length
    // });
    
    return stabilityScore;
  }, [GAZE_HISTORY_LENGTH]);

  // 고급 졸음 감지 함수
  const detectAdvancedDrowsiness = useCallback((
    ear: number, 
    mar: number, 
    headPose: { yaw: number; pitch: number; roll: number },
    blinkRate: number
  ): boolean => {
    const currentTime = Date.now();
    const DROWSY_EAR_THRESHOLD = 0.18; // 졸음 임계값 (더 엄격)
    const SLOW_BLINK_DURATION = 500; // 느린 깜빡임 기준 (0.5초 이상)
    const HEAD_DROP_THRESHOLD = 15; // 머리 떨어짐 임계값
    const SUSTAINED_CLOSED_THRESHOLD = 2000; // 지속적으로 눈 감음 기준 (2초)
    
    // 1. 눈 상태 변화 추적
    const currentEyeState = ear < DROWSY_EAR_THRESHOLD ? 'closed' : 'open';
    
    if (currentEyeState !== lastEyeStateRef.current) {
      const stateDuration = currentTime - eyeStateChangeTimeRef.current;
      
      // 느린 깜빡임 감지 (눈이 오래 감겨있었던 경우)
      if (lastEyeStateRef.current === 'closed' && stateDuration > SLOW_BLINK_DURATION) {
        slowBlinkCountRef.current += 1;
        console.log("😴 느린 깜빡임 감지:", { duration: stateDuration, count: slowBlinkCountRef.current });
      }
      
      lastEyeStateRef.current = currentEyeState;
      eyeStateChangeTimeRef.current = currentTime;
      
      // 눈이 다시 뜨면 지속시간 리셋
      if (currentEyeState === 'open') {
        eyeClosedDurationRef.current = 0;
      }
    }
    
    // 2. 지속적인 눈 감음 추적
    if (currentEyeState === 'closed') {
      eyeClosedDurationRef.current = currentTime - eyeStateChangeTimeRef.current;
    }
    
    // 3. 머리 떨어짐 감지
    const headPitchChange = headPose.pitch - lastHeadPitchRef.current;
    if (headPitchChange > 5 && headPose.pitch > HEAD_DROP_THRESHOLD) {
      headDropCountRef.current += 1;
      console.log("📉 머리 떨어짐 감지:", { 
        pitchChange: headPitchChange.toFixed(1), 
        currentPitch: headPose.pitch.toFixed(1),
        count: headDropCountRef.current 
      });
    }
    lastHeadPitchRef.current = headPose.pitch;
    
    // 4. 입 벌림 (하품) 감지
    const isYawning = mar > 0.6; // 하품 임계값
    
    // 5. 종합적인 졸음 판정
    let drowsinessScore = 0;
    
    // 지속적으로 눈 감음 (가장 강력한 지표)
    if (eyeClosedDurationRef.current > SUSTAINED_CLOSED_THRESHOLD) {
      drowsinessScore += 40;
      console.log("💤 지속적 눈 감음:", { duration: eyeClosedDurationRef.current });
    }
    
    // 느린 깜빡임 패턴 (최근 20초간 3회 이상)
    if (slowBlinkCountRef.current >= 3) {
      drowsinessScore += 25;
      console.log("🐌 느린 깜빡임 패턴:", { count: slowBlinkCountRef.current });
    }
    
    // 머리 떨어짐 (최근 30초간 2회 이상)
    if (headDropCountRef.current >= 2) {
      drowsinessScore += 20;
      console.log("📉 반복적 머리 떨어짐:", { count: headDropCountRef.current });
    }
    
    // 낮은 깜빡임 빈도 (졸릴 때 깜빡임이 줄어듦)
    if (blinkRate < 8) {
      drowsinessScore += 15;
      // console.log("👁️ 낮은 깜빡임 빈도:", { rate: blinkRate });
    }
    
    // 하품
    if (isYawning) {
      drowsinessScore += 10;
      console.log("🥱 하품 감지:", { mar: mar.toFixed(3) });
    }
    
    // 20초마다 카운터 리셋 (슬라이딩 윈도우)
    if (currentTime % 20000 < 150) { // 감지 주기가 150ms이므로
      slowBlinkCountRef.current = Math.max(0, slowBlinkCountRef.current - 1);
      headDropCountRef.current = Math.max(0, headDropCountRef.current - 1);
    }
    
    const isDrowsy = drowsinessScore >= 30; // 30점 이상이면 졸음
    
    if (isDrowsy) {
      console.log("😴 고급 졸음 감지!", {
        score: drowsinessScore,
        factors: {
          sustainedClosed: eyeClosedDurationRef.current > SUSTAINED_CLOSED_THRESHOLD,
          slowBlinks: slowBlinkCountRef.current >= 3,
          headDrops: headDropCountRef.current >= 2,
          lowBlinkRate: blinkRate < 8,
          yawning: isYawning
        }
      });
    }
    
    return isDrowsy;
  }, []);

  // 깜빡임 감지 함수
  const detectBlink = useCallback((ear: number): number => {
    const currentTime = Date.now();
    const BLINK_THRESHOLD = 0.22; // 임계값을 약간 낮춰서 더 정확한 감지
    const MIN_BLINK_DURATION = 80;  // 최소 지속시간을 약간 줄임
    const MAX_BLINK_DURATION = 600; // 최대 지속시간을 약간 늘림
    
    // 눈이 감긴 상태 감지
    if (ear < BLINK_THRESHOLD && !isEyeClosedRef.current) {
      console.log("👁️ 눈 감김 감지:", { ear: ear.toFixed(3), time: currentTime });
      isEyeClosedRef.current = true;
      lastBlinkTimeRef.current = currentTime;
      setIsEyeClosed(true);
      setLastBlinkTime(currentTime);
    }
    // 눈이 다시 뜬 상태 감지 (깜빡임 완료)
    else if (ear >= BLINK_THRESHOLD && isEyeClosedRef.current) {
      const blinkDuration = currentTime - lastBlinkTimeRef.current;
      console.log("👁️ 눈 뜸 감지:", { 
        ear: ear.toFixed(3), 
        duration: blinkDuration,
        isValid: blinkDuration >= MIN_BLINK_DURATION && blinkDuration <= MAX_BLINK_DURATION
      });
      
      // 유효한 깜빡임인지 확인
      if (blinkDuration >= MIN_BLINK_DURATION && blinkDuration <= MAX_BLINK_DURATION) {
        console.log("✅ 유효한 깜빡임 감지됨!", { duration: blinkDuration });
        const newTimestamps = [...blinkTimestampsRef.current, currentTime];
        const filtered = newTimestamps.filter(timestamp => currentTime - timestamp <= 10000); // 10초로 변경
        blinkTimestampsRef.current = filtered;
        setBlinkTimestamps(filtered);
      }
      
      isEyeClosedRef.current = false;
      setIsEyeClosed(false);
    }
    
    // 현재 10초간 깜빡임 횟수 계산 후 분당 환산
    const MEASUREMENT_WINDOW = 10000; // 10초
    const recentBlinks = blinkTimestampsRef.current.filter(timestamp => currentTime - timestamp <= MEASUREMENT_WINDOW);
    
    // 10초간 깜빡임을 분당 깜빡임으로 환산 (10초 * 6 = 1분)
    const blinksPer10Seconds = recentBlinks.length;
    const blinksPerMinute = Math.round(blinksPer10Seconds * 6);
    
    return blinksPerMinute;
  }, []);

  // Human 라이브러리 초기화
  useEffect(() => {
    const initializeHuman = async () => {
      try {
        console.log("🧠 Human 라이브러리 초기화 시작...");
        const human = new H.Human(humanConfig);
        humanRef.current = human;
        
        await human.load();
        console.log("🎯 Human 모델 로딩 완료!");
        
        await human.warmup();
        console.log("🚀 Human 라이브러리 준비 완료!");
        
        setIsModelLoaded(true);
      } catch (error) {
        console.error("❌ Human 라이브러리 초기화 실패:", error);
        setModelLoadingError("AI 모델을 로드하지 못했습니다.");
        toast.error("AI 모델 로딩에 실패했습니다.");
      }
    };

    initializeHuman();

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 카메라 준비 상태 체크
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updateCanvasGeometry = () => {
      console.log("🎨 캔버스 지오메트리 업데이트:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        clientWidth: video.clientWidth,
        clientHeight: video.clientHeight,
        readyState: video.readyState
      });

      if (!video.videoWidth || !video.videoHeight || video.clientWidth === 0 || video.clientHeight === 0) {
        setIsCameraReady(false);
        return;
      }

      const devicePixelRatio = window.devicePixelRatio || 1;
      const videoClientWidth = video.clientWidth;
      const videoClientHeight = video.clientHeight;
      
      canvas.style.width = `${videoClientWidth}px`;
      canvas.style.height = `${videoClientHeight}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';

      canvas.width = Math.round(videoClientWidth * devicePixelRatio);
      canvas.height = Math.round(videoClientHeight * devicePixelRatio);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      }
      
      console.log("✅ 카메라 준비 완료");
      setIsCameraReady(true);
    };

    const observer = new ResizeObserver(updateCanvasGeometry);
    observer.observe(video);
    video.addEventListener('loadedmetadata', updateCanvasGeometry);
    video.addEventListener('play', updateCanvasGeometry);
    video.addEventListener('resize', updateCanvasGeometry);
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
  }, [videoRef, canvasRef]);

  const memoizedStopDetection = useCallback(() => {
    console.log("🛑 얼굴 인식 중지");
    setIsDetecting(false);
    isDetectingRef.current = false;
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const canvas = canvasRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    lastDetectionsRef.current = null;
    frameCountRef.current = 0;
    setConsecutiveDrowsyFrames(0);
    setEarHistory([]);
    setAttentionHistory([]);
    setBlinkTimestamps([]);
    setIsEyeClosed(false);
    setLastBlinkTime(0);
    
    // ref 초기화 추가
    blinkTimestampsRef.current = [];
    isEyeClosedRef.current = false;
    lastBlinkTimeRef.current = 0;
    consecutiveDrowsyFramesRef.current = 0;
    earHistoryRef.current = [];
    attentionHistoryRef.current = [];
    gazeHistoryRef.current = [];
    stableFrameCountRef.current = 0;
    
    // 고급 졸음 감지 상태 초기화
    eyeClosedDurationRef.current = 0;
    slowBlinkCountRef.current = 0;
    lastEyeStateRef.current = 'open';
    eyeStateChangeTimeRef.current = Date.now();
    headDropCountRef.current = 0;
    lastHeadPitchRef.current = 0;
  }, [canvasRef]);

  const drawDetections = useCallback((
    canvas: HTMLCanvasElement,
    result: H.Result | null
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !result) return;

    const video = videoRef.current;
    if (!video) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const cssDrawingWidth = video.clientWidth;
    const cssDrawingHeight = video.clientHeight;

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
 
    // 캔버스를 실제 크기로 확대 (scale() 사용)
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // 캔버스 클리어
    ctx.clearRect(0, 0, cssDrawingWidth, cssDrawingHeight);

    if (result.face && result.face.length > 0) {
      // Face ID 스타일 커스텀 그리기
      result.face.forEach((face) => {
        if (face.box && face.box.length >= 4) {
          // Human 라이브러리의 box 형식: [x, y, width, height]
          const [boxX, boxY, boxWidth, boxHeight] = face.box;
          
          // 비디오 크기에 맞게 스케일 조정
          const video = videoRef.current;
          if (video && video.videoWidth && video.videoHeight) {
            const scaleX = cssDrawingWidth / video.videoWidth;
            const scaleY = cssDrawingHeight / video.videoHeight;
            
            const x = boxX * scaleX;
            const y = boxY * scaleY;
            const width = boxWidth * scaleX;
            const height = boxHeight * scaleY;
            
            // Face ID 스타일 코너 그리기
            ctx.save();
            const cornerLineLength = 30;
            const cornerRadius = 8;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 4 / devicePixelRatio;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            const rectX = x; 
            const rectY = y; 
            const rectWidth = width; 
            const rectHeight = height;
            
            const cornersForRect = [
              { x: rectX, y: rectY, type: 'topLeft' }, 
              { x: rectX + rectWidth, y: rectY, type: 'topRight' },
              { x: rectX, y: rectY + rectHeight, type: 'bottomLeft' }, 
              { x: rectX + rectWidth, y: rectY + rectHeight, type: 'bottomRight' }
            ];
            
            cornersForRect.forEach(corner => {
              ctx.beginPath();
              if (corner.type === 'topLeft') { 
                ctx.moveTo(corner.x + cornerLineLength, corner.y); 
                ctx.lineTo(corner.x + cornerRadius, corner.y); 
                ctx.quadraticCurveTo(corner.x, corner.y, corner.x, corner.y + cornerRadius); 
                ctx.lineTo(corner.x, corner.y + cornerLineLength); 
              }
              else if (corner.type === 'topRight') { 
                ctx.moveTo(corner.x - cornerLineLength, corner.y); 
                ctx.lineTo(corner.x - cornerRadius, corner.y); 
                ctx.quadraticCurveTo(corner.x, corner.y, corner.x, corner.y + cornerRadius); 
                ctx.lineTo(corner.x, corner.y + cornerLineLength); 
              }
              else if (corner.type === 'bottomLeft') { 
                ctx.moveTo(corner.x, corner.y - cornerLineLength); 
                ctx.lineTo(corner.x, corner.y - cornerRadius); 
                ctx.quadraticCurveTo(corner.x, corner.y, corner.x + cornerRadius, corner.y); 
                ctx.lineTo(corner.x + cornerLineLength, corner.y); 
              }
              else { 
                ctx.moveTo(corner.x, corner.y - cornerLineLength); 
                ctx.lineTo(corner.x, corner.y - cornerRadius); 
                ctx.quadraticCurveTo(corner.x, corner.y, corner.x - cornerRadius, corner.y); 
                ctx.lineTo(corner.x - cornerLineLength, corner.y); 
              }
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      });

      // 추가로 얼굴 랜드마크 그리기 (Human 라이브러리 사용)
      if (humanRef.current && showPreview) {
        // 얼굴 메시 포인트들을 가볍게 그리기
        result.face.forEach((face) => {
          if (face.mesh && face.mesh.length > 0) {
            const video = videoRef.current;
            if (video && video.videoWidth && video.videoHeight) {
              const scaleX = cssDrawingWidth / video.videoWidth;
              const scaleY = cssDrawingHeight / video.videoHeight;
              
              ctx.save();
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              face.mesh.forEach((point, index) => {
                // 주요 포인트들만 그리기 (눈, 코, 입 등)
                if (index % 8 === 0) { // 8개 중 1개만 그리기
                  const x = point[0] * scaleX;
                  const y = point[1] * scaleY;
                  ctx.beginPath();
                  ctx.arc(x, y, 1 / devicePixelRatio, 0, 2 * Math.PI);
                  ctx.fill();
                }
              });
              ctx.restore();
            }
          }
        });
      }
    } else {
      // 얼굴이 감지되지 않을 때 가이드 표시
      const time = Date.now() / 1000;
      const pulseIntensity = 0.5 + 0.3 * Math.sin(time * 2);
      const guideWidth = Math.min(cssDrawingWidth * 0.6, 250);
      const guideHeight = guideWidth * 1.2;
      const guideX = (cssDrawingWidth - guideWidth) / 2;
      const guideY = (cssDrawingHeight - guideHeight) / 2;

      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.6})`;
      ctx.lineWidth = 2 / devicePixelRatio;
      ctx.setLineDash([10 / devicePixelRatio, 5 / devicePixelRatio]);
      ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
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
    }
  }, [videoRef]);

  const startDetection = useCallback(() => {
    console.log("🚀 Human 기반 얼굴 감지 시작");

    if (!isModelLoaded || !humanRef.current) {
      console.log("❌ Human 라이브러리가 준비되지 않음");
      toast.error("AI 모델 로딩 필요");
      return;
    }

    if (isDetectingRef.current) {
      console.log("⚠️ 이미 감지 실행 중");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.log("❌ 비디오 또는 캔버스 요소가 없음");
      return;
    }

    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      console.log("⏳ 비디오 준비 대기 중...");
      setTimeout(() => startDetection(), 500);
      return;
    }

    console.log("✅ 모든 조건 충족, Human 기반 감지 시작");

    setIsDetecting(true);
    isDetectingRef.current = true;
    setLastDetectionTime(Date.now());
    frameCountRef.current = 0;

    // 그리기 루프
    let lastAnimateTime = 0;
    const animate = (currentTime: number) => {
      if (!isDetectingRef.current) return;
      animationFrameRef.current = requestAnimationFrame(animate);
      if (currentTime - lastAnimateTime < 16) return; // 약 60fps
      lastAnimateTime = currentTime;
      if (canvasRef.current && showPreview) {
        drawDetections(canvasRef.current, lastDetectionsRef.current);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    // 감지 루프
    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (video && isDetectingRef.current && video.readyState >= video.HAVE_ENOUGH_DATA && humanRef.current) {
        frameCountRef.current++;
        try {
          const result = await humanRef.current.detect(video);
          lastDetectionsRef.current = result;

          if (result.face && result.face.length > 0) {
            setLastDetectionTime(Date.now());
            const face = result.face[0];
            
            // 초기 프레임 안정화
            stableFrameCountRef.current++;
            const isStableFrame = stableFrameCountRef.current >= STABLE_FRAME_THRESHOLD;

            // 눈과 입 랜드마크에서 EAR, MAR 계산
            let ear = 0.3;
            let mar = 0.0;

            if (face.mesh && face.mesh.length >= 468) {
              // 눈 랜드마크 추출 (Human의 face mesh 사용)
              // MediaPipe Face Mesh 인덱스에 맞는 정확한 눈 랜드마크
              const leftEyePoints = [
                face.mesh[33],   // 왼쪽 눈 외측
                face.mesh[160],  // 왼쪽 눈 위쪽
                face.mesh[158],  // 왼쪽 눈 위쪽
                face.mesh[133],  // 왼쪽 눈 내측
                face.mesh[153],  // 왼쪽 눈 아래쪽
                face.mesh[144],  // 왼쪽 눈 아래쪽
              ];
              const rightEyePoints = [
                face.mesh[362],  // 오른쪽 눈 외측
                face.mesh[385],  // 오른쪽 눈 위쪽
                face.mesh[387],  // 오른쪽 눈 위쪽
                face.mesh[263],  // 오른쪽 눈 내측
                face.mesh[373],  // 오른쪽 눈 아래쪽
                face.mesh[380],  // 오른쪽 눈 아래쪽
              ];

              const leftEAR = computeEAR(leftEyePoints);
              const rightEAR = computeEAR(rightEyePoints);
              ear = (leftEAR + rightEAR) / 2;

              // 입 랜드마크 추출 (정확한 입 영역 포인트)
              const mouthPoints = [
                face.mesh[61],   // 왼쪽 입꼬리
                face.mesh[84],   // 위쪽 입술 중앙 왼쪽
                face.mesh[17],   // 위쪽 입술 중앙
                face.mesh[314],  // 위쪽 입술 중앙 오른쪽
                face.mesh[291],  // 오른쪽 입꼬리
                face.mesh[375],  // 아래쪽 입술 중앙 오른쪽
                face.mesh[321],  // 아래쪽 입술 중앙
                face.mesh[308],  // 아래쪽 입술 중앙 왼쪽
              ];
              mar = computeMAR(mouthPoints);
            }

            const headPose = estimateHeadPose(face);
            const gaze = estimateGazeDirection(face);
            const emotion = face.emotion && face.emotion.length > 0 ? face.emotion[0].emotion : 'neutral';

            // 깜빡임 카운트 (안정화 기간에는 정상 범위로 설정)
            const rawBlinkRate = detectBlink(ear);
            const blinkRate = isStableFrame ? rawBlinkRate : Math.max(18, rawBlinkRate); // 안정화 전에는 최소 18회/분으로 설정 (정상 범위)

            // 하품 감지
            const isYawning = mar > 0.6; // 하품 임계값
            
            // 고급 졸음 감지 (안정화된 프레임에서만 정확한 판정)
            const isDrowsy = isStableFrame ? detectAdvancedDrowsiness(ear, mar, headPose, blinkRate) : false;

            // ref를 사용하여 성능 개선
            if (isDrowsy) {
              consecutiveDrowsyFramesRef.current += 1;
              setConsecutiveDrowsyFrames(consecutiveDrowsyFramesRef.current);
            } else {
              consecutiveDrowsyFramesRef.current = 0;
              setConsecutiveDrowsyFrames(0);
            }

            // EAR 히스토리 업데이트
            const newEarHistory = [...earHistoryRef.current, ear].slice(-30);
            earHistoryRef.current = newEarHistory;
            setEarHistory(newEarHistory);

            // 시선 안정성 계산
            const gazeStability = calculateGazeStability(gaze);
            
            // 주의집중도 계산 (안정화 기간에는 보정된 값 사용)
            const attentionScore = isStableFrame 
              ? calculateAttentionScore(ear, mar, headPose, gaze, blinkRate, gazeStability)
              : Math.max(70, calculateAttentionScore(ear, mar, headPose, gaze, blinkRate, gazeStability)); // 안정화 전에는 최소 70점
            const fatigueLevel = isStableFrame 
              ? assessFatigueLevel(attentionScore, ear, consecutiveDrowsyFramesRef.current)
              : 'low'; // 초기 프레임에서는 항상 낮은 피로도로 설정
            
            // 주의집중도 히스토리 업데이트
            const newAttentionHistory = [...attentionHistoryRef.current, attentionScore].slice(-60);
            attentionHistoryRef.current = newAttentionHistory;
            setAttentionHistory(newAttentionHistory);

            // 결과 로깅 (프레임 5개마다)
            if (frameCountRef.current % 5 === 0) {
              console.log("📊 얼굴 분석 결과:", {
                frameCount: stableFrameCountRef.current,
                isStable: isStableFrame,
                ear: ear.toFixed(3),
                mar: mar.toFixed(3),
                blinkRate: isStableFrame ? `${blinkRate}회/분 (10초 측정)` : `${blinkRate}회/분 (보정: 원래 ${rawBlinkRate})`,
                attentionScore: attentionScore.toFixed(1),
                gazeDirection: gaze,
                headPose: {
                  yaw: headPose.yaw.toFixed(1),
                  pitch: headPose.pitch.toFixed(1),
                  roll: headPose.roll.toFixed(1)
                },
                emotion,
                isDrowsy,
                fatigueLevel,
                confidence: Math.round((face.boxScore || 0.5) * 100)
              });
            }

            const analysisResult = {
              isDrowsy,
              isAttentive: attentionScore > 70,
              emotion,
              ear,
              mar,
              isYawning,
              gazeDirection: gaze,
              headPose,
              blinkRate,
              attentionScore,
              fatigueLevel,
              confidence: Math.round((face.boxScore || 0.5) * 100)
            };

            // 안정화된 경우에만 결과 전달
            if (isStableFrame) {
              // console.log("🔄 onFaceDetected 호출 중... (안정화 완료)", analysisResult);
              onFaceDetected(analysisResult);
            } else {
              console.log("⏳ 안정화 중... 분석 결과 대기", {
                frameCount: stableFrameCountRef.current,
                threshold: STABLE_FRAME_THRESHOLD,
                remaining: STABLE_FRAME_THRESHOLD - stableFrameCountRef.current
              });
            }
          } else {
            lastDetectionsRef.current = null;
            // 얼굴 감지 실패 시 더 빠른 반응을 위해 시간 단축
            const timeSinceLastDetection = Date.now() - lastDetectionTime;
            if (timeSinceLastDetection > 800) {
              console.log(`👤 얼굴 미감지 ${timeSinceLastDetection}ms 경과 - onFaceNotDetected 호출`);
              onFaceNotDetected();
              // 얼굴이 감지되면 setLastDetectionTime이 업데이트됨
            }
          }
        } catch (err) {
          console.error("Human 얼굴 분석 오류:", err);
        }
      }
    }, 100); // 감지 주기를 150ms에서 100ms로 단축하여 더 빠른 반응
  }, [
    isModelLoaded, 
    showPreview, 
    onFaceDetected, 
    onFaceNotDetected, 
    drawDetections, 
    detectBlink,
    calculateGazeStability,
    detectAdvancedDrowsiness
  ]);

  return {
    isModelLoaded,
    isDetecting,
    isCameraReady,
    startDetection,
    stopDetection: memoizedStopDetection,
    modelLoadingError,
    isStable: stableFrameCountRef.current >= STABLE_FRAME_THRESHOLD
  };
};

