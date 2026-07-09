import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import { 
  useListFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq,
  getListFaqsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { MessageCircleQuestion, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function FaqPage() {
  const { canManage } = useUser();
  const { t } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: faqs, isLoading } = useListFaqs();
  
  const createMutation = useCreateFaq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: t.faq.addedSuccess });
      }
    }
  });

  const updateMutation = useUpdateFaq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() });
        setIsDialogOpen(false);
        setEditingFaq(null);
        toast({ title: t.faq.updatedSuccess });
      }
    }
  });

  const deleteMutation = useDeleteFaq({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() });
        toast({ title: t.faq.deletedSuccess });
      }
    }
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      question: formData.get("question") as string,
      answer: formData.get("answer") as string,
    };

    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const openEditDialog = (faq: any) => {
    setEditingFaq(faq);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingFaq(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary text-primary-foreground p-8 rounded-2xl relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageCircleQuestion className="w-8 h-8 text-secondary" />
            {t.faq.title}
          </h1>
          <p className="text-primary-foreground/80 mt-2 text-lg">{t.faq.subtitle}</p>
        </div>
        
        {canManage && (
          <div className="relative z-10">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingFaq(null); }}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={openCreateDialog} className="shadow-sm">
                  <Plus className="w-4 h-4 me-2" />
                  {t.faq.addQuestion}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingFaq ? t.faq.editTitle : t.faq.addTitle}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">{t.faq.questionLabel}</Label>
                    <Input id="question" name="question" required defaultValue={editingFaq?.question} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">{t.faq.answerLabel}</Label>
                    <Textarea id="answer" name="answer" required rows={5} defaultValue={editingFaq?.answer} />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t.faq.cancel}</Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) ? t.faq.saving : t.faq.save}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-0 bg-transparent sm:bg-card sm:border">
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : faqs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card sm:bg-transparent rounded-lg border sm:border-0">
              {t.faq.noFaqs}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs?.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`} className="border bg-card rounded-lg px-4 shadow-sm hover:border-primary/50 transition-colors">
                  <AccordionTrigger className="text-start hover:no-underline font-semibold text-primary [&[data-state=open]]:text-accent py-4">
                    <span className="flex-1 text-start">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80 leading-relaxed pb-4 pt-1 border-t mt-2">
                    <div className="flex flex-col gap-4">
                      <p className="whitespace-pre-wrap">{faq.answer}</p>
                      {canManage && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(faq)} className="text-muted-foreground hover:text-primary h-8 px-2">
                            <Pencil className="w-3.5 h-3.5 me-1.5" /> {t.common.edit}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: faq.id })} className="text-muted-foreground hover:text-destructive h-8 px-2">
                            <Trash2 className="w-3.5 h-3.5 me-1.5" /> {t.common.delete}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
