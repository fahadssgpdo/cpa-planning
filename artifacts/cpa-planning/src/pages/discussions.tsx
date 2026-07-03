import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { 
  useListDiscussions, useCreateDiscussion, 
  getListDiscussionsQueryKey, DiscussionStatus 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MessagesSquare, Plus, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Discussions() {
  const { user, canManage } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: discussions, isLoading } = useListDiscussions();
  
  const createMutation = useCreateDiscussion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "تم إنشاء النقاش بنجاح" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        authorId: user.id
      }
    });
  };

  const filteredDiscussions = discussions?.filter(d => 
    d.title.includes(search) || d.description.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <MessagesSquare className="w-6 h-6 text-accent" />
            النقاشات التشاركية
          </h1>
          <p className="text-muted-foreground mt-1">مساحة لتبادل الأفكار والآراء حول التخطيط والتطوير</p>
        </div>
        
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                طرح نقاش جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>طرح موضوع نقاش جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">موضوع النقاش</Label>
                  <Input id="title" name="title" required placeholder="أدخل موضوع النقاش..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف والتفاصيل</Label>
                  <Textarea id="description" name="description" required rows={4} placeholder="اكتب تفاصيل ومحاور النقاش هنا..." />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الحفظ..." : "نشر النقاش"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card p-2 rounded-lg border">
        <Input 
          placeholder="بحث في النقاشات..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : filteredDiscussions.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed">
            <MessagesSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد نقاشات</h3>
            <p className="text-sm text-muted-foreground mt-1">لم يتم العثور على أي نقاشات تطابق بحثك</p>
          </div>
        ) : (
          filteredDiscussions.map((discussion) => (
            <Link key={discussion.id} href={`/discussions/${discussion.id}`} className="block h-full">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <Badge variant={discussion.status === 'open' ? 'default' : 'secondary'} 
                           className={discussion.status === 'open' ? 'bg-accent hover:bg-accent/80' : ''}>
                      {discussion.status === 'open' ? 'مفتوح' : 'مغلق'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(discussion.date), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {discussion.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {discussion.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-3 border-t flex justify-between items-center text-sm">
                  <div className="text-muted-foreground">
                    بواسطة: <span className="font-medium text-foreground">{discussion.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <MessageCircle className="w-4 h-4" />
                    <span>{discussion.commentCount}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}