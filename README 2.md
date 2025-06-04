# AI-Powered Focus Timer with Advanced Computer Vision

## 🧠 구현된 고급 AI/컴퓨터 비전 알고리즘

### 1. 기본 얼굴 감지 및 추적

#### **TinyFaceDetector 기반 얼굴 감지**
```typescript
// 실시간 얼굴 감지 (현재 구현됨)
const detections = await faceapi.detectAllFaces(
  video,
  new faceapi.TinyFaceDetectorOptions({ 
    inputSize: 416, 
    scoreThreshold: 0.3
  })
);
```
- **모델**: TinyFaceDetector (경량화된 실시간 감지)
- **검출율**: 초당 2회 (500ms 간격)
- **임계값**: 30% 신뢰도 이상

### 2. 동적 생체 신호 시뮬레이션

#### **EAR (Eye Aspect Ratio) 시뮬레이션**
```typescript
// 시간 기반 동적 EAR 값 생성
const time = Date.now() / 1000;
const randomFactor = Math.sin(time * 0.5) * 0.1 + Math.cos(time * 0.3) * 0.05;
const ear = Math.max(0.15, Math.min(0.35, baseEar + (Math.random() - 0.5) * 0.05));
```
- **범위**: 0.15 ~ 0.35 (현실적인 눈 감김 비율)
- **졸음 감지**: EAR < 0.18 시 졸음 상태
- **동적 변화**: 사인파 기반 자연스러운 변화

#### **MAR (Mouth Aspect Ratio) 시뮬레이션**
```typescript
// 하품 감지를 위한 동적 MAR 값
const baseMar = 0.3 + Math.sin(time * 0.8) * 0.1;
const mar = Math.max(0.2, Math.min(0.8, baseMar + (Math.random() - 0.5) * 0.1));
```
- **범위**: 0.2 ~ 0.8 (입 벌림 정도)
- **하품 감지**: MAR > 0.6 시 하품/피로 상태

### 3. 머리 자세 추정 (얼굴 위치 기반)

#### **얼굴 위치 기반 자세 계산**
```typescript
function estimateHeadPoseFromPosition(detection, videoSize) {
  const centerX = videoSize.width / 2;
  const centerY = videoSize.height / 2;
  const faceX = detection.box.x + detection.box.width / 2;
  const faceY = detection.box.y + detection.box.height / 2;
  
  const offsetX = (faceX - centerX) / centerX;
  const offsetY = (faceY - centerY) / centerY;
  
  return {
    yaw: offsetX * 45,    // 좌우 회전
    pitch: offsetY * 30,  // 상하 회전
    roll: (Math.random() - 0.5) * 15  // 기울기
  };
}
```

### 4. 시선 방향 추정

#### **머리 자세 기반 시선 추정**
```typescript
function estimateGazeDirection(headPose) {
  const adjustedYaw = headPose.yaw + timeBasedOffset;
  const adjustedPitch = headPose.pitch + Math.cos(time * 0.4) * 8;
  
  if (Math.abs(adjustedYaw) > 15) {
    return adjustedYaw > 0 ? 'right' : 'left';
  } else if (Math.abs(adjustedPitch) > 12) {
    return adjustedPitch > 0 ? 'down' : 'up';
  }
  return 'center';
}
```
- **임계값**: 수평 15도, 수직 12도
- **동적 변화**: 시간 기반 오프셋으로 자연스러운 변화

### 5. 집중도 점수 계산 알고리즘

#### **다중 지표 기반 어텐션 스코어**
```typescript
function calculateAttentionScore(ear, mar, headPose, gazeDirection, blinkRate) {
  let score = 100;
  
  // EAR 기반 감점 (눈 감김)
  if (ear < 0.15) score -= 40;      // 심각한 졸음
  else if (ear < 0.20) score -= 25; // 중간 졸음
  else if (ear < 0.25) score -= 10; // 가벼운 졸음
  
  // MAR 기반 감점 (하품)
  if (mar > 0.7) score -= 30;       // 하품
  else if (mar > 0.5) score -= 15;  // 입 벌림
  
  // 머리 자세 기반 감점
  const totalMovement = Math.abs(headPose.yaw) + Math.abs(headPose.pitch) + Math.abs(headPose.roll);
  if (totalMovement > 45) score -= 25;
  
  // 시선 방향 기반 감점
  if (gazeDirection !== 'center') score -= 20;
  
  // 깜빡임 빈도 기반 감점
  if (blinkRate > 25 || blinkRate < 5) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}
```

### 6. Face ID 스타일 시각화

#### **Apple 스타일 얼굴 인식 UI**
```typescript
function drawFaceIDStyle(canvas, detections) {
  // 전체 화면 어둡게 처리
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 얼굴 영역만 밝게 표시 (원형 마스크)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  
  // 맥박 효과가 있는 블루 링
  const pulseIntensity = 0.8 + 0.2 * Math.sin(time * 3);
  ctx.strokeStyle = `rgba(0, 122, 255, ${pulseIntensity})`;
  
  // 스캔 라인 효과
  const scanY = y + height * scanProgress;
  ctx.fillStyle = gradient; // 0 -> 0.8 -> 0 그라데이션
}
```

### 7. 자동 타이머 제어

#### **얼굴 감지 기반 자동 일시정지/재개**
```typescript
// 5초간 얼굴 미감지 시 자동 일시정지
if (timeSinceLastDetection > 5000) {
  onFaceNotDetected(); // 타이머 일시정지
}

// 높은 피로도 감지 시 자동 일시정지
if (result.fatigueLevel === 'high' || result.attentionScore < 40) {
  pauseTimer();
}

// 집중도 회복 시 자동 재개
if (result.attentionScore > 60 && isPaused) {
  resumeTimer();
}
```

## 🎯 기술적 특장점

### **실시간 성능 최적화**
- **프레임레이트**: 500ms 간격 (2 FPS) 고속 분석
- **고해상도**: Device Pixel Ratio 기반 캔버스 스케일링
- **메모리 최적화**: 30프레임 슬라이딩 윈도우 히스토리

### **사용자 친화적 UI**
- **직관적 표시**: 😊😐😴 이모지 기반 상태 표시
- **한국어 용어**: "눈뜸 %", "입벌림 %", "깜빡임 횟수/분"
- **동적 값**: 실시간으로 변화하는 생체 신호 시뮬레이션

### **안정성과 호환성**
- **Fail-safe 설계**: 모델 로딩 실패 시 Graceful Degradation
- **크로스 플랫폼**: WebRTC 기반 범용 호환성
- **프라이버시 보호**: 온디바이스 추론, 데이터 외부 전송 없음

## 📚 참고 기술

### **핵심 라이브러리**
- **face-api.js**: TinyFaceDetector 모델
- **WebRTC**: 실시간 카메라 스트림
- **Canvas API**: Face ID 스타일 시각화

### **향후 확장 계획 (현재 미구현)**
```typescript
// ⚠️ 주의: 아래 모델들은 현재 /public/models 폴더에 없어서 실행 불가능
// 향후 추가 예정인 고급 기능들:

await Promise.all([
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),     // 68점 랜드마크 감지
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),     // 실제 감정 인식  
  faceapi.nets.ageGenderNet.loadFromUri('/models'),          // 나이/성별 추정
]);

// 이 모델들이 추가되면 가능한 기능들:
// - 정확한 눈동자 중심점 추정
// - 실제 랜드마크 기반 EAR/MAR 계산  
// - 진짜 감정 상태 분석
// - 더 정밀한 머리 자세 추정
```

**현재 상태**: 기본 얼굴 감지만 가능 (TinyFaceDetector)  
**분석값들**: 시뮬레이션으로 생성된 동적 데이터

## 🛠️ 기술 스택

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: shadcn-ui, Tailwind CSS
- **Computer Vision**: @vladmandic/face-api
- **Animation**: Framer Motion
- **Database**: Supabase

## 🚀 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 📄 라이센스

이 프로젝트는 연구 및 교육 목적으로 개발되었습니다.
