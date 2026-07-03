import { useUser } from "@/hooks/use-user";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Megaphone, MessagesSquare, HelpCircle, BookOpen, Users, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, canManage, isAdmin } = useUser();
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-l from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">مرحباً {user.name}</h1>
          <p className="text-primary-foreground/80 text-lg">مركزك للتواصل والتعاون في شؤون التخطيط</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/announcements" className="block group">
            <Card className="hover:border-secondary transition-colors cursor-pointer group-hover:shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold">الإعلانات</CardTitle>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.recentAnnouncements}</div>
                <p className="text-sm text-muted-foreground mt-1">إعلانات حديثة</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inquiries" className="block group">
            <Card className="hover:border-secondary transition-colors cursor-pointer group-hover:shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold">الاستفسارات</CardTitle>
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.openInquiries}</div>
                <p className="text-sm text-muted-foreground mt-1">استفسار مفتوح</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/discussions" className="block group">
            <Card className="hover:border-secondary transition-colors cursor-pointer group-hover:shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold">النقاشات</CardTitle>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <MessagesSquare className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeDiscussions}</div>
                <p className="text-sm text-muted-foreground mt-1">نقاش نشط</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/suggestions" className="block group">
            <Card className="hover:border-secondary transition-colors cursor-pointer group-hover:shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold">المقترحات</CardTitle>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.newSuggestions}</div>
                <p className="text-sm text-muted-foreground mt-1">مقترح جديد</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/knowledge" className="block group">
            <Card className="hover:border-secondary transition-colors cursor-pointer group-hover:shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold">قاعدة المعرفة</CardTitle>
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalDocuments}</div>
                <p className="text-sm text-muted-foreground mt-1">وثيقة متاحة</p>
              </CardContent>
            </Card>
          </Link>

          {(canManage || isAdmin) && (
            <Link href="/admin" className="block group">
              <Card className="hover:border-secondary transition-colors cursor-pointer group-hover:shadow-md h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-bold">المستخدمين</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-sm text-muted-foreground mt-1">إجمالي المستخدمين</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}