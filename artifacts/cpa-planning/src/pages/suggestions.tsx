import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { 
  useListSuggestions, useCreateSuggestion, useUpdateSuggestion,
  getListSuggestionsQueryKey, SuggestionCategory, SuggestionStatus 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
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
import { Lightbulb, Plus, CheckCircle, XCircle, Clock, Settings, FileText, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const SUGGESTION_TYPES: { value: SuggestionCategory; label: string }[] = [
  { value: "improvement", label: "تحسين مستمر" },
  { value: "initiative",  label: "مبادرة جديدة" },
  { value: "process",     label: "إجراءات العمل" },
  { value: "feedback",    label: "تغذية راجعة" },
];

type FieldDef = { name: string; label: string; type: "text" | "textarea"; required?: boolean; placeholder?: string };

const TYPE_FIELDS: Record<SuggestionCategory, FieldDef[]> = {
  improvement: [
    { name: "current",  label: "المشكلة / الوضع الحالي",   type: "textarea", required: true,  placeholder: "صف المشكلة أو الوضع الذي تريد تحسينه..." },
    { name: "proposed", label: "التحسين المقترح",           type: "textarea", required: true,  placeholder: "ما الذي تقترح تغييره أو تحسينه؟" },
    { name: "benefits", label: "الفوائد المتوقعة",          type: "textarea", required: false, placeholder: "ما الفوائد التي ستعود على الدائرة أو الموظفين؟" },
  ],
  initiative: [
    { name: "title",       label: "عنوان المبادرة",         type: "text",     required: true,  placeholder: "اكتب عنواناً واضحاً للمبادرة" },
    { name: "goal",        label: "الهدف من المبادرة",      type: "textarea", required: true,  placeholder: "ما الذي تريد تحقيقه من خلال هذه المبادرة؟" },
    { name: "beneficiary", label: "الفئة المستفيدة",        type: "text",     required: false, placeholder: "من سيستفيد؟ (موظفون، جمهور، إدارة...)" },
    { name: "resources",   label: "الموارد المطلوبة",       type: "textarea", required: false, placeholder: "ما الموارد البشرية أو المادية المطلوبة؟" },
  ],
  process: [
    { name: "current",   label: "الإجراء الحالي",           type: "textarea", required: true,  placeholder: "صف الإجراء أو الخطوة الحالية..." },
    { name: "proposed",  label: "التغيير المقترح",          type: "textarea", required: true,  placeholder: "ما الإجراء البديل أو المعدّل الذي تقترحه؟" },
    { name: "rationale", label: "مبرر التغيير",             type: "textarea", required: false, placeholder: "لماذا هذا التغيير ضروري أو مفيد؟" },
  ],
  feedback: [
    { name: "area",           label: "المجال",              type: "text",     required: true,  placeholder: "مثال: التواصل الداخلي، الأداء، بيئة العمل..." },
    { name: "details",        label: "التفاصيل",            type: "textarea", required: true,  placeholder: "شارك ملاحظاتك أو تجربتك بشكل مفصّل..." },
    { name: "recommendation", label: "التوصية",             type: "textarea", required: false, placeholder: "ما الذي توصي به لمعالجة هذا الأمر؟" },
  ],
};

function buildTextFromFields(category: SuggestionCategory, values: Record<string, string>): string {
  const fields = TYPE_FIELDS[category];
  return fields
    .filter(f => values[f.name]?.trim())
    .map(f => `${f.label}:\n${values[f.name].trim()}`)
    .join("\n\n");
}

function TypedFields({ category }: { category: SuggestionCategory }) {
  const fields = TYPE_FIELDS[category];
  return (
    <>
      {fields.map(f => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>
            {f.label}
            {f.required && <span className="text-destructive ms-1">*</span>}
          </Label>
          {f.type === "textarea" ? (
            <Textarea
              id={f.name}
              name={f.name}
              required={f.required}
              rows={3}
              placeholder={f.placeholder}
              className="resize-none"
            />
          ) : (
            <Input id={f.name} name={f.name} required={f.required} placeholder={f.placeholder} />
          )}
        </div>
      ))}
    </>
  );
}

export default function Suggestions() {
  const { user, canManage } = useUser();
  const [tab, setTab] = useState(canManage ? "all" : "mine");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackDialogId, setFeedbackDialogId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SuggestionCategory>("improvement");
  const [attachmentName, setAttachmentName] = useState<string>("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = tab === "mine" ? { userId: user.id } : {};
  const { data: suggestions, isLoading } = useListSuggestions(queryParams, {
    query: { queryKey: getListSuggestionsQueryKey(queryParams) }
  });

  const createMutation = useCreateSuggestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey() });
        setIsDialogOpen(false);
        setSelectedCategory("improvement");
        setAttachmentName("");
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
    const values: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") values[k] = v;
    }
    const text = buildTextFromFields(selectedCategory, values);
    createMutation.mutate({
      data: {
        category: selectedCategory,
        text,
        userId: user.id,
        attachment: attachmentName || undefined,
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
      case 'new':          return { label: "جديد",           color: "bg-blue-100 text-blue-800",   icon: FileText };
      case 'under_review': return { label: "قيد المراجعة",   color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case 'accepted':     return { label: "مقبول",          color: "bg-green-100 text-green-800",  icon: CheckCircle };
      case 'rejected':     return { label: "مرفوض",          color: "bg-red-100 text-red-800",      icon: XCircle };
      case 'implemented':  return { label: "منفّذ",          color: "bg-teal-100 text-teal-800",    icon: Settings };
      default:             return { label: status,           color: "bg-gray-100 text-gray-800",    icon: FileText };
    }
  };

  const getCategoryLabel = (category: string) =>
    SUGGESTION_TYPES.find(t => t.value === category)?.label ?? category;

  const canCreate = !canManage || user.role === "manager";

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

        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setSelectedCategory("improvement"); setAttachmentName(""); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 me-2" />
                تقديم مقترح
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تقديم مقترح أو فكرة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>نوع المقترح <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v as SuggestionCategory)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUGGESTION_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <TypedFields category={selectedCategory} />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4" />
                    المرفق (اختياري)
                  </Label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex-1 flex items-center gap-2 border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 shrink-0" />
                      {attachmentName ? (
                        <span className="text-foreground font-medium truncate">{attachmentName}</span>
                      ) : (
                        <span>انقر لاختيار ملف (PDF, Word, صورة...)</span>
                      )}
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setAttachmentName(file ? file.name : "");
                      }}
                    />
                    {attachmentName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setAttachmentName("")}
                      >
                        إزالة
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
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
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">{suggestion.text}</p>

                  {suggestion.attachment && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border rounded-md px-3 py-2">
                      <Paperclip className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span className="truncate">{suggestion.attachment}</span>
                    </div>
                  )}

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
                              <Label>الحالة</Label>
                              <Select name="status" required defaultValue={suggestion.status}>
                                <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
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
                              <Label>الرد / التغذية الراجعة</Label>
                              <Textarea name="feedback" rows={4} defaultValue={suggestion.feedback || ""} placeholder="اكتب ردك على المقترح هنا..." />
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
