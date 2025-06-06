import React, { useEffect, useState } from "react";
import { NavigationMenu } from "../navigation/NavigationMenu";
import { UserProfile } from "../user/UserProfile";
import { useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChevronsLeft, ChevronsRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupList } from "../groups/GroupList";

export const Sidebar: React.FC = () => {
  const { 
    state,
    isMobile, 
    openMobile,
    setOpenMobile,
    toggleSidebar
  } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
   
  const handleToggle = () => {
    setIsHovered(false);
    toggleSidebar();
  };

  const sidebarContent = (isMobileContext = false) => (
    <>
      <div className={cn(
        "flex items-center justify-between py-3 border-b border-zinc-700",
        (state === "expanded" || isMobileContext) ? "px-[15px]" : "px-[10px] justify-center"
      )}>
        {(state === "expanded" || isMobileContext) && (
          <h1 className="text-white text-base font-black tracking-[0.48px]">
            NALDA
          </h1>
        )}
        {!isMobileContext && ( 
          <button 
            onClick={handleToggle} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-700/50 p-1 rounded-md"
            aria-label="Toggle sidebar"
          >
            {state === "expanded" ? (
              <ChevronsLeft size={20} />
            ) : (
              isHovered ? <ChevronsRight size={20} /> : <Menu size={20} />
            )}
          </button>
        )}
      </div>
      
      <div className={cn(
        "flex flex-col items-stretch text-white font-medium overflow-y-auto flex-grow",
        (state === "collapsed" && !isMobileContext) ? "px-[8px]" : "px-[15px]" 
      )}>
        <NavigationMenu />
        <GroupList />
      </div>

      
      <UserProfile />
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent 
          side="left" 
          className="bg-zinc-800 w-[240px] p-0 border-r border-zinc-700 flex flex-col focus:outline-none"
          data-testid="mobile-sidebar-sheet"
        >
          {sidebarContent(true)} 
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className={cn(
      "bg-zinc-800 h-screen flex flex-col overflow-hidden transition-all duration-300 border-r border-zinc-700",
      state === "collapsed" ? "w-[60px]" : "w-[240px]"
    )}>
      {sidebarContent()}
    </nav>
  );
};
