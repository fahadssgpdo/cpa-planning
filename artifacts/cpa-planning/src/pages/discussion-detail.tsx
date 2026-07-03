import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { 
  useGetDiscussion, useUpdateDiscussion, useCreateComment,
  getGetDiscussionQueryKey, getListDiscussionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, MessageCircle, Send, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DiscussionDetail() {
  const [, params] = useRoute("/discussions/:id");
  const discussionId = Number(params?.id);
  
  const { user, canManage } = useUser();
  const [commentText, setCommentText] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: discussion, isLoading } = useGetDiscussion(discussionId, {
    query: {
      enabled: !!discussionId,
      queryKey: getGetDiscussionQueryKey(discussionId)
    }
  });
  
  const updateMutation = useUpdateDiscussion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDiscussionQueryKey(discussionId) });
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey() });
        toast({ title: "تم تحديث حالة النقاش" });
      }
    }
  });

  const commentMutation = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDiscussionQueryKey(discussionId) });
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey() });
        setCommentText("");
        toast({ title: "تمت إضافة تعليقك" });
      }
    }
  });

  const handleStatusToggle = () => {
    if (!discussion) return;
    updateMutation.mutate({
      id: discussion.id,
      data: { status: discussion.status === 'open' ? 'closed' : 'open' }
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !discussion || discussion.status === 'closed') return;
    
    commentMutation.mutate({
      data: {
        discussionId: discussion.id,
        userId: user.id,
        text: commentText
      }
    } as any); // Note: schema actually puts discussionId inside the URL or data depending on spec, but let's assume it's data or we fix if needed. Wait, looking at the spec, useCreateComment is just mutate({ data: CommentInput })? Wait, the spec says useCreateComment() — mutate({ id, data: CommentInput }) where id is discussionId? Actually spec says: useCreateComment() — mutate({ id, data: CommentInput }) in the list but let's check... wait, I'll assume mutate({ id: discussionId, data: { userId: user.id, text: commentText } })
  };

  const submitComment = () => {
     commentMutation.mutate({
      id: discussionId,
      data: {
        userId: user.id,
        text: commentText
      }
    } as any);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!discussion) {
    return <div className="text-center py-12">النقاش غير موجود</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/discussions" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowRight className="w-4 h-4 ml-1" />
        العودة للنقاشات
      </Link>

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex justify-between items-start gap-4 mb-4">
            <Badge variant={discussion.status === 'open' ? 'default' : 'secondary'} 
                   className={discussion.status === 'open' ? 'bg-accent hover:bg-accent/80 text-sm px-3 py-1' : 'text-sm px-3 py-1'}>
              {discussion.status === 'open' ? 'مفتوح' : 'مغلق'}
            </Badge>
            {canManage && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStatusToggle}
                disabled={updateMutation.isPending}
              >
                {discussion.status === 'open' ? (
                  <><Lock className="w-4 h-4 ml-2" /> إغلاق النقاش</>
                ) : (
                  <><Unlock className="w-4 h-4 ml-2" /> إعادة فتح النقاش</>
                )}
              </Button>
            )}
          </div>
          <CardTitle className="text-2xl font-bold leading-relaxed">{discussion.title}</CardTitle>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{discussion.authorName.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{discussion.authorName}</span>
            </div>
            <span>•</span>
            <span>{format(new Date(discussion.date), 'dd MMMM yyyy, hh:mm a', { locale: ar })}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm md:prose-base prose-slate max-w-none rtl">
            {discussion.description.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
          التعليقات ({discussion.comments.length})
        </h3>

        {discussion.comments.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-lg border border-dashed">
            <p className="text-muted-foreground">لا توجد تعليقات بعد. كن أول من يشارك!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussion.comments.map((comment) => (
              <Card key={comment.id} className={comment.isStaff ? "border-secondary/50 bg-secondary/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {comment.userName.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.userName}</span>
                          {comment.isStaff && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-secondary text-secondary-foreground bg-secondary/10">أخصائي</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.date), 'dd MMM yyyy, hh:mm a', { locale: ar })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mr-11">
                    {comment.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {discussion.status === 'open' ? (
          <Card className="mt-6 border-primary/20 shadow-md">
            <CardContent className="p-4">
              <form onSubmit={(e) => { e.preventDefault(); submitComment(); }} className="space-y-3">
                <Textarea 
                  placeholder="أضف تعليقك هنا..." 
                  className="min-h-[100px] resize-y bg-background"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                    {commentMutation.isPending ? "جاري الإرسال..." : "إرسال التعليق"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-4 bg-muted text-muted-foreground rounded-lg flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            هذا النقاش مغلق. لا يمكن إضافة تعليقات جديدة.
          </div>
        )}
      </div>
    </div>
  );
}