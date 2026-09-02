import { useState, useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import { DESIGNATION_KEYS } from "@/constants/designations";
import { getAdministrativeOptions } from "@/constants/administrative-divisions";
import {
  useListUsers, useUpdateUser, useCreateUser,
  useResetUserPassword,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  CheckCircle2, XCircle, Activity, Settings, ShieldCheck,
  Search, Download, Briefcase, Building2, Layers, UserPlus, KeyRound, Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type AuditLog = {
  id: number; userId: number | null; userName: string;
  action: string; entityType: string; entityId: number | null;
  details: string | null; createdAt: string;
};

async function fetchAuditLogs() {
  const res = await fetch(`${BASE}/api/audit-logs?limit=500`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<AuditLog[]>;
}

async function postAuditLog(body: object) {
  await fetch(`${BASE}/api/audit-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
}

const PERMISSIONS_MATRIX = [
  { key: "viewDashboard",        group: "content",  employee: true,  officer: true,  manager: true,  admin: true },
  { key: "viewAnnouncements",    group: "content",  employee: true,  officer: true,  manager: true,  admin: true },
  { key: "createAnnouncements",  group: "content",  employee: false, officer: true,  manager: true,  admin: true },
  { key: "archiveAnnouncements", group: "content",  employee: false, officer: false, manager: true,  admin: true },
  { key: "viewDiscussions",      group: "content",  employee: true,  officer: true,  manager: true,  admin: true },
  { key: "createDiscussions",    group: "content",  employee: true,  officer: true,  manager: true,  admin: true },
  { key: "closeDiscussions",     group: "content",  employee: false, officer: false, manager: true,  admin: true },
  { key: "submitInquiries",      group: "content",  employee: true,  officer: false, manager: false, admin: true },
  { key: "respondInquiries",     group: "content",  employee: false, officer: true,  manager: true,  admin: true },
  { key: "viewKnowledge",        group: "knowledge",employee: true,  officer: true,  manager: true,  admin: true },
  { key: "manageKnowledge",      group: "knowledge",employee: false, officer: true,  manager: true,  admin: true },
  { key: "submitSuggestions",    group: "knowledge",employee: true,  officer: true,  manager: true,  admin: true },
  { key: "reviewSuggestions",    group: "knowledge",employee: false, officer: true,  manager: true,  admin: true },
  { key: "manageUsers",          group: "admin",    employee: false, officer: false, manager: false, admin: true },
  { key: "viewAuditLog",         group: "admin",    employee: false, officer: false, manager: false, admin: true },
  { key: "systemSettings",       group: "admin",    employee: false, officer: false, manager: false, admin: true },
] as const;

const ROLE_COLORS = {
  employee: "bg-slate-100 text-slate-700 border-slate-200",
  officer:  "bg-blue-50 text-blue-700 border-blue-200",
  manager:  "bg-amber-50 text-amber-700 border-amber-200",
  admin:    "bg-purple-50 text-purple-700 border-purple-200",
};

function actionBadgeClass(action: string) {
  if (action.startsWith("create_")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (action.startsWith("update_")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (action.startsWith("delete_") || action.startsWith("archive_")) return "bg-red-50 text-red-700 border-red-200";
  if (action.startsWith("close_")) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-muted text-muted-foreground border-border";
}

type EditState = {
  id: number; nameAr: string; nameEn: string;
  username: string; designation: string; directorate: string; department: string; section: string; role: string;
};

function emptyEdit(): Omit<EditState, "id"> {
  return { nameAr: "", nameEn: "", username: "", designation: "", directorate: "", department: "", section: "", role: "employee" };
}

function AdministrativeSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  currentLabel,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { key: string; label: string }[];
  placeholder: string;
  currentLabel: string;
}) {
  const hasCurrentValue = options.some(option => option.label === value);
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {value && !hasCurrentValue && (
          <SelectItem value={value}>{value} ({currentLabel})</SelectItem>
        )}
        {options.map(option => (
          <SelectItem key={option.key} value={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function AdminPage() {
  const { isAdmin, user, logout } = useUser();
  const { t, lang } = useLocale();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateLocale = lang === "ar" ? ar : enUS;

  const u = t.admin.users;
  const a = t.admin.audit;
  const administrativeOptions = getAdministrativeOptions(lang);

  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState(emptyEdit());
  const [editDialog, setEditDialog] = useState<EditState | null>(null);
  const [resetPwdDialog, setResetPwdDialog] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: auditLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        postAuditLog({ action: "update_user", entityType: "user", entityId: vars.id, details: JSON.stringify(vars.data) });
        toast({ title: lang === "ar" ? "تم تحديث المستخدم" : "User updated" });
      }
    }
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        postAuditLog({ action: "create_user", entityType: "user", entityId: data.id, details: `${data.nameAr} — ${data.role}` });
        setCreateDialog(false);
        setCreateForm(emptyEdit());
        toast({ title: lang === "ar" ? "تم إضافة المستخدم" : "User created" });
      }
    }
  });

  const resetPwdMutation = useResetUserPassword({
    mutation: {
      onSuccess: (_, vars) => {
        postAuditLog({ action: "reset_password", entityType: "user", entityId: vars.id, details: "Password reset by admin" });
        setResetPwdDialog(null);
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: lang === "ar" ? "تم إعادة تعيين كلمة المرور بنجاح" : "Password reset successfully" });
      },
      onError: () => {
        toast({ title: lang === "ar" ? "فشل إعادة تعيين كلمة المرور" : "Failed to reset password", variant: "destructive" });
      },
    }
  });

  const handleRoleChange = (id: number, role: string) =>
    updateMutation.mutate({ id, data: { role: role as any } });
  const toggleActive = (id: number, currentActive: boolean) =>
    updateMutation.mutate({ id, data: { active: !currentActive } });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        nameAr: createForm.nameAr,
        nameEn: createForm.nameEn || null,
        username: createForm.username || null,
        designation: createForm.designation || null,
        directorate: createForm.directorate || null,
        department: createForm.department || null,
        section: createForm.section || null,
        role: createForm.role as any,
      }
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog) return;
    updateMutation.mutate({
      id: editDialog.id,
      data: {
        nameAr: editDialog.nameAr,
        nameEn: editDialog.nameEn || null,
        username: editDialog.username || null,
        designation: editDialog.designation || null,
        directorate: editDialog.directorate || null,
        department: editDialog.department || null,
        section: editDialog.section || null,
        role: editDialog.role as any,
      }
    });
    setEditDialog(null);
  };

  const roleLabel = (r: string) => t.roles[r as keyof typeof t.roles] || r;

  const entityTypeLabel = (et: string) =>
    (a.entityTypes as Record<string, string>)[et] || et;

  const actionLabel = (action: string) =>
    (a.actionLabels as Record<string, string>)[action] || action;

  const roleCounts = useMemo(() => {
    if (!users) return { employee: 0, officer: 0, manager: 0, admin: 0 };
    return users.reduce((acc, u) => {
      acc[u.role as keyof typeof acc] = (acc[u.role as keyof typeof acc] || 0) + 1;
      return acc;
    }, { employee: 0, officer: 0, manager: 0, admin: 0 });
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchSearch = !q ||
        u.nameAr.toLowerCase().includes(q) ||
        (u.nameEn || "").toLowerCase().includes(q) ||
        (u.designation || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "active" && u.active) ||
        (statusFilter === "inactive" && !u.active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.filter((l) => {
      const matchAction = actionFilter === "all" || l.action === actionFilter;
      const matchEntity = entityFilter === "all" || l.entityType === entityFilter;
      return matchAction && matchEntity;
    });
  }, [auditLogs, actionFilter, entityFilter]);

  const uniqueActions = useMemo(() =>
    [...new Set((auditLogs || []).map(l => l.action))].sort(),
    [auditLogs]
  );
  const uniqueEntities = useMemo(() =>
    [...new Set((auditLogs || []).map(l => l.entityType))].sort(),
    [auditLogs]
  );

  // ── Access guard (AFTER all hooks) ──────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-5">
          <ShieldCheck className="w-10 h-10 text-destructive/60" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {lang === "ar"
            ? `هذه اللوحة مخصصة لمسؤولي النظام فقط. حسابك الحالي (${user.name}) لا يملك صلاحية الوصول.`
            : `This panel is for system administrators only. Your current account (${user.name}) does not have access.`}
        </p>
        <Button variant="outline" onClick={() => logout()}>
          {lang === "ar" ? "تسجيل خروج والدخول بحساب آخر" : "Sign out and log in with another account"}
        </Button>
      </div>
    );
  }

  const exportCsv = () => {
    const rows = [
      ["ID", "User", "Action", "Entity", "Entity ID", "Details", "Time"],
      ...filteredLogs.map(l => [
        l.id, l.userName, l.action, l.entityType,
        l.entityId ?? "", l.details ?? "",
        format(new Date(l.createdAt), "yyyy-MM-dd HH:mm", { locale: dateLocale })
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit-trail.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const permGroups = [
    { key: "content",   icon: Layers,    label: lang === "ar" ? "المحتوى والتواصل" : "Content & Communication" },
    { key: "knowledge", icon: Building2, label: lang === "ar" ? "المعرفة والمقترحات" : "Knowledge & Suggestions" },
    { key: "admin",     icon: Shield,    label: lang === "ar" ? "الإدارة والنظام" : "Administration & System" },
  ];

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
        <TabsContent value="users" className="space-y-4">
          {/* Role stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["employee", "officer", "manager", "admin"] as const).map(role => (
              <div key={role} className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${ROLE_COLORS[role]} bg-opacity-60`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide opacity-70 truncate">{roleLabel(role)}</p>
                  <p className="text-2xl font-bold">{usersLoading ? "—" : roleCounts[role]}</p>
                </div>
                <Users className="w-6 h-6 opacity-30 shrink-0" />
              </div>
            ))}
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{u.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {users?.length || 0} {u.totalUsers}
                </CardDescription>
              </div>
              <div className="flex gap-2 self-start sm:self-auto flex-wrap">
                <a href={`${BASE}/register`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    {lang === "ar" ? "نموذج تسجيل الموظفين" : "Employee Registration Form"}
                  </Button>
                </a>
                <Button size="sm" onClick={() => setCreateDialog(true)} className="gap-1.5">
                  <Plus className="w-4 h-4" />{u.add}
                </Button>
              </div>
            </CardHeader>

            {/* Filters */}
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="ps-8 h-8 text-xs"
                  placeholder={u.searchPlaceholder}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder={u.filterRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{u.allRoles}</SelectItem>
                  <SelectItem value="employee">{t.roles.employee}</SelectItem>
                  <SelectItem value="officer">{t.roles.officer}</SelectItem>
                  <SelectItem value="manager">{t.roles.manager}</SelectItem>
                  <SelectItem value="admin">{t.roles.admin}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder={u.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{u.allStatuses}</SelectItem>
                  <SelectItem value="active">{u.activeOnly}</SelectItem>
                  <SelectItem value="inactive">{u.inactiveOnly}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs border-b">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-start">{t.common.user}</th>
                      <th className="px-5 py-3 font-semibold text-start hidden md:table-cell">{u.designation}</th>
                      <th className="px-5 py-3 font-semibold text-start">{t.common.role}</th>
                      <th className="px-5 py-3 font-semibold text-start hidden sm:table-cell">{u.joinDate}</th>
                      <th className="px-5 py-3 font-semibold text-center">{t.common.status}</th>
                      <th className="px-5 py-3 font-semibold text-center">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4"><Skeleton className="h-10 w-44" /></td>
                          <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-8 w-36" /></td>
                          <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                        </tr>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          {t.common.noResults}
                        </td>
                      </tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${!u.active ? 'opacity-55' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border shadow-sm shrink-0">
                              <AvatarFallback className="bg-primary/8 text-primary font-bold text-xs">
                                {u.nameAr.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <button
                                className="font-semibold text-foreground text-sm hover:text-primary cursor-pointer"
                                onClick={() => setEditDialog({
                                  id: u.id,
                                  nameAr: u.nameAr,
                                  nameEn: u.nameEn || "",
                                  username: u.username || "",
                                  designation: u.designation || "",
                                  directorate: u.directorate || "",
                                  department: u.department || "",
                                  section: u.section || "",
                                  role: u.role,
                                })}
                              >
                                {lang === "ar" ? u.nameAr : (u.nameEn || u.nameAr)}
                              </button>
                              {u.username && <div className="text-[11px] text-muted-foreground font-mono">@{u.username}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <div className="text-xs text-foreground">{u.designation || <span className="text-muted-foreground">—</span>}</div>
                          {u.directorate && <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{u.directorate}</div>}
                        </td>
                        <td className="px-5 py-3">
                          <Select
                            disabled={u.id === 4}
                            value={u.role}
                            onValueChange={(val) => handleRoleChange(u.id, val)}
                          >
                            <SelectTrigger className="h-8 w-[160px] text-xs bg-background">
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
                        <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={u.active ? "default" : "secondary"} className={`text-xs ${u.active ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""}`}>
                            {u.active ? t.common.active : t.common.inactive}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 text-primary border-primary/20 hover:bg-primary/8 hover:text-primary"
                            onClick={() => setEditDialog({
                              id: u.id,
                              nameAr: u.nameAr,
                              nameEn: u.nameEn || "",
                              username: u.username || "",
                              designation: u.designation || "",
                              directorate: u.directorate || "",
                              department: u.department || "",
                              section: u.section || "",
                              role: u.role,
                            })}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {lang === "ar" ? "تعديل" : "Edit"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => { setResetPwdDialog({ id: u.id, name: lang === "ar" ? u.nameAr : (u.nameEn || u.nameAr) }); setNewPassword(""); setConfirmPassword(""); setShowPwd(false); }}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {lang === "ar" ? "إعادة تعيين" : "Reset Pwd"}
                          </Button>
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
                          </div>
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
        <TabsContent value="roles" className="space-y-4">
          {/* Role cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["employee", "officer", "manager", "admin"] as const).map(role => {
              const perms = PERMISSIONS_MATRIX.filter(p => p[role]).length;
              return (
                <Card key={role} className={`border ${ROLE_COLORS[role]} shadow-sm`}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm">{roleLabel(role)}</p>
                        <p className="text-[11px] opacity-70 mt-0.5">
                          {lang === "ar" ? `${perms} صلاحية` : `${perms} permissions`}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[role]}`}>
                        {usersLoading ? "…" : roleCounts[role]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {permGroups.map(group => {
            const GroupIcon = group.icon;
            const groupPerms = PERMISSIONS_MATRIX.filter(p => p.group === group.key);
            return (
              <Card key={group.key} className="shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b">
                  <GroupIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{group.label}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20 text-xs border-b">
                      <tr>
                        <th className="px-5 py-2.5 font-semibold text-start text-muted-foreground">{t.admin.roles.permission}</th>
                        {(["employee", "officer", "manager", "admin"] as const).map(role => (
                          <th key={role} className="px-5 py-2.5 text-center">
                            <Badge variant="outline" className={`text-[11px] ${ROLE_COLORS[role]}`}>
                              {t.admin.roles[role]}
                            </Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {groupPerms.map((perm, idx) => {
                        const permLabels = t.admin.roles.permissions;
                        const label = permLabels[perm.key as keyof typeof permLabels] || perm.key;
                        return (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-2.5 font-medium text-foreground text-xs">{label}</td>
                            {(["employee", "officer", "manager", "admin"] as const).map(role => (
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
              </Card>
            );
          })}
        </TabsContent>

        {/* === AUDIT TRAIL TAB === */}
        <TabsContent value="audit">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{a.subtitle}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 text-xs h-8">
                    <Download className="w-3.5 h-3.5" />{a.exportCsv}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => refetchLogs()} className="gap-1.5 text-xs h-8">
                    <RefreshCw className="w-3.5 h-3.5" />{a.refresh}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-8 w-[200px] text-xs">
                    <SelectValue placeholder={a.filterAction} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{a.allActions}</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {actionLabel(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder={a.filterEntity} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{a.allEntities}</SelectItem>
                    {uniqueEntities.map(et => (
                      <SelectItem key={et} value={et}>
                        {entityTypeLabel(et)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredLogs.length < (auditLogs?.length || 0) && (
                  <span className="text-xs text-muted-foreground self-center">
                    {a.showing} {filteredLogs.length} {a.of} {auditLogs?.length} {a.records}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{a.user}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{a.action}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{a.entity}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{t.common.details}</th>
                      <th className="px-5 py-3 font-semibold text-start text-muted-foreground">{a.time}</th>
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
                    ) : !filteredLogs.length ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          {a.noLogs}
                        </td>
                      </tr>
                    ) : filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="px-5 py-2.5 font-medium text-foreground">{log.userName}</td>
                        <td className="px-5 py-2.5">
                          <Badge variant="outline" className={`text-[10px] font-medium px-1.5 ${actionBadgeClass(log.action)}`}>
                            {actionLabel(log.action)}
                          </Badge>
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
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.admin.settings.theme}</Label>
                  <Select defaultValue="light">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
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

      {/* === CREATE USER DIALOG === */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{u.createTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{u.identitySection}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-nameAr" className="text-xs">{u.nameAr} *</Label>
                  <Input id="c-nameAr" required value={createForm.nameAr}
                    onChange={e => setCreateForm(f => ({ ...f, nameAr: e.target.value }))}
                    placeholder={lang === "ar" ? "الاسم بالعربية" : "Arabic name"} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-nameEn" className="text-xs">{u.nameEn} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <Input id="c-nameEn" value={createForm.nameEn}
                    onChange={e => setCreateForm(f => ({ ...f, nameEn: e.target.value }))}
                    placeholder={lang === "ar" ? "الاسم بالإنجليزية" : "English name"} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-username" className="text-xs">{u.username} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <Input id="c-username" value={createForm.username}
                    onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                    placeholder={lang === "ar" ? "اسم المستخدم" : "username"} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.common.role}</Label>
                  <Select value={createForm.role} onValueChange={val => setCreateForm(f => ({ ...f, role: val }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">{t.roles.employee}</SelectItem>
                      <SelectItem value="officer">{t.roles.officer}</SelectItem>
                      <SelectItem value="manager">{t.roles.manager}</SelectItem>
                      <SelectItem value="admin">{t.roles.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{u.orgSection}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-designation" className="text-xs">{u.designation} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <Select value={createForm.designation} onValueChange={value => setCreateForm(f => ({ ...f, designation: value }))}>
                    <SelectTrigger id="c-designation" className="h-9">
                      <SelectValue placeholder={lang === "ar" ? "اختر المسمى الوظيفي" : "Select job title"} />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGNATION_KEYS.map(key => (
                        <SelectItem key={key} value={t.register.designations[key]}>
                          {t.register.designations[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-section" className="text-xs">{u.section} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <AdministrativeSelect
                    id="c-section"
                    value={createForm.section}
                    onValueChange={value => setCreateForm(f => ({ ...f, section: value }))}
                    options={administrativeOptions.sections}
                    placeholder={lang === "ar" ? "اختر القسم أو الوحدة" : "Select section or unit"}
                    currentLabel={lang === "ar" ? "حالي" : "current"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-directorate" className="text-xs">{u.directorate} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <AdministrativeSelect
                    id="c-directorate"
                    value={createForm.directorate}
                    onValueChange={value => setCreateForm(f => ({ ...f, directorate: value }))}
                    options={administrativeOptions.directorates}
                    placeholder={lang === "ar" ? "اختر مركز العمل" : "Select work center"}
                    currentLabel={lang === "ar" ? "حالي" : "current"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-department" className="text-xs">{lang === "ar" ? "الدائرة" : "Department"} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <AdministrativeSelect
                    id="c-department"
                    value={createForm.department}
                    onValueChange={value => setCreateForm(f => ({ ...f, department: value }))}
                    options={administrativeOptions.departments}
                    placeholder={lang === "ar" ? "اختر الدائرة أو الوحدة" : "Select department or unit"}
                    currentLabel={lang === "ar" ? "حالي" : "current"}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setCreateDialog(false); setCreateForm(emptyEdit()); }}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t.common.saving : u.add}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* === EDIT USER DIALOG === */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{u.editTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 mt-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{u.identitySection}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{u.nameAr} *</Label>
                  <Input required value={editDialog?.nameAr || ""}
                    onChange={e => setEditDialog(d => d ? { ...d, nameAr: e.target.value } : null)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{u.nameEn} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <Input value={editDialog?.nameEn || ""}
                    onChange={e => setEditDialog(d => d ? { ...d, nameEn: e.target.value } : null)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">{u.username} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <Input value={editDialog?.username || ""}
                    onChange={e => setEditDialog(d => d ? { ...d, username: e.target.value } : null)}
                    className="font-mono" placeholder={lang === "ar" ? "اسم المستخدم" : "username"} />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{u.orgSection}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{u.designation} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <Select
                    value={editDialog?.designation || ""}
                    onValueChange={value => setEditDialog(d => d ? { ...d, designation: value } : null)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={lang === "ar" ? "اختر المسمى الوظيفي" : "Select job title"} />
                    </SelectTrigger>
                    <SelectContent>
                      {editDialog?.designation &&
                        !Object.values(t.register.designations).some(designation => designation === editDialog.designation) && (
                          <SelectItem value={editDialog.designation}>{editDialog.designation} ({lang === "ar" ? "حالي" : "current"})</SelectItem>
                        )}
                      {DESIGNATION_KEYS.map(key => (
                        <SelectItem key={key} value={t.register.designations[key]}>
                          {t.register.designations[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{u.section} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <AdministrativeSelect
                    value={editDialog?.section || ""}
                    onValueChange={value => setEditDialog(d => d ? { ...d, section: value } : null)}
                    options={administrativeOptions.sections}
                    placeholder={lang === "ar" ? "اختر القسم أو الوحدة" : "Select section or unit"}
                    currentLabel={lang === "ar" ? "حالي" : "current"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{u.directorate} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <AdministrativeSelect
                    value={editDialog?.directorate || ""}
                    onValueChange={value => setEditDialog(d => d ? { ...d, directorate: value } : null)}
                    options={administrativeOptions.directorates}
                    placeholder={lang === "ar" ? "اختر مركز العمل" : "Select work center"}
                    currentLabel={lang === "ar" ? "حالي" : "current"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{lang === "ar" ? "الدائرة" : "Department"} <span className="text-muted-foreground">{u.optional}</span></Label>
                  <AdministrativeSelect
                    value={editDialog?.department || ""}
                    onValueChange={value => setEditDialog(d => d ? { ...d, department: value } : null)}
                    options={administrativeOptions.departments}
                    placeholder={lang === "ar" ? "اختر الدائرة أو الوحدة" : "Select department or unit"}
                    currentLabel={lang === "ar" ? "حالي" : "current"}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{lang === "ar" ? "الصلاحية" : "Role"}</span>
              </div>
              <Select value={editDialog?.role || "employee"} onValueChange={val => setEditDialog(d => d ? { ...d, role: val } : null)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">{t.roles.employee}</SelectItem>
                  <SelectItem value="officer">{t.roles.officer}</SelectItem>
                  <SelectItem value="manager">{t.roles.manager}</SelectItem>
                  <SelectItem value="admin">{t.roles.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialog(null)}>{t.common.cancel}</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t.common.saving : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* === RESET PASSWORD DIALOG === */}
      <Dialog open={!!resetPwdDialog} onOpenChange={(o) => { if (!o) { setResetPwdDialog(null); setNewPassword(""); setConfirmPassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              {lang === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
            </DialogTitle>
          </DialogHeader>
          {resetPwdDialog && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPassword.length < 8) {
                toast({ title: lang === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters", variant: "destructive" });
                return;
              }
              if (newPassword !== confirmPassword) {
                toast({ title: lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match", variant: "destructive" });
                return;
              }
              resetPwdMutation.mutate({ id: resetPwdDialog.id, data: { newPassword } });
            }} className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">
                {lang === "ar"
                  ? `إعادة تعيين كلمة مرور: ${resetPwdDialog.name}`
                  : `Resetting password for: ${resetPwdDialog.name}`}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="new-pwd">{lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}</Label>
                <div className="relative">
                  <Input
                    id="new-pwd"
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={lang === "ar" ? "8 أحرف على الأقل" : "Min 8 characters"}
                    minLength={8}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute inset-y-0 end-2 flex items-center px-1 text-muted-foreground hover:text-foreground text-xs">
                    {showPwd ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "إظهار" : "Show")}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pwd">{lang === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input
                  id="confirm-pwd"
                  type={showPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                  minLength={8}
                  required
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">{lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setResetPwdDialog(null); setNewPassword(""); setConfirmPassword(""); }}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={resetPwdMutation.isPending || newPassword !== confirmPassword || newPassword.length < 8}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  {resetPwdMutation.isPending ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : (lang === "ar" ? "تعيين كلمة المرور" : "Set Password")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
