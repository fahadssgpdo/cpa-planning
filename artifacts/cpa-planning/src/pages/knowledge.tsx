import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import {
  useListDocuments, useCreateDocument, useDeleteDocument,
  getListDocumentsQueryKey, DocumentCategory,
  useListGlossary, useCreateGlossaryEntry, useDeleteGlossaryEntry,
  getListGlossaryQueryKey,
  useListFaqs, useCreateFaq, useDeleteFaq,
  getListFaqsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BookOpen, Plus, Download, FileText, Trash2, Lock, Paperclip,
  BookMarked, HelpCircle, FileSpreadsheet, BarChart3, CalendarDays,
  ShieldCheck, BarChart2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type MainTab = "glossary" | "faqs" | "templates" | "guides" | "kpi" | "annual-plans" | "policies" | "reports";
type GuidesSubTab = "operational" | "reference";

function getTabCategory(tab: MainTab, guidesSubTab: GuidesSubTab): DocumentCategory | null {
  switch (tab) {
    case "templates":     return "templates";
    case "guides":        return guidesSubTab === "operational" ? "guidelines" : "manuals";
    case "kpi":           return "kpi";
    case "annual-plans":  return "annual-plans";
    case "policies":      return "policies";
    case "reports":       return "reports";
    default:              return null;
  }
}

const TAB_ICONS: Record<MainTab, React.ReactNode> = {
  glossary:      <BookMarked    className="w-4 h-4" />,
  faqs:          <HelpCircle    className="w-4 h-4" />,
  templates:     <FileSpreadsheet className="w-4 h-4" />,
  guides:        <BookOpen      className="w-4 h-4" />,
  kpi:           <BarChart3     className="w-4 h-4" />,
  "annual-plans":<CalendarDays  className="w-4 h-4" />,
  policies:      <ShieldCheck   className="w-4 h-4" />,
  reports:       <BarChart2     className="w-4 h-4" />,
};

export default function KnowledgeBase() {
  const { canCloseInquiry, canManage } = useUser();
  const { t, lang } = useLocale();
  const k = t.knowledge;

  const [mainTab, setMainTab] = useState<MainTab>("glossary");
  const [guidesSubTab, setGuidesSubTab] = useState<GuidesSubTab>("operational");
  const [isDocDialogOpen, setIsDocDialogOpen]       = useState(false);
  const [isGlossaryDialogOpen, setIsGlossaryDialogOpen] = useState(false);
  const [isFaqDialogOpen, setIsFaqDialogOpen]       = useState(false);
  const [search, setSearch]                         = useState("");
  const [attachmentName, setAttachmentName]         = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const activeCategory = getTabCategory(mainTab, guidesSubTab);

  /* ── Documents ── */
  const docQueryParams = activeCategory ? { category: activeCategory } : {};
  const { data: documents, isLoading: docsLoading } = useListDocuments(docQueryParams, {
    query: { queryKey: getListDocumentsQueryKey(docQueryParams) }
  });

  const createDocMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setIsDocDialogOpen(false);
        setAttachmentName("");
        toast({ title: k.addedSuccess });
      }
    }
  });

  const deleteDocMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: k.deletedSuccess });
      }
    }
  });

  /* ── Glossary ── */
  const { data: glossaryEntries, isLoading: glossaryLoading } = useListGlossary({
    query: { queryKey: getListGlossaryQueryKey() }
  });
  const createGlossaryMutation = useCreateGlossaryEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGlossaryQueryKey() });
        setIsGlossaryDialogOpen(false);
        toast({ title: t.glossary.addedSuccess });
      }
    }
  });
  const deleteGlossaryMutation = useDeleteGlossaryEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGlossaryQueryKey() });
        toast({ title: t.glossary.deletedSuccess });
      }
    }
  });

  /* ── FAQs ── */
  const { data: faqs, isLoading: faqsLoading } = useListFaqs({
    query: { queryKey: getListFaqsQueryKey() }
  });
  const createFaqMutation = useCreateFaq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() });
        setIsFaqDialogOpen(false);
        toast({ title: t.faq.addedSuccess });
      }
    }
  });
  const deleteFaqMutation = useDeleteFaq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() });
        toast({ title: t.faq.deletedSuccess });
      }
    }
  });

  /* ── Handlers ── */
  const handleCreateDoc = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const externalUrl = (fd.get("fileUrl") as string)?.trim();
    createDocMutation.mutate({
      data: {
        name: fd.get("name") as string,
        description: fd.get("description") as string,
        category: (activeCategory ?? "other") as DocumentCategory,
        fileUrl: externalUrl || attachmentName || "https://example.com/doc.pdf",
      }
    });
  };

  const handleCreateGlossary = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createGlossaryMutation.mutate({
      data: {
        termAr:     fd.get("termAr") as string,
        termEn:     (fd.get("termEn") as string) || undefined,
        definition: fd.get("definition") as string,
        examples:   (fd.get("examples") as string) || undefined,
      }
    });
  };

  const handleCreateFaq = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createFaqMutation.mutate({
      data: {
        question: fd.get("question") as string,
        answer:   fd.get("answer") as string,
      }
    });
  };

  /* ── Filtered lists ── */
  const q = search.toLowerCase();
  const filteredDocs = (documents ?? []).filter(d =>
    d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
  );
  const filteredGlossary = (glossaryEntries ?? []).filter(g =>
    g.termAr.toLowerCase().includes(q) ||
    (g.termEn?.toLowerCase() ?? "").includes(q) ||
    g.definition.toLowerCase().includes(q)
  );
  const filteredFaqs = (faqs ?? []).filter(f =>
    f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
  );

  /* ── Page header labels ── */
  const tabs: { id: MainTab; label: string }[] = [
    { id: "glossary",     label: k.tabs.glossary },
    { id: "faqs",         label: k.tabs.faqs },
    { id: "templates",    label: k.tabs.templates },
    { id: "guides",       label: k.tabs.guides },
    { id: "kpi",          label: k.tabs.kpi },
    { id: "annual-plans", label: k.tabs.annualPlans },
    { id: "policies",     label: k.tabs.policies },
    { id: "reports",      label: k.tabs.reports },
  ];

  const currentTabLabel = tabs.find(t => t.id === mainTab)?.label ?? "";

  /* ── Guides sub-tab label for header ── */
  const guidesSubLabel = guidesSubTab === "operational" ? k.tabs.guidesOperational : k.tabs.guidesReference;
  const pageTitle = mainTab === "guides"
    ? `${k.tabs.guides} — ${guidesSubLabel}`
    : currentTabLabel;

  const isDocTab = !["glossary", "faqs"].includes(mainTab);
  const canAddDoc   = canCloseInquiry;
  const canAddGlossary = canCloseInquiry;
  const canAddFaq   = canManage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">{k.subtitle}</p>
        </div>

        {/* Add button */}
        {isDocTab && canAddDoc ? (
          <Dialog open={isDocDialogOpen} onOpenChange={(o) => { setIsDocDialogOpen(o); if (!o) setAttachmentName(""); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 me-2" />
                {k.addDoc}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>
                  {k.addDocIn} {mainTab === "guides" ? guidesSubLabel : currentTabLabel}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDoc} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{k.docName}</Label>
                  <Input id="name" name="name" required placeholder={k.docNamePlaceholder} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4" />
                    {k.attachment}
                  </Label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="doc-file-upload"
                      className="cursor-pointer flex-1 flex items-center gap-2 border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 shrink-0" />
                      {attachmentName ? (
                        <span className="text-foreground font-medium truncate">{attachmentName}</span>
                      ) : (
                        <span>{k.attachmentHint}</span>
                      )}
                    </label>
                    <input
                      id="doc-file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                      onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? "")}
                    />
                    {attachmentName && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => setAttachmentName("")}>
                        {k.removeAttachment}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">{k.externalLink}</Label>
                  <Input id="fileUrl" name="fileUrl" type="url" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{k.description}</Label>
                  <Textarea id="description" name="description" required rows={3} placeholder={k.descriptionPlaceholder} />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDocDialogOpen(false)}>{t.common.cancel}</Button>
                  <Button type="submit" disabled={createDocMutation.isPending}>
                    {createDocMutation.isPending ? k.saving : k.save}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : mainTab === "glossary" && canAddGlossary ? (
          <Dialog open={isGlossaryDialogOpen} onOpenChange={setIsGlossaryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 me-2" />
                {t.glossary.addEntry}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader><DialogTitle>{t.glossary.addTitle}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateGlossary} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="termAr">{t.glossary.termAr} <span className="text-destructive">*</span></Label>
                  <Input id="termAr" name="termAr" required placeholder={t.glossary.termArPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termEn">{t.glossary.termEn}</Label>
                  <Input id="termEn" name="termEn" placeholder={t.glossary.termEnPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="definition">{t.glossary.definition} <span className="text-destructive">*</span></Label>
                  <Textarea id="definition" name="definition" required rows={3} placeholder={t.glossary.definitionPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examples">{t.glossary.examples}</Label>
                  <Textarea id="examples" name="examples" rows={2} placeholder={t.glossary.examplesPlaceholder} />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsGlossaryDialogOpen(false)}>{t.common.cancel}</Button>
                  <Button type="submit" disabled={createGlossaryMutation.isPending}>
                    {createGlossaryMutation.isPending ? t.glossary.saving : t.glossary.save}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : mainTab === "faqs" && canAddFaq ? (
          <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 me-2" />
                {t.faq.addQuestion}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader><DialogTitle>{t.faq.addTitle}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateFaq} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="faq-question">{t.faq.questionLabel} <span className="text-destructive">*</span></Label>
                  <Textarea id="faq-question" name="question" required rows={2} placeholder={t.faq.questionLabel + "..."} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-answer">{t.faq.answerLabel} <span className="text-destructive">*</span></Label>
                  <Textarea id="faq-answer" name="answer" required rows={4} placeholder={t.faq.answerLabel + "..."} />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFaqDialogOpen(false)}>{t.faq.cancel}</Button>
                  <Button type="submit" disabled={createFaqMutation.isPending}>
                    {createFaqMutation.isPending ? t.faq.saving : t.faq.save}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border rounded-lg px-3 py-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{k.restrictedNotice}</span>
          </div>
        )}
      </div>

      {/* ── Main tab bar (scrollable) ── */}
      <div className="overflow-x-auto">
        <div className="flex gap-0 border-b min-w-max">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setMainTab(id); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                mainTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_ICONS[id]}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Guides sub-tab bar ── */}
      {mainTab === "guides" && (
        <div className="flex gap-2 bg-muted/40 border rounded-lg p-1 w-fit">
          {(["operational", "reference"] as GuidesSubTab[]).map((sub) => {
            const label = sub === "operational" ? k.tabs.guidesOperational : k.tabs.guidesReference;
            return (
              <button
                key={sub}
                onClick={() => { setGuidesSubTab(sub); setSearch(""); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  guidesSubTab === sub
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Search bar ── */}
      <Input
        placeholder={k.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-background max-w-md"
      />

      {/* ══ GLOSSARY TAB ══ */}
      {mainTab === "glossary" && (
        <div className="space-y-3">
          {glossaryLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : filteredGlossary.length === 0 ? (
            <EmptyState icon={<BookMarked className="w-12 h-12" />} message={t.glossary.noEntries} />
          ) : (
            filteredGlossary.map((entry) => (
              <Card key={entry.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-base text-primary">{entry.termAr}</h4>
                        {entry.termEn && (
                          <span className="text-sm text-muted-foreground font-medium border-s ps-3">{entry.termEn}</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed mb-2">{entry.definition}</p>
                      {entry.examples && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border-s-2 border-primary/30">
                          {entry.examples}
                        </div>
                      )}
                    </div>
                    {canCloseInquiry && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={() => deleteGlossaryMutation.mutate({ id: entry.id })} title={t.common.delete}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ══ FAQs TAB ══ */}
      {mainTab === "faqs" && (
        <div className="space-y-3">
          {faqsLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : filteredFaqs.length === 0 ? (
            <EmptyState icon={<HelpCircle className="w-12 h-12" />} message={t.faq.noFaqs} />
          ) : (
            filteredFaqs.map((faq, idx) => (
              <Card key={faq.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base text-foreground leading-snug mb-2">{faq.question}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                    {canManage && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={() => deleteFaqMutation.mutate({ id: faq.id })} title={t.common.delete}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ══ DOCUMENT TABS (templates, guides, kpi, annual-plans, policies, reports) ══ */}
      {isDocTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docsLoading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={<FileText className="w-12 h-12" />} message={k.noDocuments} />
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
                    <div className="flex items-center justify-end mt-auto">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary" asChild>
                          <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" title={lang === "ar" ? "تنزيل" : "Download"}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        {canCloseInquiry && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteDocMutation.mutate({ id: doc.id })} title={t.common.delete}>
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
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12 bg-card rounded-xl border border-dashed">
      <div className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3">{icon}</div>
      <h3 className="text-lg font-medium text-muted-foreground">{message}</h3>
    </div>
  );
}
