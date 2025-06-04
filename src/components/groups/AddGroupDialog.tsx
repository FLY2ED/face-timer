import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Define categories for group creation
const categories = [
  "수능", "자격증", "어학시험", "프로그래밍", 
  "취업준비", "독서", "운동", "취미", "생활습관"
];

interface AddGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupAdded?: () => void;
}

export const AddGroupDialog: React.FC<AddGroupDialogProps> = ({ 
  open, 
  onOpenChange,
  onGroupAdded 
}) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [groupType, setGroupType] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Creating group (local):", { groupName, description, category, groupType });

      toast({
        title: "그룹 생성 완료 (로컬)",
        description: "새로운 그룹이 로컬에서 생성되었습니다 (실제 서버 저장 없음).",
      });

      onGroupAdded?.();
      onOpenChange(false);
      setGroupName("");
      setDescription("");
      setCategory("");
      setGroupType("public");
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "오류 발생",
        description: "그룹 생성 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-800 text-white border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">새 그룹 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right text-white">
                그룹명
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3 bg-zinc-700 border-zinc-600 text-white"
                placeholder="그룹 이름을 입력하세요"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-white">
                카테고리
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="col-span-3 bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-type" className="text-right text-white">
                공개 설정
              </Label>
              <Select value={groupType} onValueChange={setGroupType}>
                <SelectTrigger className="col-span-3 bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="공개 설정 선택" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  <SelectItem value="public">공개</SelectItem>
                  <SelectItem value="private">비공개</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-white">
                설명
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 bg-zinc-700 border-zinc-600 text-white h-20"
                placeholder="그룹에 대한 설명을 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={!groupName || loading}
              className="bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              {loading ? "생성 중..." : "그룹 생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
