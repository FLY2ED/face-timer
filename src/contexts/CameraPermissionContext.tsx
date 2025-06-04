import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCameraPermission, CameraDevice } from '@/hooks/useCameraPermission';
import { CameraPermissionDialog } from '@/components/CameraPermissionDialog';
import { CameraSelectionDialog } from '@/components/CameraSelectionDialog';
import { useLocation } from 'react-router-dom';

interface CameraPermissionContextType {
  permission: 'granted' | 'denied' | 'prompt' | 'loading' | 'unknown';
  stream: MediaStream | null;
  error: string | null;
  availableCameras: CameraDevice[];
  selectedCameraId: string | null;
  requestPermission: () => Promise<{ success: boolean; stream?: MediaStream; error?: string }>;
  stopCamera: () => void;
  selectCamera: (deviceId: string) => Promise<{ success: boolean; error?: string }>;
  getAvailableCameras: () => Promise<CameraDevice[]>;
  isDialogOpen: boolean;
  closeDialog: () => void;
  isSelectionDialogOpen: boolean;
  openSelectionDialog: () => void;
  closeSelectionDialog: () => void;
}

const CameraPermissionContext = createContext<CameraPermissionContextType | undefined>(undefined);

export const useCameraPermissionContext = () => {
  const context = useContext(CameraPermissionContext);
  if (context === undefined) {
    throw new Error('useCameraPermissionContext must be used within a CameraPermissionProvider');
  }
  return context;
};

export const CameraPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const {
    permission,
    stream,
    error,
    availableCameras,
    selectedCameraId,
    requestPermission,
    stopCamera,
    selectCamera,
    getAvailableCameras,
  } = useCameraPermission();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasShownDialog, setHasShownDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);

  // 홈페이지에 처음 들어왔을 때만 다이얼로그 표시
  useEffect(() => {
    const isHomePage = location.pathname === '/';
    // 권한이 허용되지 않은 경우에만 다이얼로그 표시
    const shouldShowDialog = isHomePage && !hasShownDialog && permission !== 'granted';

    if (shouldShowDialog) {
      // 약간의 딜레이를 두어 페이지 로딩 후 표시
      const timer = setTimeout(() => {
        setIsDialogOpen(true);
        setHasShownDialog(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, permission, hasShownDialog]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await requestPermission();
      if (result.success) {
        setIsDialogOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setHasShownDialog(true);
  };

  const openSelectionDialog = () => {
    setIsSelectionDialogOpen(true);
  };

  const closeSelectionDialog = () => {
    setIsSelectionDialogOpen(false);
  };

  const handleSelectCamera = async (deviceId: string) => {
    return await selectCamera(deviceId);
  };

  const contextValue: CameraPermissionContextType = {
    permission,
    stream,
    error,
    availableCameras,
    selectedCameraId,
    requestPermission,
    stopCamera,
    selectCamera,
    getAvailableCameras,
    isDialogOpen,
    closeDialog,
    isSelectionDialogOpen,
    openSelectionDialog,
    closeSelectionDialog,
  };

  return (
    <CameraPermissionContext.Provider value={contextValue}>
      {children}
      
      <CameraPermissionDialog
        open={isDialogOpen}
        onRequestPermission={handleRequestPermission}
        onClose={closeDialog}
        isLoading={isLoading}
        permission={permission}
      />
      
      <CameraSelectionDialog
        open={isSelectionDialogOpen}
        onClose={closeSelectionDialog}
        cameras={availableCameras}
        selectedCameraId={selectedCameraId}
        onSelectCamera={handleSelectCamera}
      />
    </CameraPermissionContext.Provider>
  );
}; 