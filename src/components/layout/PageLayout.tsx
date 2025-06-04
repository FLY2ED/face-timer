
import React from "react";
import { Sidebar } from "./Sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="bg-zinc-900 min-h-screen font-[Pretendard] w-full">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-y-auto h-screen">
          {children}
        </div>
      </div>
    </div>
  );
};
