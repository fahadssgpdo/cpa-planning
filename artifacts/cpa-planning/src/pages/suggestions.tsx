import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useListSuggestions, useCreateSuggestion, useUpdateSuggestion,
  getListSuggestionsQueryKey, SuggestionCategory, SuggestionStatus 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Lightbulb, Plus, CheckCircle, XCircle, Clock, Settings, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Suggestions() {
  const { user, canManage } = useUser();
  const [tab, setTab] = useState(canManage ? "all" : "mine");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackDialogId, setFeedbackDialogId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const queryParams = tab === "mine" ? { userId: user.id } : {};
  const { data: suggestions, isLoading } = useListSuggestions(queryParams, {
    query: {
      queryKey: getListSuggestionsQueryKey(queryParams)
    }
  });
  
  const createMutation = useCreateSuggestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "تم تقديم مقترحك بنجاح" });
      }
    }
  });

  const updateMutation = useUpdateSuggestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey() });
        setFeedbackDialogId(null);
        toast({ title: "تم تحديث حالة المقترح" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        category: formData.get("category") as SuggestionCategory,
        text: formData.get("text") as string,
        userId: user.id
      }
    });
  };

  const handleFeedback = (e: React.FormEvent<HTMLFormElement>, id: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id,
      data: {
        status: formData.get("status") as SuggestionStatus,
        feedback: formData.get("feedback") as string,
      }
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new': return { label: "جديد", color: "bg-blue-100 text-blue-800", icon: FileText };
      case 'under_review': return { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case 'accepted': return { label: "مقبول", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case 'rejected': return { label: "مرفوض", color: "bg-red-100 text-red-800", icon: XCircle };
      case 'implemented': return { label: "منفّذ", color: "bg-teal-100 text-teal-800", icon: Settings };
      default: return { label: status, color: "bg-gray-100 text-gray-800", icon: FileText };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'improvement': return "تحسين مستمر";
      case 'initiative': return "مبادرة جديدة";
      case 'process': return "إجراءات العمل";
      case 'feedback': return "تغذية راجعة";
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            المقترحات والأفكار
          </h1>
          <p className="text-muted-foreground mt-1">شارك أفكارك لتطوير وتحسين بيئة العمل والتخطيط</p>
        </div>
        
        {!canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                تقديم مقترح
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>تقديم مقترح أو فكرة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="category">نوع المقترح</Label>
                  <Select name="category" required defaultValue="improvement">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="improvement">تحسين مستمر</SelectItem>
                      <SelectItem value="initiative">مبادرة جديدة</SelectItem>
                      <SelectItem value="process">إجراءات العمل</SelectItem>
                      <SelectItem value="feedback">تغذية راجعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text">تفاصيل المقترح</Label>
                  <Textarea id="text" name="text" required rows={5} placeholder="اشرح فكرتك بوضوح وما هي الفوائد المتوقعة..." />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الإرسال..." : "إرسال المقترح"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {canManage && (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="all">كل المقترحات</TabsTrigger>
            <TabsTrigger value="mine">مقترحاتي</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : suggestions?.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed">
            <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد مقترحات</h3>
          </div>
        ) : (
          suggestions?.map((suggestion) => {
            const statusInfo = getStatusInfo(suggestion.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={suggestion.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-background">
                      {getCategoryLabel(suggestion.category)}
                    </Badge>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4 pb-2">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{suggestion.text}</p>
                  
                  {suggestion.feedback && (
                    <div className="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-md">
                      <p className="text-xs font-semibold text-secondary-foreground mb-1">رد الإدارة:</p>
                      <p className="text-sm text-foreground/80">{suggestion.feedback}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-3 flex justify-between items-center text-xs text-muted-foreground bg-muted/10 border-t mt-auto">
                  <div className="font-medium text-foreground">{suggestion.userName}</div>
                  <div className="flex items-center gap-4">
                    <span>{format(new Date(suggestion.date), 'dd MMM yyyy', { locale: ar })}</span>
                    
                    {canManage && (
                      <Dialog open={feedbackDialogId === suggestion.id} onOpenChange={(open) => setFeedbackDialogId(open ? suggestion.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-primary hover:bg-primary/10">
                            تحديث الحالة
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تحديث حالة المقترح</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => handleFeedback(e, suggestion.id)} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="status">الحالة</Label>
                              <Select name="status" required defaultValue={suggestion.status}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">جديد</SelectItem>
                                  <SelectItem value="under_review">قيد المراجعة</SelectItem>
                                  <SelectItem value="accepted">مقبول</SelectItem>
                                  <SelectItem value="rejected">مرفوض</SelectItem>
                                  <SelectItem value="implemented">منفّذ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="feedback">الرد / التغذية الراجعة</Label>
                              <Textarea id="feedback" name="feedback" rows={4} defaultValue={suggestion.feedback || ""} placeholder="اكتب ردك على المقترح هنا..." />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setFeedbackDialogId(null)}>إلغاء</Button>
                              <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التحديث"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}