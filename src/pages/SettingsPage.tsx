import React, { useState } from "react";
import { Navigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext"; // useAuth 임포트 삭제
import { SettingsModal } from "@/components/settings/SettingsModal";
import { PageLayout } from "@/components/layout/PageLayout";

const SettingsPage: React.FC = () => {
  // const { user } = useAuth(); // user 객체 사용 삭제
  const [open, setOpen] = useState(true);

  // if (!user) { // 사용자 인증 확인 로직 삭제
  //   return <Navigate to="/auth" replace />;
  // }

  // If the user closes the modal, navigate back to the home page
  if (!open) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 text-white">
        <SettingsModal open={open} onOpenChange={setOpen} />
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
