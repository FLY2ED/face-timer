
import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GroupList as GroupResultsList } from "./GroupResultsList"; // Correct import for the GroupResultsList component
import { CategoryGrid } from "./CategoryGrid"; // Correct import for the CategoryGrid component

interface SearchGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinGroup: (groupId: string) => void;
}

const categories = [
  "수능", "자격증", "어학시험", "프로그래밍", "취업준비", "독서", "운동", "취미"
];

export const popularGroups = [
  { id: "g1", name: "정보처리기사 스터디", icon: "", category: "자격증", members: 248 },
  { id: "g2", name: "토익 900+ 목표방", icon: "", category: "어학시험", members: 156 },
  { id: "g3", name: "수능 국어 문법", icon: "", category: "수능", members: 325 },
  { id: "g4", name: "React 스터디", icon: "", category: "프로그래밍", members: 112 },
  { id: "g5", name: "취업 자소서 스터디", icon: "", category: "취업준비", members: 87 },
  { id: "g6", name: "매일 독서 인증방", icon: "", category: "독서", members: 59 },
  { id: "g7", name: "아침 6시 기상 챌린지", icon: "", category: "생활습관", members: 203 },
  { id: "g8", name: "알고리즘 문제풀이", icon: "", category: "프로그래밍", members: 74 },
];

export const SearchGroupDialog: React.FC<SearchGroupDialogProps> = ({ 
  open, 
  onOpenChange, 
  onJoinGroup 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = popularGroups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    group.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-800 text-white border-zinc-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl mb-4">그룹 탐색</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
          <Input
            placeholder="그룹명 또는 카테고리 검색..."
            className="pl-10 bg-zinc-700 border-zinc-600 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-700">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="category">카테고리</TabsTrigger>
            <TabsTrigger value="popular">인기</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <GroupResultsList groups={filteredGroups} onJoinGroup={onJoinGroup} />
          </TabsContent>
          <TabsContent value="category" className="mt-4">
            <CategoryGrid categories={categories} onSelectCategory={setSearchTerm} />
          </TabsContent>
          <TabsContent value="popular" className="mt-4">
            <GroupResultsList 
              groups={popularGroups.sort((a, b) => b.members - a.members).slice(0, 5)} 
              onJoinGroup={onJoinGroup} 
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
