import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import {
  useListInquiries, useCreateInquiry, useUpdateInquiry,
  getListInquiriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  HelpCircle, Plus, Send, CheckCircle2, Pencil, X, Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "open" | "answered" | "resolved";

export default function Inquiries() {
  const { user, canManage, canCloseInquiry } = useUser();
  const { t, locale } = useLocale();
  const dateFnsLocale = locale === "ar" ? ar : enUS;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /* ── UI state ── */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [editReplyId, setEditReplyId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");

  /* ── Data ── */
  const queryParams = ownerFilter === "mine" ? { userId: user.id } : {};
  const { data: inquiries, isLoading } = useListInquiries(queryParams, {
    query: { queryKey: getListInquiriesQueryKey(queryParams) },
  });

  const createMutation = useCreateInquiry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
        setCreateOpen(false);
        toast({ title: locale === "ar" ? "تم إرسال استفسارك بنجاح" : "Inquiry submitted successfully" });
      },
    },
  });

  const updateMutation = useUpdateInquiry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
        setReplyOpenId(null);
        setEditReplyId(null);
        toast({ title: locale === "ar" ? "تم تحديث الاستفسار" : "Inquiry updated" });
      },
    },
  });

  /* ── Handlers ── */
  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        subject: fd.get("subject") as string,
        details: fd.get("details") as string,
        userId: user.id,
      },
    });
  }

  function handleReply(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id,
      data: {
        response: fd.get("response") as string,
        responderId: user.id,
        status: "answered",
      },
    });
  }

  function handleEditReply(id: number) {
    updateMutation.mutate({
      id,
      data: { response: editReplyText },
    });
  }

  function handleClose(id: number) {
    updateMutation.mutate({ id, data: { status: "resolved" } });
  }

  /* ── Filtering ── */
  const filtered = (inquiries ?? []).filter((inq) => {
    if (statusFilter !== "all" && inq.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!inq.subject.toLowerCase().includes(q) && !inq.details.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Status badge ── */
  function statusBadge(status: string) {
    if (status === "open")
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">{locale === "ar" ? "مفتوح" : "Open"}</Badge>;
    if (status === "answered")
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{locale === "ar" ? "تم الرد" : "Answered"}</Badge>;
    return <Badge className="bg-teal-600 hover:bg-teal-700 text-white">{locale === "ar" ? "مغلق" : "Closed"}</Badge>;
  }

  const statusColor = (status: string) =>
    status === "open" ? "#3b82f6" : status === "answered" ? "#f59e0b" : "#0d9488";

  const STATUS_FILTERS: { key: StatusFilter; ar: string; en: string }[] = [
    { key: "all",      ar: "الكل",     en: "All" },
    { key: "open",     ar: "مفتوح",    en: "Open" },
    { key: "answered", ar: "تم الرد",  en: "Answered" },
    { key: "resolved", ar: "مغلق",     en: "Closed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            {t.nav.inquiries}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === "ar" ? "اطرح استفساراتك وسيقوم المختصون بالرد عليها" : "Submit your inquiries and specialists will respond"}
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 me-2" />
          {locale === "ar" ? "استفسار جديد" : "New Inquiry"}
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card p-3 rounded-lg border">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(({ key, ar: arLabel, en: enLabel }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {locale === "ar" ? arLabel : enLabel}
            </button>
          ))}
          {canManage && (
            <>
              <span className="text-muted-foreground/30 mx-1 self-center">|</span>
              {(["all", "mine"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setOwnerFilter(key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    ownerFilter === key
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {key === "all"
                    ? locale === "ar" ? "كل الاستفسارات" : "All"
                    : locale === "ar" ? "استفساراتي" : "Mine"}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={locale === "ar" ? "بحث في الاستفسارات..." : "Search inquiries..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background ps-9 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {locale === "ar"
            ? `${filtered.length} استفسار`
            : `${filtered.length} inquiry(ies)`}
        </p>
      )}

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {locale === "ar" ? "لا توجد استفسارات" : "No inquiries found"}
            </h3>
          </div>
        ) : (
          filtered.map((inq) => (
            <Card
              key={inq.id}
              className="overflow-hidden border-s-4 cursor-pointer group hover:shadow-md transition-shadow"
              style={{ borderInlineStartColor: statusColor(inq.status) }}
              onClick={() => setViewId(inq.id)}
            >
              <div className="flex flex-col md:flex-row">
                {/* Question side */}
                <div className="flex-1 p-5 border-b md:border-b-0 md:border-e">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h3 className="font-bold text-base text-primary leading-snug">{inq.subject}</h3>
                    {statusBadge(inq.status)}
                  </div>
                  <p className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap leading-relaxed">{inq.details}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium gap-2">
                    <div>
                      <span className="font-semibold text-foreground">{inq.userName}</span>
                      {inq.userDesignation && (
                        <span className="block text-muted-foreground mt-0.5">{inq.userDesignation}</span>
                      )}
                    </div>
                    <span className="shrink-0">
                      {format(new Date(inq.date), "dd MMM yyyy", { locale: dateFnsLocale })}
                    </span>
                  </div>
                </div>

                {/* Response side */}
                <div className="flex-1 p-5 bg-muted/30">
                  {inq.response ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-secondary-foreground">
                          {locale === "ar" ? "رد دائرة التخطيط:" : "Planning Dept. Reply:"}
                        </h4>
                        {/* Edit reply — manager/admin only */}
                        {canCloseInquiry && inq.status !== "resolved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditReplyId(inq.id);
                              setEditReplyText(inq.response ?? "");
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {editReplyId === inq.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editReplyText}
                            onChange={(e) => setEditReplyText(e.target.value)}
                            rows={3}
                            className="text-sm bg-background"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setEditReplyId(null); }}
                            >
                              <X className="w-3.5 h-3.5 me-1" />
                              {locale === "ar" ? "إلغاء" : "Cancel"}
                            </Button>
                            <Button
                              size="sm"
                              disabled={updateMutation.isPending}
                              onClick={(e) => { e.stopPropagation(); handleEditReply(inq.id); }}
                            >
                              {locale === "ar" ? "حفظ" : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{inq.response}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                        <span>{locale === "ar" ? `رد بواسطة: ${inq.responderName}` : `Replied by: ${inq.responderName}`}</span>
                        {/* Close — manager/admin only */}
                        {canCloseInquiry && inq.status !== "resolved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            onClick={(e) => { e.stopPropagation(); handleClose(inq.id); }}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                            {locale === "ar" ? "إغلاق" : "Close"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : canManage ? (
                    <div className="h-full flex flex-col justify-center gap-2">
                      <Button
                        variant="outline"
                        className="w-full border-secondary text-secondary-foreground hover:bg-secondary/10"
                        onClick={(e) => { e.stopPropagation(); setReplyOpenId(inq.id); }}
                      >
                        <Send className="w-4 h-4 me-2 rotate-180" />
                        {locale === "ar" ? "إضافة رد" : "Add Reply"}
                      </Button>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic py-4">
                      {locale === "ar" ? "في انتظار الرد من المختصين..." : "Awaiting response from specialists..."}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── View Inquiry Detail Dialog ── */}
      {(() => {
        const inq = (inquiries ?? []).find((i) => i.id === viewId);
        return (
          <Dialog open={viewId !== null} onOpenChange={(open) => !open && setViewId(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
              {inq && (
                <>
                  {/* Header */}
                  <div className="p-5 border-b bg-muted/30 shrink-0"
                       style={{ borderInlineStartWidth: 4, borderInlineStartStyle: "solid", borderInlineStartColor: statusColor(inq.status) }}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {statusBadge(inq.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(inq.date), "dd MMM yyyy", { locale: dateFnsLocale })}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold leading-snug text-primary mb-1">{inq.subject}</h2>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{inq.userName}</span>
                      {inq.userDesignation && <span className="ms-2">· {inq.userDesignation}</span>}
                    </div>
                  </div>

                  {/* Body */}
                  <ScrollArea className="flex-1 p-5">
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          {locale === "ar" ? "تفاصيل الاستفسار" : "Inquiry Details"}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-4 border">
                          {inq.details}
                        </p>
                      </div>

                      {inq.response ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground mb-2">
                            {locale === "ar" ? "رد دائرة التخطيط" : "Planning Dept. Reply"}
                          </p>
                          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{inq.response}</p>
                            {inq.responderName && (
                              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                                {locale === "ar" ? `رد بواسطة: ${inq.responderName}` : `Replied by: ${inq.responderName}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                          {locale === "ar" ? "في انتظار الرد من المختصين..." : "Awaiting response from specialists..."}
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Footer actions */}
                  {(canManage || canCloseInquiry) && inq.status !== "resolved" && (
                    <div className="p-4 border-t bg-background shrink-0 flex gap-2 justify-end flex-wrap">
                      {canManage && !inq.response && (
                        <Button
                          variant="default"
                          onClick={() => { setViewId(null); setReplyOpenId(inq.id); }}
                        >
                          <Send className="w-4 h-4 me-2 rotate-180" />
                          {locale === "ar" ? "إضافة رد" : "Add Reply"}
                        </Button>
                      )}
                      {canCloseInquiry && (
                        <Button
                          variant="outline"
                          className="text-teal-600 border-teal-200 hover:bg-teal-50"
                          onClick={() => { setViewId(null); handleClose(inq.id); }}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 me-1.5" />
                          {locale === "ar" ? "إغلاق الاستفسار" : "Close Inquiry"}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Create Inquiry Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{locale === "ar" ? "إرسال استفسار جديد" : "Submit New Inquiry"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{locale === "ar" ? "موضوع الاستفسار" : "Subject"}</Label>
              <Input name="subject" required placeholder={locale === "ar" ? "مثال: استفسار حول تعميم رقم..." : "e.g. Inquiry about circular no..."} />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "التفاصيل" : "Details"}</Label>
              <Textarea name="details" required rows={5} placeholder={locale === "ar" ? "اكتب تفاصيل استفسارك بوضوح..." : "Describe your inquiry in detail..."} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? (locale === "ar" ? "جاري الإرسال..." : "Sending...")
                  : (locale === "ar" ? "إرسال" : "Submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reply Dialog (officer / manager / admin) ── */}
      <Dialog open={replyOpenId !== null} onOpenChange={(open) => !open && setReplyOpenId(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{locale === "ar" ? "الرد على الاستفسار" : "Reply to Inquiry"}</DialogTitle>
          </DialogHeader>
          {replyOpenId !== null && (() => {
            const inq = (inquiries ?? []).find((i) => i.id === replyOpenId);
            if (!inq) return null;
            return (
              <form onSubmit={(e) => handleReply(e, inq.id)} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "الاستفسار" : "Inquiry"}</Label>
                  <ScrollArea className="max-h-32">
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap leading-relaxed">{inq.details}</div>
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response">{locale === "ar" ? "نص الرد" : "Reply Text"}</Label>
                  <Textarea id="response" name="response" required rows={4} placeholder={locale === "ar" ? "اكتب ردك هنا..." : "Write your reply here..."} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setReplyOpenId(null)}>
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending
                      ? (locale === "ar" ? "جاري الإرسال..." : "Sending...")
                      : (locale === "ar" ? "إرسال الرد" : "Send Reply")}
                  </Button>
                </div>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
