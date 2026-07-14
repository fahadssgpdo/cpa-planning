import { useState } from "react";
import { useLocale } from "@/hooks/use-locale";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import {
  Sparkles, TrendingUp, AlertTriangle, Info, Zap,
  Trophy, Target, RefreshCw, Users
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type InsightType = "positive" | "warning" | "neutral" | "action";

interface Insight {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  type: InsightType;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const insightConfig: Record<InsightType, { icon: typeof Sparkles; color: string; bg: string; border: string }> = {
  positive: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
  neutral: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
  action: { icon: Zap, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800" },
};

function SectionHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

export function DashboardAnalyticsPanel() {
  const { t, locale } = useLocale();
  const isEn = locale === "en";
  const ta = t.dashboard.analytics;
  const dateFnsLocale = isEn ? enUS : ar;
  const { data, isLoading } = useGetDashboardAnalytics();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsGenerated, setInsightsGenerated] = useState(false);

  const generateInsights = async () => {
    if (!data) return;
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/dashboard/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setInsights(json.insights ?? []);
      setInsightsGenerated(true);
    } catch {
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  };

  const labelStatus = (key: string) =>
    (ta.status as Record<string, string>)[key] ?? key;
  const labelCat = (key: string) =>
    (ta.category as Record<string, string>)[key] ?? key;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activityConfig: ChartConfig = {
    suggestions: { label: isEn ? "Suggestions" : "مقترحات", color: "hsl(var(--primary))" },
    inquiries: { label: isEn ? "Inquiries" : "استفسارات", color: "hsl(var(--secondary))" },
    discussions: { label: isEn ? "Discussions" : "نقاشات", color: "#3b82f6" },
  };

  const statusConfig: ChartConfig = Object.fromEntries(
    data.suggestionsByStatus.map((d, i) => [
      d.key,
      { label: labelStatus(d.key), color: CHART_COLORS[i % CHART_COLORS.length] },
    ])
  );

  const weeklyData = data.weeklyActivity.map((w) => ({
    ...w,
    label: (() => {
      try {
        return format(new Date(w.week), "MMM d", { locale: dateFnsLocale });
      } catch {
        return w.week;
      }
    })(),
  }));

  const sugStatusData = data.suggestionsByStatus.map((d) => ({
    ...d,
    name: labelStatus(d.key),
  }));

  const inqCatData = data.inquiriesByCategory
    .map((d) => ({ ...d, name: labelCat(d.key) }))
    .sort((a, b) => b.count - a.count);

  const resolutionRate = data.resolutionRate;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{ta.sectionTitle}</h2>
        </div>
      </div>

      {/* Row 1: Activity Trend + Resolution Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Activity Trend - spans 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{ta.activityTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="h-52">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="gradSugg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area type="monotone" dataKey="suggestions" stroke="hsl(var(--primary))" fill="url(#gradSugg)" strokeWidth={2} />
                <Area type="monotone" dataKey="inquiries" stroke="hsl(var(--secondary))" fill="url(#gradInq)" strokeWidth={2} />
                <Area type="monotone" dataKey="discussions" stroke="#3b82f6" fill="url(#gradDisc)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Resolution Rate */}
        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader className="pb-2 w-full">
            <CardTitle className="text-base font-semibold flex items-center gap-2 justify-center">
              <Target className="w-4 h-4 text-primary" />
              {ta.resolutionRate}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={resolutionRate >= 70 ? "#10b981" : resolutionRate >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="12"
                  strokeDasharray={`${(resolutionRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none">{resolutionRate}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEn ? "of inquiries resolved" : "من الاستفسارات أُنجز"}
            </p>
            <Badge
              variant="outline"
              className={
                resolutionRate >= 70
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : resolutionRate >= 40
                  ? "border-amber-300 text-amber-700 bg-amber-50"
                  : "border-red-300 text-red-700 bg-red-50"
              }
            >
              {resolutionRate >= 70 ? (isEn ? "Excellent" : "ممتاز") : resolutionRate >= 40 ? (isEn ? "Average" : "متوسط") : (isEn ? "Needs Attention" : "يحتاج متابعة")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Status Donut + Inquiries Bar + Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suggestions by Status - Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{ta.suggestionsByStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            {sugStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                {isEn ? "No data yet" : "لا توجد بيانات بعد"}
              </div>
            ) : (
              <ChartContainer config={statusConfig} className="h-52">
                <PieChart>
                  <Pie
                    data={sugStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {sugStatusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow text-xs">
                            <p className="font-semibold">{payload[0].name}</p>
                            <p>{payload[0].value} {isEn ? "suggestions" : "مقترح"}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Inquiries by Category - Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{ta.inquiriesByCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            {inqCatData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                {isEn ? "No data yet" : "لا توجد بيانات بعد"}
              </div>
            ) : (
              <ChartContainer config={{ count: { label: isEn ? "Inquiries" : "استفسارات", color: "hsl(var(--primary))" } }} className="h-52">
                <BarChart data={inqCatData} layout="vertical" margin={{ left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow text-xs">
                            <p className="font-semibold">{payload[0].payload.name}</p>
                            <p>{payload[0].value} {isEn ? "inquiries" : "استفسار"}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {inqCatData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              {ta.topContributors}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topContributors.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                {isEn ? "No data yet" : "لا توجد بيانات بعد"}
              </div>
            ) : (
              <div className="space-y-2">
                {data.topContributors.map((c, i) => {
                  const maxCount = data.topContributors[0]?.count ?? 1;
                  const pct = Math.round((c.count / maxCount) * 100);
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={c.userId} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm w-5 text-center">{medals[i] ?? `${i + 1}.`}</span>
                        <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{c.count}</span>
                      </div>
                      <div className="ms-7 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Copilot Insights */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">{ta.aiInsights}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{ta.aiInsightsDesc}</CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant={insightsGenerated ? "outline" : "default"}
              onClick={generateInsights}
              disabled={insightsLoading}
              className="gap-2"
            >
              {insightsLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {insightsLoading ? ta.generating : ta.generateInsights}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight, i) => {
                const cfg = insightConfig[insight.type] ?? insightConfig.neutral;
                const Icon = cfg.icon;
                const label = (ta.insightTypes as Record<string, string>)[insight.type] ?? insight.type;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 space-y-2 ${cfg.bg} ${cfg.border}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-snug ${cfg.color}`}>
                          {isEn ? insight.titleEn : insight.titleAr}
                        </p>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1 mt-1 ${cfg.border} ${cfg.color}`}>
                          {label}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {isEn ? insight.descEn : insight.descAr}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isEn ? "AI-Powered Insights Ready" : "رؤى الذكاء الاصطناعي جاهزة"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isEn
                    ? "Click the button above to analyze live platform data and generate actionable insights for the planning team."
                    : "اضغط على الزر أعلاه لتحليل بيانات المنصة وتوليد رؤى عملية لفريق التخطيط."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
