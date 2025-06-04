import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionSettingsProps {
  onClose?: () => void;
}

const SubscriptionSettings: React.FC<SubscriptionSettingsProps> = ({ onClose }) => {
  const { toast } = useToast();
  
  // Mock subscription data - in a real app, this would come from your backend
  const mockSubscription = {
    status: "active",
    plan: "프리미엄",
    startDate: new Date(2025, 3, 1),
    nextBillingDate: new Date(2025, 4, 1),
    price: 9900,
  };
  
  // Simulate cancellation
  const handleCancelSubscription = () => {
    toast({
      title: "구독 취소 요청됨",
      description: "구독이 다음 결제일에 취소됩니다.",
      variant: "default",
    });
  };
  
  // Simulate opening portal
  const handleManagePayment = () => {
    toast({
      title: "결제 관리",
      description: "결제 관리 페이지로 이동합니다.",
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">구독 관리</h2>
        <p className="text-zinc-400">구독 상태 및 결제 정보를 관리할 수 있습니다.</p>
      </div>
      
      {mockSubscription ? (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {mockSubscription.plan} 구독 중
            </CardTitle>
            <CardDescription>
              다음 결제일: {mockSubscription.nextBillingDate.toLocaleDateString('ko-KR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">구독 시작일</span>
                <span>{mockSubscription.startDate.toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">월 요금</span>
                <span>
                  {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                    minimumFractionDigits: 0,
                  }).format(mockSubscription.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">결제 상태</span>
                <span className="text-green-500">정상</span>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                  onClick={handleManagePayment}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  결제 관리
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 bg-zinc-900 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={handleCancelSubscription}
                >
                  구독 취소
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              현재 활성화된 구독이 없습니다
            </CardTitle>
            <CardDescription>
              프리미엄 기능을 이용하려면 구독을 시작하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600 text-black"
              onClick={() => window.location.href = "/pricing"}
            >
              구독 시작하기
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle>구독 혜택</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>무제한 시간 측정 및 통계 데이터</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>모든 플랫폼 간 실시간 데이터 동기화</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>그룹 관리 및 고급 분석 기능</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>광고 없는 깔끔한 인터페이스</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSettings;
