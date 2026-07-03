import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, 
  getListAnnouncementsQueryKey, AnnouncementCategory 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Archive, ArchiveRestore } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Announcements() {
  const { user, canManage } = useUser();
  const [tab, setTab] = useState("active");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: announcements, isLoading } = useListAnnouncements({ archived: tab === "archived" });
  
  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "تم إضافة الإعلان بنجاح" });
      }
    }
  });

  const updateMutation = useUpdateAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        toast({ title: "تم تحديث حالة الإعلان" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        title: formData.get("title") as string,
        body: formData.get("body") as string,
        category: formData.get("category") as AnnouncementCategory,
        authorId: user.id
      }
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'update': return "bg-green-100 text-green-800 border-green-200";
      case 'circular': return "bg-amber-100 text-amber-800 border-amber-200";
      case 'deadline': return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'announcement': return "إعلان";
      case 'update': return "مستجدات التخطيط";
      case 'circular': return "تعميم";
      case 'deadline': return "موعد مهم";
      default: return category;
    }
  };

  const filteredAnnouncements = announcements?.filter(a => 
    a.title.includes(search) || a.body.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-secondary" />
            الإعلانات والمستجدات
          </h1>
          <p className="text-muted-foreground mt-1">آخر الأخبار والتعاميم الخاصة بدائرة التخطيط</p>
        </div>
        
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Plus className="w-4 h-4 mr-2" />
                إضافة إعلان جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة إعلان جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الإعلان</Label>
                  <Input id="title" name="title" required placeholder="أدخل عنوان الإعلان هنا..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select name="category" required defaultValue="announcement">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">إعلان</SelectItem>
                      <SelectItem value="update">مستجدات التخطيط</SelectItem>
                      <SelectItem value="circular">تعميم</SelectItem>
                      <SelectItem value="deadline">موعد مهم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">التفاصيل</Label>
                  <Textarea id="body" name="body" required rows={5} placeholder="اكتب تفاصيل الإعلان هنا..." />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الحفظ..." : "نشر الإعلان"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-2 rounded-lg border">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 h-10">
            <TabsTrigger value="active">نشط</TabsTrigger>
            <TabsTrigger value="archived">مؤرشف</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="w-full sm:w-64">
          <Input 
            placeholder="بحث في الإعلانات..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed">
            <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد إعلانات</h3>
            <p className="text-sm text-muted-foreground mt-1">لم يتم العثور على أي إعلانات تطابق بحثك</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                        {getCategoryLabel(announcement.category)}
                      </Badge>
                      {announcement.archived && <Badge variant="secondary">مؤرشف</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {format(new Date(announcement.date), 'dd MMMM yyyy', { locale: ar })}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">{announcement.title}</h3>
                  <p className="text-foreground/80 leading-relaxed">{announcement.body}</p>
                  
                  <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>بواسطة:</span>
                      <span className="font-medium text-foreground">{announcement.authorName}</span>
                    </div>
                    
                    {canManage && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-muted-foreground hover:text-primary"
                        onClick={() => updateMutation.mutate({ 
                          id: announcement.id, 
                          data: { archived: !announcement.archived } 
                        })}
                      >
                        {announcement.archived ? (
                          <><ArchiveRestore className="w-4 h-4 ml-1.5" /> استعادة</>
                        ) : (
                          <><Archive className="w-4 h-4 ml-1.5" /> أرشفة</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}