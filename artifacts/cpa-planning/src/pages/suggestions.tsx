import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import { 
  useListSuggestions, useCreateSuggestion, useUpdateSuggestion,
  getListSuggestionsQueryKey, SuggestionCategory, SuggestionStatus 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
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

type FieldDef = { name: string; labelAr: string; labelEn: string; type: "text" | "textarea"; required?: boolean; placeholderAr?: string; placeholderEn?: string };

const TYPE_FIELDS: Record<SuggestionCategory, FieldDef[]> = {
  improvement: [
    { name: "current",  labelAr: "المشكلة / الوضع الحالي",   labelEn: "Problem / Current Situation", type: "textarea", required: true,  placeholderAr: "صف المشكلة أو الوضع الذي تريد تحسينه...", placeholderEn: "Describe the problem or situation you want to improve..." },
    { name: "proposed", labelAr: "التحسين المقترح",           labelEn: "Proposed Improvement",        type: "textarea", required: true,  placeholderAr: "ما الذي تقترح تغييره أو تحسينه؟",        placeholderEn: "What do you propose to change or improve?" },
    { name: "benefits", labelAr: "الفوائد المتوقعة",          labelEn: "Expected Benefits",           type: "textarea", required: false, placeholderAr: "ما الفوائد التي ستعود على الدائرة؟",     placeholderEn: "What benefits will this bring to the department?" },
  ],
  initiative: [
    { name: "title",       labelAr: "عنوان المبادرة",         labelEn: "Initiative Title",      type: "text",     required: true,  placeholderAr: "اكتب عنواناً واضحاً للمبادرة",    placeholderEn: "Write a clear title for the initiative" },
    { name: "goal",        labelAr: "الهدف من المبادرة",      labelEn: "Objective",             type: "textarea", required: true,  placeholderAr: "ما الذي تريد تحقيقه؟",            placeholderEn: "What do you want to achieve?" },
    { name: "beneficiary", labelAr: "الفئة المستفيدة",        labelEn: "Target Audience",       type: "text",     required: false, placeholderAr: "من سيستفيد؟",                     placeholderEn: "Who will benefit?" },
    { name: "resources",   labelAr: "الموارد المطلوبة",       labelEn: "Required Resources",    type: "textarea", required: false, placeholderAr: "الموارد البشرية أو المادية المطلوبة؟", placeholderEn: "Human or material resources needed?" },
  ],
  process: [
    { name: "current",   labelAr: "الإجراء الحالي",           labelEn: "Current Procedure",     type: "textarea", required: true,  placeholderAr: "صف الإجراء الحالي...",            placeholderEn: "Describe the current procedure..." },
    { name: "proposed",  labelAr: "التغيير المقترح",          labelEn: "Proposed Change",       type: "textarea", required: true,  placeholderAr: "ما الإجراء البديل الذي تقترحه؟",  placeholderEn: "What alternative procedure do you propose?" },
    { name: "rationale", labelAr: "مبرر التغيير",             labelEn: "Rationale",             type: "textarea", required: false, placeholderAr: "لماذا هذا التغيير ضروري؟",        placeholderEn: "Why is this change necessary?" },
  ],
  feedback: [
    { name: "area",           labelAr: "المجال",              labelEn: "Area",                  type: "text",     required: true,  placeholderAr: "مثال: التواصل الداخلي، الأداء...", placeholderEn: "e.g. Internal communication, performance..." },
    { name: "details",        labelAr: "التفاصيل",            labelEn: "Details",               type: "textarea", required: true,  placeholderAr: "شارك ملاحظاتك بشكل مفصّل...",    placeholderEn: "Share your observations in detail..." },
    { name: "recommendation", labelAr: "التوصية",             labelEn: "Recommendation",        type: "textarea", required: false, placeholderAr: "ما الذي توصي به؟",                placeholderEn: "What do you recommend?" },
  ],
};

function buildTextFromFields(category: SuggestionCategory, values: Record<string, string>, isEn: boolean): string {
  const fields = TYPE_FIELDS[category];
  return fields
    .filter(f => values[f.name]?.trim())
    .map(f => `${isEn ? f.labelEn : f.labelAr}:\n${values[f.name].trim()}`)
    .join("\n\n");
}

function TypedFields({ category, isEn }: { category: SuggestionCategory; isEn: boolean }) {
  const fields = TYPE_FIELDS[category];
  return (
    <>
      {fields.map(f => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>
            {isEn ? f.labelEn : f.labelAr}
            {f.required && <span className="text-destructive ms-1">*</span>}
          </Label>
          {f.type === "textarea" ? (
            <Textarea
              id={f.name}
              name={f.name}
              required={f.required}
              rows={3}
              placeholder={isEn ? f.placeholderEn : f.placeholderAr}
              className="resize-none"
            />
          ) : (
            <Input id={f.name} name={f.name} required={f.required} placeholder={isEn ? f.placeholderEn : f.placeholderAr} />
          )}
        </div>
      ))}
    </>
  );
}

export default function Suggestions() {
  const { user, canManage } = useUser();
  const { t, locale } = useLocale();
  const isEn = locale === "en";
  const dateFnsLocale = isEn ? enUS : ar;

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
        toast({ title: t.suggestions.submittedSuccess });
      }
    }
  });

  const updateMutation = useUpdateSuggestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey() });
        setFeedbackDialogId(null);
        toast({ title: t.suggestions.statusUpdated });
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
    const text = buildTextFromFields(selectedCategory, values, isEn);
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
    const s = t.suggestions.statuses;
    switch (status) {
      case 'new':          return { label: s.new,          color: "bg-blue-100 text-blue-800",   icon: FileText };
      case 'under_review': return { label: s.under_review, color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case 'accepted':     return { label: s.accepted,     color: "bg-green-100 text-green-800",  icon: CheckCircle };
      case 'rejected':     return { label: s.rejected,     color: "bg-red-100 text-red-800",      icon: XCircle };
      case 'implemented':  return { label: s.implemented,  color: "bg-teal-100 text-teal-800",    icon: Settings };
      default:             return { label: status,         color: "bg-gray-100 text-gray-800",    icon: FileText };
    }
  };

  const SUGGESTION_TYPES = [
    { value: "improvement" as SuggestionCategory, label: t.suggestions.types.improvement },
    { value: "initiative"  as SuggestionCategory, label: t.suggestions.types.initiative },
    { value: "process"     as SuggestionCategory, label: t.suggestions.types.process },
    { value: "feedback"    as SuggestionCategory, label: t.suggestions.types.feedback },
  ];

  const getCategoryLabel = (cat: string) => SUGGESTION_TYPES.find(x => x.value === cat)?.label ?? cat;

  const canCreate = !canManage || user.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            {t.suggestions.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.suggestions.subtitle}</p>
        </div>

        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setSelectedCategory("improvement"); setAttachmentName(""); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 me-2" />
                {t.suggestions.submit}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.suggestions.submitTitle}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>{t.suggestions.typeLabel} <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v as SuggestionCategory)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.suggestions.typeRequired} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUGGESTION_TYPES.map(tp => (
                        <SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <TypedFields category={selectedCategory} isEn={isEn} />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4" />
                    {t.suggestions.attachmentOptional}
                  </Label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="suggestion-file-upload"
                      className="cursor-pointer flex-1 flex items-center gap-2 border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 shrink-0" />
                      {attachmentName ? (
                        <span className="text-foreground font-medium truncate">{attachmentName}</span>
                      ) : (
                        <span>{t.suggestions.attachmentHint}</span>
                      )}
                    </label>
                    <input
                      id="suggestion-file-upload"
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
                        {t.suggestions.remove}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t.suggestions.cancel}</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t.suggestions.sending : t.suggestions.send}
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
            <TabsTrigger value="all">{t.suggestions.tabAll}</TabsTrigger>
            <TabsTrigger value="mine">{t.suggestions.tabMine}</TabsTrigger>
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
            <h3 className="text-lg font-medium text-muted-foreground">{t.suggestions.noSuggestions}</h3>
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
                      <p className="text-xs font-semibold text-secondary-foreground mb-1">{t.suggestions.managerReply}</p>
                      <p className="text-sm text-foreground/80">{suggestion.feedback}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-3 flex justify-between items-center text-xs text-muted-foreground bg-muted/10 border-t mt-auto">
                  <div className="font-medium text-foreground">{suggestion.userName}</div>
                  <div className="flex items-center gap-4">
                    <span>{format(new Date(suggestion.date), 'dd MMM yyyy', { locale: dateFnsLocale })}</span>

                    {canManage && (
                      <Dialog open={feedbackDialogId === suggestion.id} onOpenChange={(open) => setFeedbackDialogId(open ? suggestion.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-primary hover:bg-primary/10">
                            {t.suggestions.updateStatus}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t.suggestions.updateStatusTitle}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => handleFeedback(e, suggestion.id)} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>{t.suggestions.statusLabel}</Label>
                              <Select name="status" required defaultValue={suggestion.status}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">{t.suggestions.statuses.new}</SelectItem>
                                  <SelectItem value="under_review">{t.suggestions.statuses.under_review}</SelectItem>
                                  <SelectItem value="accepted">{t.suggestions.statuses.accepted}</SelectItem>
                                  <SelectItem value="rejected">{t.suggestions.statuses.rejected}</SelectItem>
                                  <SelectItem value="implemented">{t.suggestions.statuses.implemented}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t.suggestions.feedbackLabel}</Label>
                              <Textarea name="feedback" rows={4} defaultValue={suggestion.feedback || ""} placeholder={t.suggestions.feedbackPlaceholder} />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setFeedbackDialogId(null)}>{t.suggestions.cancel}</Button>
                              <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? t.suggestions.saving : t.suggestions.saveUpdate}
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
