import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import { 
  useListDocuments, useCreateDocument, useDeleteDocument,
  getListDocumentsQueryKey, DocumentCategory 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { BookOpen, Plus, Download, FileText, Trash2, Lock, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeBase() {
  const { canCloseInquiry } = useUser();
  const { t } = useLocale();
  const [tab, setTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const CATEGORIES = [
    { id: "all",       label: t.knowledge.categories.all },
    { id: "manuals",   label: t.knowledge.categories.manuals },
    { id: "guidelines",label: t.knowledge.categories.guidelines },
    { id: "kpi",       label: t.knowledge.categories.kpi },
    { id: "policies",  label: t.knowledge.categories.policies },
    { id: "templates", label: t.knowledge.categories.templates },
    { id: "other",     label: t.knowledge.categories.other },
  ];

  const queryParams = tab === "all" ? {} : { category: tab };
  const { data: documents, isLoading } = useListDocuments(queryParams, {
    query: { queryKey: getListDocumentsQueryKey(queryParams) }
  });
  
  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setIsDialogOpen(false);
        setAttachmentName("");
        toast({ title: t.knowledge.addedSuccess });
      }
    }
  });

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: t.knowledge.deletedSuccess });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const externalUrl = (formData.get("fileUrl") as string)?.trim();
    createMutation.mutate({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as DocumentCategory,
        fileUrl: externalUrl || attachmentName || "https://example.com/doc.pdf",
      }
    });
  };

  const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.id === cat)?.label || cat;

  const filteredDocs = documents?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {t.knowledge.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.knowledge.subtitle}</p>
        </div>
        
        {canCloseInquiry ? (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setAttachmentName(""); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 me-2" />
                {t.knowledge.addDoc}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>{t.knowledge.addDocTitle}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.knowledge.docName}</Label>
                  <Input id="name" name="name" required placeholder={t.knowledge.docNamePlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t.knowledge.classification}</Label>
                  <Select name="category" required defaultValue="manuals">
                    <SelectTrigger>
                      <SelectValue placeholder={t.knowledge.classificationPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4" />
                    {t.knowledge.attachment}
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
                        <span>{t.knowledge.attachmentHint}</span>
                      )}
                    </label>
                    <input
                      id="doc-file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
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
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => setAttachmentName("")}
                      >
                        {t.knowledge.removeAttachment}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileUrl">{t.knowledge.externalLink}</Label>
                  <Input id="fileUrl" name="fileUrl" type="url" placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t.knowledge.description}</Label>
                  <Textarea id="description" name="description" required rows={3} placeholder={t.knowledge.descriptionPlaceholder} />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t.common.cancel}</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t.knowledge.saving : t.knowledge.save}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border rounded-lg px-3 py-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{t.knowledge.restrictedNotice}</span>
          </div>
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
          placeholder={t.knowledge.searchPlaceholder}
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
            <h3 className="text-lg font-medium text-muted-foreground">{t.knowledge.noDocuments}</h3>
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
                        <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" title="Download">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      {canCloseInquiry && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: doc.id })}
                          title={t.common.delete}
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
