import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import {
  useListAnnouncements, useDeleteAnnouncement,
  getListAnnouncementsQueryKey, AnnouncementCategory
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone, Plus, Archive, ArchiveRestore, MoreVertical,
  Pencil, Copy, Trash2, RotateCcw, RefreshCw, ImagePlus, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const MAX_FLYER_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FLYER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Announcement = {
  id: number;
  title: string;
  body: string;
  category: string;
  date: string;
  authorId: number;
  authorName: string;
  archived: boolean;
  flyerPath: string | null;
  flyerName: string | null;
  flyerMimeType: string | null;
  flyerSize: number | null;
};

type DialogMode = "create" | "edit" | "copy" | "reuse" | null;

function flyerUrl(flyerPath: string) {
  return flyerPath.startsWith("http") ? flyerPath : `${BASE}${flyerPath}`;
}

export default function Announcements() {
  const { user, canManage } = useUser();
  const { t, lang } = useLocale();
  const [tab, setTab] = useState("active");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Announcement | null>(null);
  const [search, setSearch] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCategory, setFormCategory] = useState<string>("announcement");
  const [formFlyer, setFormFlyer] = useState<File | null>(null);
  const [existingFlyerPath, setExistingFlyerPath] = useState<string | null>(null);
  const [removeFlyer, setRemoveFlyer] = useState(false);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const flyerInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateLocale = lang === "ar" ? ar : enUS;

  const { data: announcements, isLoading } = useListAnnouncements({ archived: tab === "archived" });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey({ archived: true }) });
    queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey({ archived: false }) });
  };

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteTarget(null); toast({ title: lang === "ar" ? "تم حذف الإعلان" : "Announcement deleted", variant: "destructive" }); }
    }
  });

  const openDialog = (mode: DialogMode, item?: Announcement) => {
    setDialogMode(mode);
    setSelectedItem(item || null);
    setFormFlyer(null);
    setFlyerError(null);
    setRemoveFlyer(false);
    if (item && (mode === "edit" || mode === "copy" || mode === "reuse")) {
      setFormTitle(mode === "edit" ? item.title : `${item.title}${mode === "copy" ? (lang === "ar" ? " — نسخة" : " — Copy") : ""}`);
      setFormBody(item.body);
      setFormCategory(item.category);
      setExistingFlyerPath(item.flyerPath);
    } else {
      setFormTitle("");
      setFormBody("");
      setFormCategory("announcement");
      setExistingFlyerPath(null);
    }
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedItem(null);
    setFormFlyer(null);
    setExistingFlyerPath(null);
    setRemoveFlyer(false);
    setFlyerError(null);
  };

  useEffect(() => {
    if (!formFlyer) {
      setFlyerPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(formFlyer);
    setFlyerPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [formFlyer]);

  const handleFlyerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_FLYER_TYPES.includes(file.type)) {
      setFlyerError(lang === "ar" ? "يُسمح برفع صور JPEG أو PNG أو WebP أو GIF فقط." : "Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }
    if (file.size > MAX_FLYER_SIZE) {
      setFlyerError(lang === "ar" ? "يجب ألا يتجاوز حجم الفلاير 10 ميجابايت." : "Flyer image must not exceed 10 MB.");
      return;
    }

    setFlyerError(null);
    setFormFlyer(file);
    setExistingFlyerPath(null);
    setRemoveFlyer(false);
  };

  const clearFlyer = () => {
    setFormFlyer(null);
    setFlyerError(null);
    if (existingFlyerPath) {
      setExistingFlyerPath(null);
      setRemoveFlyer(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogMode) return;

    setIsSaving(true);
    setFlyerError(null);
    try {
      const isEdit = dialogMode === "edit" && selectedItem;
      const data: Record<string, unknown> = {
        title: formTitle,
        body: formBody,
        category: formCategory as AnnouncementCategory,
      };

      if (isEdit) {
        if (removeFlyer) data.removeFlyer = true;
      } else {
        if (existingFlyerPath && !removeFlyer) data.flyerPath = existingFlyerPath;
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      if (formFlyer) formData.append("flyer", formFlyer);

      const response = await fetch(
        `${BASE}/api/announcements${isEdit ? `/${selectedItem.id}` : ""}`,
        { method: isEdit ? "PATCH" : "POST", body: formData, credentials: "include" },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorData?.error || (lang === "ar" ? "تعذر حفظ الإعلان." : "Unable to save announcement."));
      }

      invalidate();
      closeDialog();
      toast({ title: lang === "ar" ? (isEdit ? "تم تحديث الإعلان" : "تم نشر الإعلان") : (isEdit ? "Announcement updated" : "Announcement published") });
    } catch (error) {
      setFlyerError(error instanceof Error ? error.message : (lang === "ar" ? "تعذر حفظ الإعلان." : "Unable to save announcement."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = (item: Announcement) => {
    void updateAnnouncementStatus(item, true);
  };

  const handleReactivate = (item: Announcement) => {
    void updateAnnouncementStatus(item, false);
  };

  const updateAnnouncementStatus = async (item: Announcement, archived: boolean) => {
    setIsStatusUpdating(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ archived }));
      const response = await fetch(`${BASE}/api/announcements/${item.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorData?.error || (lang === "ar" ? "تعذر تحديث الإعلان." : "Unable to update announcement."));
      }
      invalidate();
      setArchiveTarget(null);
      toast({ title: lang === "ar" ? (archived ? "تم أرشفة الإعلان" : "تم إعادة تفعيل الإعلان") : (archived ? "Announcement archived" : "Announcement reactivated") });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : (lang === "ar" ? "تعذر تحديث الإعلان." : "Unable to update announcement."),
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'announcement': return "bg-blue-50 text-blue-700 border-blue-200";
      case 'update': return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 'circular': return "bg-amber-50 text-amber-700 border-amber-200";
      case 'deadline': return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const cats = t.announcements.categories;
  const catLabel = (c: string) => ({ announcement: cats.announcement, update: cats.update, circular: cats.circular, deadline: cats.deadline }[c] || c);

  const filtered = (announcements || []).filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.body.toLowerCase().includes(search.toLowerCase())
  );

  const dialogTitle = {
    create: t.announcements.createTitle,
    edit: t.announcements.editTitle,
    copy: t.announcements.copyTitle,
    reuse: t.announcements.copyTitle,
  }[dialogMode!] || "";

  const submitLabel = dialogMode === "edit" ? t.announcements.update : (dialogMode === "copy" || dialogMode === "reuse") ? t.announcements.publishCopy : t.announcements.publish;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-secondary" />
            {t.announcements.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.announcements.subtitle}</p>
        </div>
        {canManage && (
          <Button onClick={() => openDialog("create")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Plus className="w-4 h-4" />
            {t.announcements.new}
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-card p-2 rounded-xl border">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-9">
            <TabsTrigger value="active" className="text-xs px-4">{t.announcements.tabActive}</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-4">{t.announcements.tabArchived}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder={t.announcements.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background w-full sm:w-60 h-9 text-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 bg-card rounded-xl border border-dashed">
            <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-medium text-muted-foreground">{tab === "archived" ? t.announcements.noArchived : t.announcements.noActive}</h3>
          </div>
        ) : filtered.map((ann) => (
          <Card key={ann.id} className="overflow-hidden hover:shadow-md transition-all border">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${getCategoryVariant(ann.category)}`}>
                      {catLabel(ann.category)}
                    </Badge>
                    {ann.archived && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Archive className="w-3 h-3" />{t.announcements.archived}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ann.date), 'dd MMM yyyy', { locale: dateLocale })}
                    </span>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {!ann.archived && (
                            <DropdownMenuItem onClick={() => openDialog("edit", ann)} className="gap-2 text-sm">
                              <Pencil className="w-3.5 h-3.5" />{t.announcements.actions.edit}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openDialog("copy", ann)} className="gap-2 text-sm">
                            <Copy className="w-3.5 h-3.5" />{t.announcements.actions.copy}
                          </DropdownMenuItem>
                          {ann.archived ? (
                            <>
                              <DropdownMenuItem onClick={() => handleReactivate(ann)} className="gap-2 text-sm">
                                <RotateCcw className="w-3.5 h-3.5" />{t.announcements.actions.reactivate}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDialog("reuse", ann)} className="gap-2 text-sm">
                                <RefreshCw className="w-3.5 h-3.5" />{t.announcements.actions.reuse}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => setArchiveTarget(ann)} className="gap-2 text-sm">
                              <Archive className="w-3.5 h-3.5" />{t.announcements.actions.archive}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(ann)}
                            className="gap-2 text-sm text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />{t.announcements.actions.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-primary mb-2 leading-snug">{ann.title}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{ann.body}</p>
                {ann.flyerPath && (
                  <a
                    href={flyerUrl(ann.flyerPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-4 rounded-xl overflow-hidden border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring"
                    title={lang === "ar" ? "فتح الفلاير بحجم أكبر" : "Open flyer in full size"}
                  >
                    <img
                      src={flyerUrl(ann.flyerPath)}
                      alt={ann.flyerName || `${ann.title} flyer`}
                      className="w-full max-h-[480px] object-contain bg-background"
                      loading="lazy"
                    />
                  </a>
                )}

                <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t.common.author}: <span className="font-medium text-foreground">{ann.authorName}</span></span>
                  {!canManage && ann.archived && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <ArchiveRestore className="w-3 h-3" />{t.announcements.archived}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit / Copy dialog */}
      <Dialog open={!!dialogMode} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">{t.announcements.announcementTitle}</Label>
              <Input
                id="ann-title"
                required
                placeholder={t.announcements.titlePlaceholder}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.common.category}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">{cats.announcement}</SelectItem>
                  <SelectItem value="update">{cats.update}</SelectItem>
                  <SelectItem value="circular">{cats.circular}</SelectItem>
                  <SelectItem value="deadline">{cats.deadline}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">{t.announcements.body}</Label>
              <Textarea
                id="ann-body"
                required
                rows={5}
                placeholder={t.announcements.bodyPlaceholder}
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="ann-flyer">{lang === "ar" ? "فلاير الإعلان (اختياري)" : "Announcement Flyer (optional)"}</Label>
                <span className="text-[11px] text-muted-foreground">
                  {lang === "ar" ? "JPEG، PNG، WebP أو GIF — حتى 10 MB" : "JPEG, PNG, WebP, or GIF — up to 10 MB"}
                </span>
              </div>
              <input
                ref={flyerInputRef}
                id="ann-flyer"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFlyerChange}
              />
              {flyerPreview || (!removeFlyer && existingFlyerPath) ? (
                <div className="relative overflow-hidden rounded-lg border bg-muted/20">
                  <img
                    src={flyerPreview || flyerUrl(existingFlyerPath!)}
                    alt={formFlyer?.name || selectedItem?.flyerName || (lang === "ar" ? "معاينة الفلاير" : "Flyer preview")}
                    className="h-44 w-full object-contain bg-background"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 end-2 h-8 w-8 shadow-sm"
                    onClick={clearFlyer}
                    title={lang === "ar" ? "إزالة الفلاير" : "Remove flyer"}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed gap-2 text-muted-foreground hover:text-primary"
                  onClick={() => flyerInputRef.current?.click()}
                >
                  <ImagePlus className="w-5 h-5" />
                  {lang === "ar" ? "اختر صورة فلاير" : "Choose flyer image"}
                </Button>
              )}
              {flyerError && <p className="text-xs text-destructive">{flyerError}</p>}
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>{t.common.cancel}</Button>
              <Button type="submit" disabled={isSaving || isStatusUpdating}>
                {(isSaving || isStatusUpdating) ? t.common.loading : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.announcements.actions.archive}</AlertDialogTitle>
            <AlertDialogDescription>{t.announcements.archiveConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => archiveTarget && handleArchive(archiveTarget)}>
              {t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.announcements.actions.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar" ? "سيتم حذف هذا الإعلان نهائياً ولا يمكن التراجع عن هذا الإجراء." : "This announcement will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
