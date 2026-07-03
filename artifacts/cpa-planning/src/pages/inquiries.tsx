import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useListInquiries, useCreateInquiry, useUpdateInquiry,
  getListInquiriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { HelpCircle, Plus, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inquiries() {
  const { user, canManage } = useUser();
  const [tab, setTab] = useState(canManage ? "all" : "mine");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseDialogId, setResponseDialogId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const queryParams = tab === "mine" ? { userId: user.id } : {};
  const { data: inquiries, isLoading } = useListInquiries(queryParams, {
    query: {
      queryKey: getListInquiriesQueryKey(queryParams)
    }
  });
  
  const createMutation = useCreateInquiry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "تم إرسال استفسارك بنجاح" });
      }
    }
  });

  const updateMutation = useUpdateInquiry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
        setResponseDialogId(null);
        toast({ title: "تم تحديث الاستفسار" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        subject: formData.get("subject") as string,
        details: formData.get("details") as string,
        userId: user.id
      }
    });
  };

  const handleResponse = (e: React.FormEvent<HTMLFormElement>, id: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id,
      data: {
        response: formData.get("response") as string,
        responderId: user.id,
        status: "answered"
      }
    });
  };

  const markResolved = (id: number) => {
    updateMutation.mutate({
      id,
      data: { status: "resolved" }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">مفتوح</Badge>;
      case 'answered': return <Badge className="bg-secondary text-secondary-foreground">تم الرد</Badge>;
      case 'resolved': return <Badge className="bg-accent text-accent-foreground">مغلق / محلول</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            استفسارات الموظفين
          </h1>
          <p className="text-muted-foreground mt-1">اطرح استفساراتك وسيقوم المختصون بالرد عليها</p>
        </div>
        
        {!canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                استفسار جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إرسال استفسار جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">موضوع الاستفسار</Label>
                  <Input id="subject" name="subject" required placeholder="مثال: استفسار حول تعميم رقم..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">التفاصيل</Label>
                  <Textarea id="details" name="details" required rows={5} placeholder="اكتب تفاصيل استفسارك بوضوح..." />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الإرسال..." : "إرسال"}
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
            <TabsTrigger value="all">كل الاستفسارات</TabsTrigger>
            <TabsTrigger value="mine">استفساراتي</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : inquiries?.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد استفسارات</h3>
          </div>
        ) : (
          inquiries?.map((inquiry) => (
            <Card key={inquiry.id} className="overflow-hidden border-r-4" style={{ borderRightColor: inquiry.status === 'open' ? '#3b82f6' : inquiry.status === 'answered' ? '#c6972d' : '#0ab0a2' }}>
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-5 border-b md:border-b-0 md:border-l">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-primary">{inquiry.subject}</h3>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  <p className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap">{inquiry.details}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <span>بواسطة:</span>
                      <span className="text-foreground">{inquiry.userName}</span>
                    </div>
                    <span>{format(new Date(inquiry.date), 'dd MMM yyyy, hh:mm a', { locale: ar })}</span>
                  </div>
                </div>
                
                <div className="flex-1 p-5 bg-muted/30">
                  {inquiry.response ? (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-secondary-foreground flex items-center gap-2">
                        الرد:
                      </h4>
                      <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{inquiry.response}</p>
                      <div className="text-xs text-muted-foreground flex justify-between items-center">
                        <span>رد بواسطة: {inquiry.responderName}</span>
                        {canManage && inquiry.status !== 'resolved' && (
                          <Button variant="ghost" size="sm" className="h-7 text-accent hover:text-accent hover:bg-accent/10" onClick={() => markResolved(inquiry.id)}>
                            <CheckCircle2 className="w-4 h-4 ml-1" />
                            تحديد كمحلول
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : canManage ? (
                    <div className="h-full flex flex-col justify-center">
                      <Dialog open={responseDialogId === inquiry.id} onOpenChange={(open) => setResponseDialogId(open ? inquiry.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-secondary text-secondary-foreground hover:bg-secondary/10">
                            <Send className="w-4 h-4 mr-2 rotate-180" />
                            إضافة رد
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>الرد على الاستفسار</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => handleResponse(e, inquiry.id)} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>الاستفسار الأساسي</Label>
                              <div className="p-3 bg-muted rounded-md text-sm">{inquiry.details}</div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="response">نص الرد</Label>
                              <Textarea id="response" name="response" required rows={4} placeholder="اكتب ردك هنا..." />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setResponseDialogId(null)}>إلغاء</Button>
                              <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "جاري الإرسال..." : "إرسال الرد"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                      في انتظار الرد من المختصين...
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}