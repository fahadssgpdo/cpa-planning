import { useUser } from "@/hooks/use-user";
import { 
  useListUsers, useUpdateUser,
  getListUsersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, UserX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminPage() {
  const { isAdmin } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: users, isLoading } = useListUsers();
  
  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "تم تحديث بيانات المستخدم" });
      }
    }
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-destructive/50 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-destructive">صلاحيات غير كافية</h2>
        <p className="text-muted-foreground mt-2">هذه الصفحة مخصصة لمسؤول النظام فقط</p>
      </div>
    );
  }

  const handleRoleChange = (id: number, newRole: any) => {
    updateMutation.mutate({ id, data: { role: newRole } });
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    updateMutation.mutate({ id, data: { active: !currentActive } });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'employee': return "موظف";
      case 'officer': return "أخصائي تخطيط";
      case 'manager': return "مدير دائرة التخطيط";
      case 'admin': return "مسؤول النظام";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground mt-1">التحكم في صلاحيات وحسابات موظفي الدائرة</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold rounded-tr-lg">المستخدم</th>
                  <th className="px-6 py-4 font-semibold">الصلاحية (الدور)</th>
                  <th className="px-6 py-4 font-semibold">تاريخ الانضمام</th>
                  <th className="px-6 py-4 font-semibold text-center">الحالة</th>
                  <th className="px-6 py-4 font-semibold text-center rounded-tl-lg">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : users?.map((user) => (
                  <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${!user.active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className="bg-primary/5 text-primary font-bold">
                            {user.nameAr.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground">{user.nameAr}</div>
                          {user.nameEn && <div className="text-xs text-muted-foreground font-mono">{user.nameEn}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        disabled={user.id === 4} // hardcode prevent changing admin
                        value={user.role} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                      >
                        <SelectTrigger className="h-8 w-[180px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">موظف</SelectItem>
                          <SelectItem value="officer">أخصائي تخطيط</SelectItem>
                          <SelectItem value="manager">مدير دائرة التخطيط</SelectItem>
                          <SelectItem value="admin">مسؤول النظام</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={user.active ? "default" : "secondary"} className={user.active ? "bg-accent/20 text-accent hover:bg-accent/30" : ""}>
                        {user.active ? "نشط" : "معطل"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        disabled={user.id === 4 || updateMutation.isPending}
                        variant={user.active ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => toggleActive(user.id, user.active)}
                        className={user.active ? "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" : "bg-accent text-accent-foreground hover:bg-accent/90"}
                      >
                        {user.active ? (
                          <><UserX className="w-3.5 h-3.5 ml-1.5" /> تعطيل</>
                        ) : (
                          <><UserCheck className="w-3.5 h-3.5 ml-1.5" /> تفعيل</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}