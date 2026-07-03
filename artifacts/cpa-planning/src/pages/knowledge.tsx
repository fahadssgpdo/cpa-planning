import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useListDocuments, useCreateDocument, useDeleteDocument,
  getListDocumentsQueryKey, DocumentCategory 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
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
import { BookOpen, Plus, Download, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "manuals", label: "أدلة التخطيط" },
  { id: "guidelines", label: "أدلة التشغيلي" },
  { id: "kpi", label: "مؤشرات الأداء" },
  { id: "policies", label: "السياسات" },
  { id: "templates", label: "النماذج" },
  { id: "other", label: "وثائق أخرى" }
];

export default function KnowledgeBase() {
  const { canManage } = useUser();
  const [tab, setTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const queryParams = tab === "all" ? {} : { category: tab };
  const { data: documents, isLoading } = useListDocuments(queryParams, {
    query: {
      queryKey: getListDocumentsQueryKey(queryParams)
    }
  });
  
  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "تم إضافة الوثيقة بنجاح" });
      }
    }
  });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "تم حذف الوثيقة" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as DocumentCategory,
        fileUrl: formData.get("fileUrl") as string || "https://example.com/doc.pdf" // dummy fallback
      }
    });
  };

  const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.id === cat)?.label || cat;

  const filteredDocs = documents?.filter(d => 
    d.name.includes(search) || d.description.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            قاعدة المعرفة
          </h1>
          <p className="text-muted-foreground mt-1">الوثائق والأدلة والنماذج المعتمدة في الدائرة</p>
        </div>
        
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                إضافة وثيقة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة وثيقة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الوثيقة</Label>
                  <Input id="name" name="name" required placeholder="مثال: دليل التخطيط الاستراتيجي..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <Select name="category" required defaultValue="manuals">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">رابط الملف (للعرض التوضيحي)</Label>
                  <Input id="fileUrl" name="fileUrl" type="url" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">وصف مختصر</Label>
                  <Textarea id="description" name="description" required rows={3} placeholder="اكتب وصفاً للوثيقة..." />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الرفع..." : "حفظ الوثيقة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto p-1 bg-card border">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex-grow py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Input 
          placeholder="بحث في الوثائق..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">لا توجد وثائق</h3>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:border-primary/50 transition-colors group">
              <CardContent className="p-5 flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-foreground truncate" title={doc.name}>{doc.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3 h-8">{doc.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <Badge variant="secondary" className="text-[10px] font-normal px-1.5 bg-muted">
                      {getCategoryLabel(doc.category)}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary" asChild>
                        <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" title="تنزيل">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      {canManage && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: doc.id })}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}