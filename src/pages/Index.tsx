import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { TimerProvider } from "@/contexts/TimerContext";
const Index: React.FC = () => {
  return <div className="bg-zinc-900 min-h-screen font-[Pretendard] w-full">
      <TimerProvider>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-start justify-center pt-10 pb-20 overflow-y-auto">
            <MainContent />
          </div>
        </div>
      </TimerProvider>
    </div>;
};
export default Index;