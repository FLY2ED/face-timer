import React, { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, AlertCircle, CreditCard, Smartphone, Laptop, Monitor, Construction } from "lucide-react";
import { PricingPlan } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Pricing plans
const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "무료",
    price: 0,
    features: [
      "기본 시간 측정",
      "기본 할 일 관리",
      "기본 통계 (7일)",
      "1개의 그룹 참여",
      "데이터 광고 수집",
    ],
    color: "zinc",
  },
  {
    id: "premium",
    name: "프리미엄",
    price: 9900,
    features: [
      "무제한 시간 측정",
      "고급 할 일 관리",
      "상세 통계 (무제한)",
      "무제한 그룹 참여",
      "데이터 백업",
      "광고 없음",
      "모든 플랫폼 지원",
      "우선 고객 지원",
    ],
    recommended: true,
    color: "orange",
  },
  {
    id: "team",
    name: "팀",
    price: 49900,
    features: [
      "프리미엄 기능 포함",
      "최대 10명 사용자",
      "팀 대시보드",
      "그룹 관리 기능",
      "통합 통계",
      "그룹 랭킹",
      "관리자 기능",
      "전용 고객 지원",
    ],
    color: "blue",
  }
];

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const { toast } = useToast();

  // Get yearly discount price
  const getYearlyPrice = (price: number) => {
    return Math.floor(price * 10); // 2개월 할인
  };
  
  // Format price to Korean Won
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  // Handle subscription
  const handleSubscribe = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    toast({
      title: "구독이 시작되었습니다! (준비중)",
      description: `${plan.name} 요금제는 현재 준비중입니다.`, 
      variant: "default",
    });
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 text-white relative">
        {/* 기존 요금제 페이지 컨텐츠 (흐리게 처리될 부분) */}
        <div className="opacity-30 pointer-events-none">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">요금제</h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              다양한 요금제로 필요에 맞는 NALDA를 이용해보세요. 
              모든 구독은 언제든지 취소 가능하며, 14일 환불 정책을 제공합니다.
            </p>
          </div>
          
          {/* Billing cycle selection */}
          <div className="flex justify-center mb-8">
            <Tabs
              value={billingCycle}
              onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
              className="w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black" disabled>
                  월간 결제
                </TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black" disabled>
                  연간 결제 (17% 할인)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border ${
                  plan.recommended 
                    ? "border-orange-500 bg-zinc-800 shadow-lg shadow-orange-500/10" 
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="bg-orange-500 text-black text-xs px-3 py-1 rounded-full font-medium">
                      추천 요금제
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {plan.id === "free" ? "무료로 시작하세요" : "더 많은 기능을 이용해보세요"}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {formatPrice(billingCycle === "monthly" ? plan.price : getYearlyPrice(plan.price))}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-zinc-400 ml-1">
                        / {billingCycle === "monthly" ? "월" : "년"}
                      </span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={`w-full ${
                      plan.recommended
                        ? "bg-orange-500 hover:bg-orange-600 text-black"
                        : plan.id === "free" ? "bg-zinc-700" : ""
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled
                  >
                    {plan.id === "free" ? "현재 플랜" : "구독하기"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-center">자주 묻는 질문</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">결제 방법은 어떤 것이 있나요?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">
                    신용카드, 체크카드, 계좌이체, 휴대폰 소액결제 등 다양한 결제 방법을 지원합니다.
                    모든 결제는 안전한 결제 시스템을 통해 처리됩니다.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">구독 취소는 어떻게 하나요?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">
                    설정 {">"} 결제 관리 메뉴에서 언제든지 구독을 취소할 수 있습니다.
                    구독 취소 후에도 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">환불 정책은 어떻게 되나요?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">
                    결제일로부터 14일 이내에 환불 요청 시 전액 환불이 가능합니다.
                    14일 이후에는 서비스 이용 기간에 따라 차등 환불됩니다.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-lg">다른 플랫폼에서도 사용할 수 있나요?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">
                    프리미엄 이상 구독 시 iOS, Android, Windows, macOS 등 모든 플랫폼에서 
                    동기화된 서비스를 이용할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-10 text-center">모든 플랫폼 지원</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center">
                <Smartphone className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="font-medium text-lg">모바일</h3>
                <p className="text-zinc-400 mt-2">iOS와 Android에서 언제 어디서나 이용 가능합니다.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Laptop className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="font-medium text-lg">데스크톱</h3>
                <p className="text-zinc-400 mt-2">Windows와 macOS용 애플리케이션으로 편리하게 이용하세요.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Monitor className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="font-medium text-lg">웹</h3>
                <p className="text-zinc-400 mt-2">모든 브라우저에서 접속 가능한 웹 버전을 제공합니다.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <CreditCard className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="font-medium text-lg">하나의 구독</h3>
                <p className="text-zinc-400 mt-2">하나의 구독으로 모든 기기에서 동기화된 서비스를 이용하세요.</p>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4">지금 바로 시작하세요</h2>
            <p className="text-zinc-400 mb-6 max-w-2xl mx-auto">
              NALDA와 함께 더 효율적인 시간 관리를 경험해보세요.
              무료 계정으로 시작하고 언제든지 업그레이드할 수 있습니다.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-black" disabled>
                  무료로 시작하기
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-800 border-zinc-700">
                <DialogHeader>
                  <DialogTitle>무료 계정 시작하기</DialogTitle>
                  <DialogDescription>
                    계정을 만들고 NALDA의 다양한 기능을 무료로 체험해보세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <p className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    이미 계정이 있다면 로그인해주세요.
                  </p>
                  <Button onClick={() => window.location.href = "/auth"} className="w-full">
                    회원가입 / 로그인
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 준비중 오버레이 */}
        <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[2px] flex flex-col items-center justify-start pt-72 z-20">
          <div className="text-center">
            <Construction className="h-16 w-16 text-orange-400 mb-6 inline-block" />
            <h2 className="text-3xl font-bold text-white mb-3">페이지 준비중</h2>
            <p className="text-zinc-300 text-center max-w-md">
              현재 요금제 페이지는 준비 중입니다. 곧 새로운 모습으로 찾아뵙겠습니다!
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PricingPage;
