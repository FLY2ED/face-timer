import React, { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { formatDuration } from "@/utils/timeUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Calendar, Construction } from "lucide-react";
import { 
  BarChart, Bar, 
  AreaChart, Area, 
  LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  TooltipProps
} from "recharts";
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

// Mock data for statistics
const dailyData = [
  { day: '월', hours: 2.5, tasks: { "학습": 1.5, "업무": 1.0 } },
  { day: '화', hours: 3.8, tasks: { "학습": 2.0, "업무": 1.8 } },
  { day: '수', hours: 2.7, tasks: { "학습": 1.2, "업무": 1.5 } },
  { day: '목', hours: 4.1, tasks: { "학습": 2.5, "업무": 1.6 } },
  { day: '금', hours: 5.0, tasks: { "학습": 3.0, "업무": 2.0 } },
  { day: '토', hours: 1.5, tasks: { "학습": 1.5, "업무": 0 } },
  { day: '일', hours: 2.2, tasks: { "학습": 2.2, "업무": 0 } },
];

const weeklyData = [
  { week: '3/31~4/6', hours: 21.8 },
  { week: '4/7~4/13', hours: 24.5 },
  { week: '4/14~4/20', hours: 19.2 },
  { week: '4/21~4/27', hours: 25.7 },
  { week: '4/28~5/4', hours: 22.3 },
];

const monthlyData = [
  { month: '1월', hours: 80.5 },
  { month: '2월', hours: 65.2 },
  { month: '3월', hours: 78.9 },
  { month: '4월', hours: 93.4 },
  { month: '5월', hours: 0 },
  { month: '6월', hours: 0 },
  { month: '7월', hours: 0 },
  { month: '8월', hours: 42.1 },
  { month: '9월', hours: 75.3 },
  { month: '10월', hours: 89.7 },
  { month: '11월', hours: 110.2 },
  { month: '12월', hours: 95.8 },
];

const taskDistributionData = [
  { name: "학습", value: 45, color: "#ff6b00" },
  { name: "업무", value: 30, color: "#3b82f6" },
  { name: "독서", value: 15, color: "#22c55e" },
  { name: "기타", value: 10, color: "#94a3b8" },
];

const timeDistributionData = [
  { name: "오전", value: 35, color: "#fb923c" },
  { name: "오후", value: 45, color: "#f97316" },
  { name: "저녁", value: 15, color: "#ea580c" },
  { name: "새벽", value: 5, color: "#c2410c" },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => {
  // Generate random data for each hour
  return {
    hour: i,
    value: Math.random() * 60,
    display: `${i < 10 ? '0' + i : i}:00`
  };
});

const chartConfig = {
  학습: {
    label: "학습",
    color: "#ff6b00",
  },
  업무: {
    label: "업무",
    color: "#3b82f6",
  },
  독서: {
    label: "독서", 
    color: "#22c55e",
  },
  기타: {
    label: "기타",
    color: "#94a3b8",
  },
};

const StatisticsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("일일");
  const [selectedDate, setSelectedDate] = useState("2025. 4. 2. (수)");
  const [timeFrames, setTimeFrames] = useState({
    일일: "2025. 4. 2. (수)",
    주간: "3월 31일 ~ 4월 6일",
    월간: "2025년 4월",
    연간: "2025년"
  });

  // Navigation functions
  const navigatePrevious = () => {
    // This would normally update the date based on the selected tab
    console.log("Navigate to previous time period");
  };

  const navigateNext = () => {
    // This would normally update the date based on the selected tab
    console.log("Navigate to next time period");
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 text-white relative">
        {/* 기존 통계 페이지 컨텐츠 (흐리게 처리될 부분) */}
        <div className="opacity-30 pointer-events-none">
          <h1 className="text-2xl font-bold mb-6">통계</h1>
          
          {/* Tabs for different time frames */}
          <Tabs defaultValue="일일" className="mb-6" onValueChange={setSelectedTab}>
            <TabsList className="bg-zinc-800 w-full grid grid-cols-5 h-12">
              {["기간", "일간", "주간", "월간", "추이"].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-black"
                  disabled
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Time period navigation */}
            <div className="bg-zinc-800 rounded-lg p-4 mt-4 flex items-center justify-between">
              <Button variant="ghost" onClick={navigatePrevious} className="text-zinc-400" disabled>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <span className="text-lg">{timeFrames[selectedTab as keyof typeof timeFrames] || selectedDate}</span>
              </div>
              
              <Button variant="ghost" onClick={navigateNext} className="text-zinc-400" disabled>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* 각 탭 내용 (간단한 플레이스홀더로 대체) */}
            <TabsContent value="기간" className="mt-4">
              <Card className="bg-zinc-800 border-zinc-700"><CardContent className="pt-6 text-center text-zinc-500">통계 데이터가 준비중입니다.</CardContent></Card>
            </TabsContent>
             <TabsContent value="일간" className="mt-4">
              <Card className="bg-zinc-800 border-zinc-700"><CardContent className="pt-6 text-center text-zinc-500">통계 데이터가 준비중입니다.</CardContent></Card>
            </TabsContent>
             <TabsContent value="주간" className="mt-4">
              <Card className="bg-zinc-800 border-zinc-700"><CardContent className="pt-6 text-center text-zinc-500">통계 데이터가 준비중입니다.</CardContent></Card>
            </TabsContent>
             <TabsContent value="월간" className="mt-4">
              <Card className="bg-zinc-800 border-zinc-700"><CardContent className="pt-6 text-center text-zinc-500">통계 데이터가 준비중입니다.</CardContent></Card>
            </TabsContent>
             <TabsContent value="추이" className="mt-4">
              <Card className="bg-zinc-800 border-zinc-700"><CardContent className="pt-6 text-center text-zinc-500">통계 데이터가 준비중입니다.</CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* 준비중 오버레이 */}
        <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
          <div className="text-center">
            <Construction className="h-16 w-16 text-blue-400 mb-6 inline-block" />
            <h2 className="text-3xl font-bold text-white mb-3">페이지 준비중</h2>
            <p className="text-zinc-300 text-center max-w-md">
              현재 통계 페이지는 개발 중입니다. 곧 멋진 모습으로 찾아뵙겠습니다!
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 p-3 border border-zinc-700 rounded-md shadow-lg">
        <p className="text-zinc-300">{`${label}`}</p>
        {payload.map((entry, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || "#ff6b00" }}>
            {`${entry.name || entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}${entry.name !== '시간' && entry.dataKey !== '시간' ? '시간' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default StatisticsPage;
