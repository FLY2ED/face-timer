import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserStatusProvider } from "@/contexts/UserStatusContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraPermissionProvider } from "@/contexts/CameraPermissionContext";
import Index from "./pages/Index";
import TodoPage from "./pages/TodoPage";
import GroupPage from "./pages/GroupPage";
import NotFound from "./pages/NotFound";
import PricingPage from "./pages/PricingPage";
import RankingPage from "./pages/RankingPage";
import StatisticsPage from "./pages/StatisticsPage";
import SettingsPage from "./pages/SettingsPage";
// import AuthPage from "./pages/AuthPage"; // AuthPage 임포트 주석 처리

const queryClient = new QueryClient();

// RequireAuth 컴포넌트 전체 삭제
// const RequireAuth = ({ children }: { children: React.ReactNode }) => {
//   const { isAuthenticated } = useAuth(); // useAuth 사용 삭제
  
//   if (!isAuthenticated) {
//     return <Navigate to="/" replace />;
//   }
  
//   return <>{children}</>;
// };

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        {/* <AuthProvider> AuthProvider 제거 */}
          <UserStatusProvider>
            <CameraPermissionProvider>
              <SidebarProvider>
                <Toaster />
                <Sonner 
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: 'rgba(39, 39, 42, 0.9)',
                      color: '#fff',
                      border: '1px solid rgba(63, 63, 70, 0.3)',
                      backdropFilter: 'blur(8px)',
                    },
                    className: 'backdrop-blur-sm',
                  }}
                />
                <Routes>
                  {/* <Route path="/auth" element={<AuthPage />} /> AuthPage 라우트 주석 처리 */}
                  <Route path="/" element={<Index />} />
                  <Route path="/todo" element={
                    // <RequireAuth> // RequireAuth 제거
                      <TodoPage />
                    // </RequireAuth>
                  } />
                  <Route path="/group/:groupId" element={
                    // <RequireAuth> // RequireAuth 제거
                      <GroupPage />
                    // </RequireAuth>
                  } />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/ranking" element={
                    // <RequireAuth> // RequireAuth 제거
                      <RankingPage />
                    // </RequireAuth>
                  } />
                  <Route path="/statistics" element={
                    // <RequireAuth> // RequireAuth 제거
                      <StatisticsPage />
                    // </RequireAuth>
                  } />
                  <Route path="/settings" element={
                    // <RequireAuth> // RequireAuth 제거
                      <SettingsPage />
                    // </RequireAuth>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SidebarProvider>
            </CameraPermissionProvider>
          </UserStatusProvider>
        {/* </AuthProvider> AuthProvider 제거 */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
