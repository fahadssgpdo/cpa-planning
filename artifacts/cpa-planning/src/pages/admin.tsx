import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import {
  useListUsers, useUpdateUser, useCreateUser,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Users, Shield, UserX, UserCheck, Plus, RefreshCw,
  CheckCircle2, XCircle, Activity, Settings, ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchAuditLogs() {
  const res = await fetch(`${BASE}/api/audit-logs?limit=200`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<Array<{
    id: number; userId: number | null; userName: string;
    action: string; entityType: string; entityId: number | null;
    details: string | null; createdAt: string;
  }>>;
}

async function postAuditLog(body: object) {
  await fetch(`${BASE}/api/audit-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PERMISSIONS_MATRIX = [
  { key: "viewDashboard",       employee: true,  officer: true,  manager: true,  admin: true },
  { key: "viewAnnouncements",   employee: true,  officer: true,  manager: true,  admin: true },
  { key: "createAnnouncements", employee: false, officer: true,  manager: true,  admin: true },
  { key: "archiveAnnouncements",employee: false, officer: false, manager: true,  admin: true },
  { key: "viewDiscussions",     employee: true,  officer: true,  manager: true,  admin: true },
  { key: "createDiscussions",   employee: true,  officer: true,  manager: true,  admin: true },
  { key: "closeDiscussions",    employee: false, officer: false, manager: true,  admin: true },
  { key: "submitInquiries",     employee: true,  officer: false, manager: false, admin: true },
  { key: "respondInquiries",    employee: false, officer: true,  manager: true,  admin: true },
  { key: "viewKnowledge",       employee: true,  officer: true,  manager: true,  admin: true },
  { key: "manageKnowledge",     employee: false, officer: true,  manager: true,  admin: true },
  { key: "submitSuggestions",   employee: true,  officer: true,  manager: true,  admin: true },
  { key: "reviewSuggestions",   employee: false, officer: true,  manager: true,  admin: true },
  { key: "manageUsers",         employee: false, officer: false, manager: false, admin: true },
  { key: "viewAuditLog",        employee: false, officer: false, manager: false, admin: true },
  { key: "systemSettings",      employee: false, officer: false, manager: false, admin: true },
] as const;

export default function AdminPage() {
  const { isAdmin, user } = useUser();
  const { t, lang } = useLocale();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateLocale = lang === "ar" ? ar : enUS;

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<null | { id: number; nameAr: string; nameEn: string; role: string }>(null);
  const [newNameAr, setNewNameAr] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newRole, setNewRole] = useState("employee");

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: auditLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        postAuditLog({ userId: user.id, userName: user.name, action: "update_user", entityType: "user", entityId: vars.id, details: JSON.stringify(vars.data) });
        toast({ title: lang === "ar" ? "تم تحديث المستخدم" : "User updated" });
      }
    }
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        postAuditLog({ userId: user.id, userName: user.name, action: "create_user", entityType: "user", entityId: data.id, details: `${data.nameAr} — ${data.role}` });
        setCreateDialog(false);
        setNewNameAr(""); setNewNameEn(""); setNewRole("employee");
        toast({ title: lang === "ar" ? "تم إضافة المستخدم" : "User created" });
      }
    }
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-24">
        <ShieldCheck className="w-14 h-14 text-destructive/40 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-destructive">{t.admin.users.noPermission}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t.admin.users.noPermissionMsg}</p>
      </div>
    );
  }

  const handleRoleChange = (id: number, role: string) => updateMutation.mutate({ id, data: { role: role as any } });
  const toggleActive = (id: number, currentActive: boolean) => updateMutation.mutate({ id, data: { active: !currentActive } });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: { nameAr: newNameAr, nameEn: newNameEn || null, role: newRole as any } });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog) return;
    updateMutation.mutate({ id: editDialog.id, data: { nameAr: editDialog.nameAr, nameEn: editDialog.nameEn || null } });
    setEditDialog(null);
  };

  const roleLabel = (r: string) => t.roles[r as keyof typeof t.roles] || r;

  const entityTypeLabel = (et: string) =>
    (t.admin.audit.entityTypes as Record<string, string>)[et] || et;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          {t.admin.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.admin.subtitle}</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="h-10 mb-5 gap-1">
          <TabsTrigger value="users" className="gap-1.5 text-sm">
            <Users className="w-4 h-4" />{t.admin.tabs.users}
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5 text-sm">
            <Shield className="w-4 h-4" />{t.admin.tabs.roles}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-sm">
            <Activity className="w-4 h-4" />{t.admin.tabs.audit}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-sm">
            <Settings className="w-4 h-4" />{t.admin.tabs.settings}
          </TabsTrigger>
        </TabsList>

        {/* === USERS TAB === */}
        <TabsContent value="users">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">{t.admin.users.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {lang === "ar" ? `${users?.length || 0} مستخدم مسجل في النظام` : `${users?.length || 0} registered users`}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreateDialog(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />{t.admin.users.add}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs border-b">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-start">{t.common.user}</th>
                      <th className="px-5 py-3 font-semibold text-start">{t.common.role}</th>
                      <th className="px-5 py-3 font-semibold text-start">{t.admin.users.joinDate}</th>
                      <th className="px-5 py-3 font-semibold text-center">{t.common.status}</th>
                      <th className="px-5 py-3 font-semibold text-center">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4"><Skeleton className="h-10 w-44" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-8 w-36" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                        </tr>
                      ))
                    ) : users?.map((u) => (
                      <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${!u.active ? 'opacity-55' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border shadow-sm">
                              <AvatarFallback className="bg-primary/8 text-primary font-bold text-xs">
                                {u.nameAr.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <button
                                className="font-semibold text-foreground text-sm hover:text-primary cursor-pointer"
                                onClick={() => setEditDialog({ id: u.id, nameAr: u.nameAr, nameEn: u.nameEn || "", role: u.role })}
                              >
                                {u.nameAr}
                              </button>
                              {u.nameEn && <div className="text-xs text-muted-foreground">{u.nameEn}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Select
                            disabled={u.id === 4}
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.id, val)}
                          >
                            <SelectTrigger className="h-8 w-[180px] text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">{t.roles.employee}</SelectItem>
                              <SelectItem value="officer">{t.roles.officer}</SelectItem>
                              <SelectItem value="manager">{t.roles.manager}</SelectItem>
                              <SelectItem value="admin">{t.roles.admin}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={u.active ? "default" : "secondary"} className={`text-xs ${u.active ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""}`}>
                            {u.active ? t.common.active : t.common.inactive}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Button
                            disabled={u.id === 4 || updateMutation.isPending}
                            variant={u.active ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleActive(u.id, u.active)}
                            className={`h-8 text-xs gap-1 ${u.active ? "text-destructive hover:text-destructive hover:bg-destructive/8 border-destructive/20" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                          >
                            {u.active ? (
                              <><UserX className="w-3.5 h-3.5" />{t.common.disable}</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" />{t.common.enable}</>
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
        </TabsContent>

        {/* === ROLES & PERMISSIONS TAB === */}
        <TabsContent value="roles">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t.admin.roles.title}</CardTitle>
              <CardDescription className="text-xs">{t.admin.roles.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs border-b">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.admin.roles.permission}</th>
                      <th className="px-5 py-3 text-center">
                        <Badge variant="outline" className="text-xs">{t.admin.roles.employee}</Badge>
                      </th>
                      <th className="px-5 py-3 text-center">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{t.admin.roles.officer}</Badge>
                      </th>
                      <th className="px-5 py-3 text-center">
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t.admin.roles.manager}</Badge>
                      </th>
                      <th className="px-5 py-3 text-center">
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">{t.admin.roles.admin}</Badge>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {PERMISSIONS_MATRIX.map((perm, idx) => {
                      const permLabels = t.admin.roles.permissions;
                      const label = permLabels[perm.key as keyof typeof permLabels] || perm.key;
                      return (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-2.5 font-medium text-foreground text-xs">{label}</td>
                          {(["employee", "officer", "manager", "admin"] as const).map((role) => (
                            <td key={role} className="px-5 py-2.5 text-center">
                              {perm[role] ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === AUDIT TRAIL TAB === */}
        <TabsContent value="audit">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">{t.admin.audit.title}</CardTitle>
                <CardDescription className="text-xs mt-1">{t.admin.audit.subtitle}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchLogs()} className="gap-1.5 text-xs h-8">
                <RefreshCw className="w-3.5 h-3.5" />{t.admin.audit.refresh}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.admin.audit.user}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.admin.audit.action}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.admin.audit.entity}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.common.details}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.admin.audit.time}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logsLoading ? (
                      Array(6).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
                          <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
                        </tr>
                      ))
                    ) : !auditLogs?.length ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          {t.admin.audit.noLogs}
                        </td>
                      </tr>
                    ) : auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="px-5 py-2.5 font-medium text-foreground">{log.userName}</td>
                        <td className="px-5 py-2.5">
                          <Badge variant="secondary" className="text-[10px] font-mono px-1.5">{log.action}</Badge>
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">
                          {entityTypeLabel(log.entityType)}{log.entityId ? ` #${log.entityId}` : ""}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground max-w-[200px] truncate">{log.details || "—"}</td>
                        <td className="px-5 py-2.5 text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SETTINGS TAB === */}
        <TabsContent value="settings">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t.admin.settings.title}</CardTitle>
              <CardDescription className="text-xs">{t.admin.settings.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.settings.platform}</Label>
                  <Input defaultValue={lang === "ar" ? "منصة دائرة التخطيط" : "Planning Department Platform"} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.settings.org}</Label>
                  <Input defaultValue={lang === "ar" ? "هيئة حماية المستهلك" : "Consumer Protection Authority"} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.settings.defaultLang}</Label>
                  <Select defaultValue={lang}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.settings.theme}</Label>
                  <Select defaultValue="light">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t.admin.settings.themeLight}</SelectItem>
                      <SelectItem value="dark">{t.admin.settings.themeDark}</SelectItem>
                      <SelectItem value="system">{t.admin.settings.themeSystem}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={() => toast({ title: t.admin.settings.saved })}>
                  {t.common.save}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t.admin.users.createTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">{t.admin.users.nameAr} *</Label>
              <Input id="nameAr" required value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} placeholder={lang === "ar" ? "الاسم بالعربية" : "Arabic name"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nameEn">{t.admin.users.nameEn}</Label>
              <Input id="nameEn" value={newNameEn} onChange={(e) => setNewNameEn(e.target.value)} placeholder={lang === "ar" ? "الاسم بالإنجليزية (اختياري)" : "English name (optional)"} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.common.role}</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">{t.roles.employee}</SelectItem>
                  <SelectItem value="officer">{t.roles.officer}</SelectItem>
                  <SelectItem value="manager">{t.roles.manager}</SelectItem>
                  <SelectItem value="admin">{t.roles.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>{t.common.cancel}</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t.common.loading : t.admin.users.add}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Name Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t.admin.users.editTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t.admin.users.nameAr} *</Label>
              <Input
                required
                value={editDialog?.nameAr || ""}
                onChange={(e) => setEditDialog(d => d ? { ...d, nameAr: e.target.value } : null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.admin.users.nameEn}</Label>
              <Input
                value={editDialog?.nameEn || ""}
                onChange={(e) => setEditDialog(d => d ? { ...d, nameEn: e.target.value } : null)}
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialog(null)}>{t.common.cancel}</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{t.common.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
