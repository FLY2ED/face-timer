import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
// import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';

interface GroupInfoFormProps {
  groupId: string;
  groupName: string;
  groupDescription: string;
  isCreator: boolean;
  onUpdate: (name: string, description: string) => void;
}

export const GroupInfoForm = ({ 
  groupId, 
  groupName: initialName,
  groupDescription: initialDescription,
  isCreator,
  onUpdate 
}: GroupInfoFormProps) => {
  const [currentName, setCurrentName] = useState(initialName);
  const [currentDescription, setCurrentDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentName(initialName);
  }, [initialName]);

  useEffect(() => {
    setCurrentDescription(initialDescription);
  }, [initialDescription]);

  const handleSaveGroup = async () => {
    if (!groupId || !isCreator) return;
    setLoading(true);
    
    try {
      // Supabase 호출 로직 삭제
      // const { error } = await supabase
      //   .from('groups')
      //   .update({ name: currentName, description: currentDescription })
      //   .eq('id', groupId);
        
      // if (error) throw error;

      onUpdate(currentName, currentDescription);
      
      toast({
        title: "저장 완료 (로컬)",
        description: "그룹 정보가 로컬에서 업데이트되었습니다.",
      });
    } catch (error) {
      console.error("Error updating group (local):", error);
      toast({
        title: "오류 (로컬)",
        description: "그룹 정보 업데이트 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="group-name">그룹명</Label>
        <Input
          id="group-name"
          value={currentName}
          onChange={(e) => setCurrentName(e.target.value)}
          disabled={!isCreator || loading}
          className="bg-zinc-700 border-zinc-600 text-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="group-description">그룹 설명</Label>
        <Input
          id="group-description"
          value={currentDescription}
          onChange={(e) => setCurrentDescription(e.target.value)}
          disabled={!isCreator || loading}
          className="bg-zinc-700 border-zinc-600 text-white"
        />
      </div>

      {isCreator && (
        <DialogFooter>
          <Button 
            onClick={handleSaveGroup}
            disabled={loading || (currentName === initialName && currentDescription === initialDescription)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      )}
    </div>
  );
};
