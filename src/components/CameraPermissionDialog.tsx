import React from 'react';
import { Camera, Shield, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CameraPermissionDialogProps {
  open: boolean;
  onRequestPermission: () => void;
  onClose: () => void;
  isLoading: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'loading' | 'unknown';
}

// Secure Context 확인 함수
const isSecureContext = (): boolean => {
  return window.isSecureContext || 
         location.protocol === 'https:' || 
         location.hostname === 'localhost' || 
         location.hostname === '127.0.0.1';
};

export const CameraPermissionDialog: React.FC<CameraPermissionDialogProps> = ({
  open,
  onRequestPermission,
  onClose,
  isLoading,
  permission
}) => {
  const isHttps = isSecureContext();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-base">
                카메라 권한 필요
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                AI 시간측정을 위해 카메라 접근 권한이 필요합니다
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="">
          <div className="space-y-4">
            {!isHttps && (
              <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <Globe className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-orange-400 text-sm font-bold">HTTP 환경 감지</h4>
                  <p className="text-orange-300/80 text-xs mt-1">
                    보안상의 이유로 HTTP 환경에서는 카메라에 접근할 수 없습니다. HTTPS 사이트에서 이용해주세요.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <Shield className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white/80 text-sm font-bold">개인정보 보호</h4>
                <p className="text-zinc-400/80 text-xs mt-1">
                  카메라 영상은 오직 집중도 분석에만 사용되며,<br/> 서버에 전송되거나 저장되지 않습니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl">
              <Camera className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white/80 text-sm font-bold">실시간 모니터링</h4>
                <p className="text-zinc-400/80 text-xs mt-1">
                  AI가 실시간으로 집중도와 졸음을 분석하여<br/> 생산성 향상을 도와드립니다.
                </p>
              </div>
            </div>
            
            {permission === 'denied' && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-400 text-sm font-medium">권한이 거부됨</h4>
                  <p className="text-red-300/80 text-xs mt-1">
                    브라우저 설정에서 카메라 권한을 허용하거나 페이지를 새로고침해 주세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="default"
            onClick={onClose}
            className="bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/30 rounded-xl"
          >
            나중에
          </Button>
          <Button
            onClick={onRequestPermission}
            disabled={!isHttps || isLoading || permission === 'loading'}
            className="bg-orange-700/50 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
          >
            {!isHttps ? (
              <>
                <Globe className="w-4 h-4 mr-2" />
                HTTPS 필요
              </>
            ) : isLoading || permission === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                권한 요청 중...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                카메라 권한 허용
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 