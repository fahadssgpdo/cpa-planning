import { useState, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import {
  useListDiscussions, useCreateDiscussion, useGetDiscussion,
  useUpdateDiscussion, useCreateComment,
  getListDiscussionsQueryKey, getGetDiscussionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthorHoverCard } from "@/components/author-hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessagesSquare, Plus, MessageCircle, MoreVertical,
  Pencil, Lock, Unlock, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ActiveTab = "open" | "closed";

export default function Discussions() {
  const { user, canManage } = useUser();
  const { t, locale } = useLocale();
  const d = t.discussions;
  const dateFnsLocale = locale === "ar" ? ar : enUS;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<ActiveTab>("open");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [replyText, setReplyText] = useState("");

  const replyBoxRef = useRef<HTMLTextAreaElement>(null);

  const { data: discussions, isLoading } = useListDiscussions();

  const { data: viewDiscussion, isLoading: viewLoading } = useGetDiscussion(
    selectedId ?? 0,
    {
      query: {
        enabled: !!selectedId && viewOpen,
        queryKey: getGetDiscussionQueryKey(selectedId ?? 0),
      },
    }
  );

  const createMutation = useCreateDiscussion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey() });
        setCreateOpen(false);
        toast({ title: locale === "ar" ? "تم إنشاء النقاش بنجاح" : "Discussion created" });
      },
    },
  });

  const updateMutation = useUpdateDiscussion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey() });
        if (selectedId) queryClient.invalidateQueries({ queryKey: getGetDiscussionQueryKey(selectedId) });
        setEditOpen(false);
        toast({ title: locale === "ar" ? "تم تحديث النقاش" : "Discussion updated" });
      },
    },
  });

  const commentMutation = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDiscussionQueryKey(selectedId ?? 0) });
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey() });
        setReplyText("");
        toast({ title: locale === "ar" ? "تمت إضافة ردّك" : "Reply added" });
      },
    },
  });

  const filteredDiscussions = (discussions ?? []).filter((disc) => {
    const matchesTab = tab === "open" ? disc.status === "open" : disc.status !== "open";
    const q = search.toLowerCase();
    const matchesSearch = !q || disc.title.toLowerCase().includes(q) || disc.description.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        authorId: user.id,
      },
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    updateMutation.mutate({ id: editId, data: { title: editTitle, description: editDesc } });
  }

  function handleToggleStatus(id: number, currentStatus: string) {
    updateMutation.mutate({
      id,
      data: { status: currentStatus === "open" ? "closed" : "open" },
    });
  }

  function openEdit(disc: { id: number; title: string; description: string }) {
    setEditId(disc.id);
    setEditTitle(disc.title);
    setEditDesc(disc.description);
    setEditOpen(true);
  }

  function openView(id: number) {
    setSelectedId(id);
    setReplyText("");
    setViewOpen(true);
  }

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedId) return;
    commentMutation.mutate({
      id: selectedId,
      data: { userId: user.id, text: replyText },
    } as Parameters<typeof commentMutation.mutate>[0]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <MessagesSquare className="w-6 h-6 text-accent" />
            {d.title}
          </h1>
          <p className="text-muted-foreground mt-1">{d.subtitle}</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 me-2" />
          {d.new}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card p-3 rounded-lg border">
        <div className="flex gap-1">
          {(["open", "closed"] as ActiveTab[]).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t_
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t_ === "open" ? d.tabOpen : d.tabClosed}
            </button>
          ))}
        </div>
        <Input
          placeholder={d.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background max-w-xs"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : filteredDiscussions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed">
            <MessagesSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {tab === "open" ? d.noOpen : d.noClosed}
            </h3>
          </div>
        ) : (
          filteredDiscussions.map((disc) => (
            <Card
              key={disc.id}
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => openView(disc.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={disc.status === "open" ? "default" : "secondary"}
                      className={disc.status === "open" ? "bg-accent hover:bg-accent/80" : ""}
                    >
                      {disc.status === "open" ? d.open : d.closed}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(disc.date), "dd MMM yyyy", { locale: dateFnsLocale })}
                    </span>
                  </div>

                  {/* Action menu — stop propagation so card click doesn't fire */}
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() => openEdit({ id: disc.id, title: disc.title, description: disc.description })}
                        >
                          <Pencil className="w-4 h-4 me-2" />
                          {d.actions.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(disc.id, disc.status)}
                          className={disc.status === "open" ? "text-destructive focus:text-destructive" : "text-green-600 focus:text-green-600"}
                        >
                          {disc.status === "open" ? (
                            <><Lock className="w-4 h-4 me-2" />{d.actions.close}</>
                          ) : (
                            <><Unlock className="w-4 h-4 me-2" />{d.actions.reopen}</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {disc.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-2">
                <p className="text-muted-foreground text-sm line-clamp-2">{disc.description}</p>
              </CardContent>

              <CardFooter className="pt-2 border-t flex justify-between items-center text-sm">
                <div className="text-muted-foreground flex items-center gap-1">
                  {d.by}:{" "}
                  <AuthorHoverCard
                    name={disc.authorName}
                    designation={disc.authorDesignation}
                    department={disc.authorDepartment}
                    labelDesignation={t.register.designation}
                    labelDepartment={t.register.department}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <MessageCircle className="w-4 h-4" />
                  <span>{disc.commentCount}</span>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* ── Create Discussion Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{d.createTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{d.topicTitle}</Label>
              <Input name="title" required placeholder={d.topicPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label>{d.description}</Label>
              <Textarea name="description" required rows={4} placeholder={d.descriptionPlaceholder} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t.common.saving : d.publish}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Discussion Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{d.editTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{d.topicTitle}</Label>
              <Input
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{d.description}</Label>
              <Textarea
                required
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t.common.saving : d.update}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View / Reply Dialog ── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[680px] p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          {viewLoading || !viewDiscussion ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <>
              {/* Discussion header */}
              <div className="p-5 border-b bg-muted/30 shrink-0">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={viewDiscussion.status === "open" ? "default" : "secondary"}
                      className={viewDiscussion.status === "open" ? "bg-accent hover:bg-accent/80" : ""}
                    >
                      {viewDiscussion.status === "open" ? d.open : d.closed}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(viewDiscussion.date), "dd MMM yyyy", { locale: dateFnsLocale })}
                    </span>
                  </div>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() => handleToggleStatus(viewDiscussion.id, viewDiscussion.status)}
                    >
                      {viewDiscussion.status === "open" ? (
                        <><Lock className="w-3.5 h-3.5 me-1.5" />{d.closeDiscussion}</>
                      ) : (
                        <><Unlock className="w-3.5 h-3.5 me-1.5" />{d.reopenDiscussion}</>
                      )}
                    </Button>
                  )}
                </div>
                <h2 className="text-lg font-bold leading-snug mb-2">{viewDiscussion.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AuthorHoverCard
                    name={viewDiscussion.authorName}
                    designation={viewDiscussion.authorDesignation}
                    department={viewDiscussion.authorDepartment}
                    labelDesignation={t.register.designation}
                    labelDepartment={t.register.department}
                    showAvatar
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                  {viewDiscussion.description}
                </p>
              </div>

              {/* Comments list */}
              <div className="px-5 pt-4 pb-1 shrink-0 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {d.comments} ({viewDiscussion.comments.length})
                </span>
              </div>

              <ScrollArea className="flex-1 px-5 overflow-y-auto">
                {viewDiscussion.comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-lg border border-dashed mb-4">
                    {d.noComments}
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {viewDiscussion.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`rounded-lg p-3 border ${comment.isStaff ? "bg-secondary/5 border-secondary/30" : "bg-card"}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {comment.userName.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{comment.userName}</span>
                            {comment.isStaff && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 border-secondary text-secondary-foreground bg-secondary/10"
                              >
                                {d.officer}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground ms-auto">
                            {format(new Date(comment.date), "dd MMM, hh:mm a", { locale: dateFnsLocale })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap ps-9">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Reply form */}
              <div className="p-4 border-t bg-background shrink-0">
                {viewDiscussion.status === "open" ? (
                  <form onSubmit={handleSendReply} className="flex gap-2 items-end">
                    <Textarea
                      ref={replyBoxRef}
                      placeholder={d.replyPlaceholder}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      className="resize-none bg-muted/40 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (replyText.trim()) handleSendReply(e as unknown as React.FormEvent);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={!replyText.trim() || commentMutation.isPending}
                    >
                      <Send className="w-4 h-4 rotate-180" />
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2 bg-muted rounded-lg">
                    <Lock className="w-4 h-4" />
                    {d.closedNote}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
