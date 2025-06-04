import React, { useState } from 'react';
import { Camera, Monitor, Video, Smartphone, Webcam, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CameraDevice } from '@/hooks/useCameraPermission';
import { cn } from '@/lib/utils';

interface CameraSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  cameras: CameraDevice[];
  selectedCameraId: string | null;
  onSelectCamera: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

// 카메라 타입별 아이콘 매핑
const getCameraIcon = (label: string) => {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('webcam') || lowerLabel.includes('usb')) {
    return Webcam;
  } else if (lowerLabel.includes('built-in') || lowerLabel.includes('integrated') || lowerLabel.includes('front')) {
    return Monitor;
  } else if (lowerLabel.includes('phone') || lowerLabel.includes('mobile')) {
    return Smartphone;
  } else {
    return Video;
  }
};

export const CameraSelectionDialog: React.FC<CameraSelectionDialogProps> = ({
  open,
  onClose,
  cameras,
  selectedCameraId,
  onSelectCamera,
  isLoading = false
}) => {
  const [localSelectedId, setLocalSelectedId] = useState(selectedCameraId);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleCameraSelect = async (deviceId: string) => {
    if (deviceId === selectedCameraId) {
      onClose();
      return;
    }

    setSwitching(deviceId);
    try {
      const result = await onSelectCamera(deviceId);
      if (result.success) {
        setLocalSelectedId(deviceId);
        setTimeout(onClose, 500); // 성공 표시 후 닫기
      }
    } finally {
      setSwitching(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">
                카메라 선택
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                사용할 카메라를 선택해주세요
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          {cameras.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-400">사용 가능한 카메라가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cameras.map((camera, index) => {
                const Icon = getCameraIcon(camera.label);
                const isSelected = camera.deviceId === selectedCameraId;
                const isSwitching = switching === camera.deviceId;
                
                return (
                  <button
                    key={camera.deviceId}
                    onClick={() => handleCameraSelect(camera.deviceId)}
                    disabled={isLoading || isSwitching}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-all duration-200 text-left",
                      "hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                      isSelected 
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-200" 
                        : "bg-zinc-800/30 border-zinc-700 text-zinc-300",
                      (isLoading || isSwitching) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? "bg-blue-500/30" : "bg-zinc-700/50"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isSelected ? "text-blue-300" : "text-zinc-400"
                        )} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={cn(
                            "font-medium",
                            isSelected ? "text-blue-200" : "text-white"
                          )}>
                            {camera.label || `카메라 ${index + 1}`}
                          </h3>
                          
                          {isSelected && (
                            <div className="flex items-center gap-1 text-blue-400">
                              <Check className="w-4 h-4" />
                              <span className="text-xs">선택됨</span>
                            </div>
                          )}
                          
                          {isSwitching && (
                            <div className="flex items-center gap-2 text-blue-400">
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">전환 중...</span>
                            </div>
                          )}
                        </div>
                        
                        <p className={cn(
                          "text-xs mt-1",
                          isSelected ? "text-blue-300/80" : "text-zinc-500"
                        )}>
                          ID: {camera.deviceId.substr(0, 20)}...
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 