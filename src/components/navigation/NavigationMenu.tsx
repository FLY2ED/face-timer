import React from "react";
import { Clock, ListTodo, Settings, CreditCard, TrendingUp, BarChart, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext"; // useAuth 임포트 삭제
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const NavigationMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  // const { isAuthenticated, signOut } = useAuth(); // isAuthenticated 및 signOut 사용 삭제

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // const handleSignOut = () => { // handleSignOut 함수 삭제 또는 주석 처리
  //   if (signOut) {
  //     signOut();
  //   }
  // };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 mt-3">
        {state === "expanded" && (
          <h2 className="text-zinc-400 text-xs font-medium tracking-[0.56px]">
            메뉴
          </h2>
        )}
      </div>
      <div className="w-full mt-2 space-y-0.5">
        <button 
          className={cn(
            "self-stretch w-full gap-2 p-2 rounded-md text-left flex items-center",
            "hover:bg-white/5 transition-colors",
            isActive("/") && "bg-white/10",
            state === "collapsed" && "justify-center"
          )}
          onClick={() => navigate("/")}
        >
          <Clock className="w-4 h-4 text-zinc-400" />
          {state === "expanded" && (
            <span className="text-sm text-zinc-300">시간 측정</span>
          )}
        </button>
        {/* <button 
          className={cn(
            "self-stretch w-full gap-2 p-2 rounded-md text-left flex items-center",
            "hover:bg-white/5 transition-colors",
            isActive("/todo") && "bg-white/10",
            state === "collapsed" && "justify-center"
          )}
          onClick={() => navigate("/todo")}
        >
          <ListTodo className="w-4 h-4 text-zinc-400" />
          {state === "expanded" && (
            <span className="text-sm text-zinc-300">할 일 관리</span>
          )}
        </button> */}
        <button 
          className={cn(
            "self-stretch w-full gap-2 p-2 rounded-md text-left flex items-center",
            "hover:bg-white/5 transition-colors",
            isActive("/ranking") && "bg-white/10",
            state === "collapsed" && "justify-center"
          )}
          onClick={() => navigate("/ranking")}
        >
          <TrendingUp className="w-4 h-4 text-zinc-400" />
          {state === "expanded" && (
            <span className="text-sm text-zinc-300">랭킹</span>
          )}
        </button>
        <button 
          className={cn(
            "self-stretch w-full gap-2 p-2 rounded-md text-left flex items-center",
            "hover:bg-white/5 transition-colors",
            isActive("/statistics") && "bg-white/10",
            state === "collapsed" && "justify-center"
          )}
          onClick={() => navigate("/statistics")}
        >
          <BarChart className="w-4 h-4 text-zinc-400" />
          {state === "expanded" && (
            <span className="text-sm text-zinc-300">통계</span>
          )}
        </button>
        <button 
          className={cn(
            "self-stretch w-full gap-2 p-2 rounded-md text-left flex items-center",
            "hover:bg-white/5 transition-colors",
            isActive("/pricing") && "bg-white/10",
            state === "collapsed" && "justify-center"
          )}
          onClick={() => navigate("/pricing")}
        >
          <CreditCard className="w-4 h-4 text-zinc-400" />
          {state === "expanded" && (
            <span className="text-sm text-zinc-300">요금제</span>
          )}
        </button>
        {/* <button 
          className={cn(
            "self-stretch w-full gap-2 p-2 rounded-md text-left flex items-center",
            "hover:bg-white/5 transition-colors",
            isActive("/settings") && "bg-white/10",
            state === "collapsed" && "justify-center"
          )}
          onClick={() => navigate("/settings")}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          {state === "expanded" && (
            <span className="text-sm text-zinc-300">설정</span>
          )}
        </button> */}
        {/* {isAuthenticated && ( // 로그아웃 버튼 관련 로직 주석 처리
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" />
            {state === "expanded" && <span className="ml-2 text-sm">로그아웃</span>}
          </Button>
        )} */}
      </div>
    </div>
  );
};
