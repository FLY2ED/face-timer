import React, { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Trophy, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/utils/timeUtils";
import { users } from "@/data/mockData";
import { RankingUser } from "@/types";

// Ranking categories
// const categories = ["전체", "대학생", "취업", "기타", "성인"];

const RankingPage: React.FC = () => {
  // const [selectedCategory, setSelectedCategory] = useState("전체");
  // const [timeFrame, setTimeFrame] = useState<"일간" | "주간" | "월간">("일간");
  
  // Convert mock users to ranking users with rank property
  // const rankingUsers: RankingUser[] = [...users]
  //   .sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0))
  //   .map((user, index) => ({
  //     ...user,
  //     rank: index + 1,
  //     totalTime: user.totalTime || 0,
  //   }));

  // Get rank icon for top 3
  // const getRankIcon = (rank: number) => { ... };

  // Get background color for top ranks
  // const getRowColor = (rank: number) => { ... };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 text-white relative">
        {/* 기존 랭킹 페이지 컨텐츠 (흐리게 처리될 부분) */}
        <div className="opacity-30 pointer-events-none">
          <h1 className="text-2xl font-bold mb-6">랭킹</h1>
          
          <div className="mb-6 flex flex-col gap-6">
            {/* Time frame selection */}
            <div className="bg-zinc-800 p-4 rounded-lg flex space-x-2">
              {["일간", "주간", "월간"].map((frame) => (
                <Button 
                  key={frame}
                  variant={"outline"}
                  className={
                    "bg-zinc-900 text-zinc-400 border-zinc-700"
                  }
                  disabled
                >
                  {frame}
                </Button>
              ))}
            </div>
            
            {/* Category selection */}
            <div className="bg-zinc-800 p-4 rounded-lg overflow-x-auto">
              <div className="flex space-x-2 min-w-max">
                {["전체", "대학생", "취업", "기타", "성인"].map((category) => (
                  <Button
                    key={category}
                    variant={"outline"}
                    className={
                       "bg-zinc-900 text-zinc-400 border-zinc-700"
                    }
                    disabled
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking table (내용은 비우거나 목업으로 대체) */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b border-zinc-700">
                  <TableHead className="text-zinc-400 w-16 text-center">순위</TableHead>
                  <TableHead className="text-zinc-400">사용자</TableHead>
                  <TableHead className="text-zinc-400 text-right">누적 시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-t border-zinc-700/50">
                  <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                    랭킹 정보가 없습니다.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 준비중 오버레이 */}
        <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
          <div className="text-center">
            <Construction className="h-16 w-16 text-blue-400 mb-6 inline-block" />
            <h2 className="text-3xl font-bold text-white mb-3">페이지 준비중</h2>
            <p className="text-zinc-300 text-center max-w-md">
              현재 랭킹 페이지는 개발 중입니다. 곧 멋진 모습으로 찾아뵙겠습니다!
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default RankingPage;
