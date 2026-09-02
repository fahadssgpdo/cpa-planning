import { useState } from "react";
import { Link } from "wouter";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { DESIGNATION_KEYS } from "@/constants/designations";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DIRECTORATES = [
  "planning",
  "admin",
  "legal",
  "communications",
  "it",
  "quality",
  "finance",
  "consumer",
  "inspection",
] as const;

const DEPARTMENTS = [
  "strategicPlanning",
  "performanceDev",
  "riskGovernance",
  "legalAffairs",
  "contracts",
  "hr",
  "finance",
  "media",
  "itSystems",
  "consumerServices",
  "inspectionOps",
] as const;

const SECTIONS = [
  "strategicPlanning",
  "performanceMonitoring",
  "riskManagement",
  "reporting",
  "hr",
  "procurement",
  "contracts",
  "legalResearch",
  "mediaRelations",
  "awarenessPrograms",
  "infrastructure",
  "systemsDev",
  "budgeting",
  "accounting",
  "consumerComplaints",
  "fieldInspection",
] as const;

type FormState = {
  nameAr: string;
  nameEn: string;
  username: string;
  password: string;
  confirmPassword: string;
  designation: string;
  directorate: string;
  department: string;
  section: string;
};

export default function RegisterPage() {
  const { t, lang, setLang, dir } = useLocale();
  const r = t.register;

  const [form, setForm] = useState<FormState>({
    nameAr: "",
    nameEn: "",
    username: "",
    password: "",
    confirmPassword: "",
    designation: "",
    directorate: "",
    department: "",
    section: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "form", string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(field: keyof FormState) {
    return (v: string) => {
      setForm((prev) => ({ ...prev, [field]: v }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.nameAr.trim()) errs.nameAr = lang === "ar" ? "مطلوب" : "Required";
    if (!form.username.trim()) errs.username = lang === "ar" ? "مطلوب" : "Required";
    if (form.password.length < 8) errs.password = r.errorPasswordShort;
    if (form.password !== form.confirmPassword) errs.confirmPassword = r.errorPasswordMismatch;
    if (!form.designation) errs.designation = lang === "ar" ? "مطلوب" : "Required";
    if (!form.directorate) errs.directorate = lang === "ar" ? "مطلوب" : "Required";
    if (!form.department) errs.department = lang === "ar" ? "مطلوب" : "Required";
    if (!form.section) errs.section = lang === "ar" ? "مطلوب" : "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: form.nameAr.trim(),
          nameEn: form.nameEn.trim() || undefined,
          username: form.username.trim(),
          password: form.password,
          designation: form.designation,
          directorate: form.directorate,
          department: form.department,
          section: form.section,
        }),
      });

      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        const errCode = (body as { error?: string }).error;
        if (errCode === "account_limit_reached") {
          setErrors({ form: r.errorAccountLimit });
        } else {
          setErrors({ username: r.errorUsernameTaken });
        }
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors({ form: (body as { error?: string }).error ?? (lang === "ar" ? "حدث خطأ، يرجى المحاولة مجدداً" : "An error occurred, please try again") });
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div dir={dir} lang={lang} className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="bg-card rounded-2xl border shadow-lg p-10 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-primary">{lang === "ar" ? "تم التسجيل بنجاح!" : "Registration Successful!"}</h2>
            <p className="text-muted-foreground">{r.success}</p>
            <Link href="/login">
              <Button className="w-full mt-4">{lang === "ar" ? "تسجيل الدخول" : "Sign In"}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} lang={lang} className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header card */}
        <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-lg flex items-center gap-5">
          <img src={`${BASE}/logo.png`} alt={t.orgName} className="h-14 w-auto object-contain brightness-0 invert shrink-0" />
          <div className="w-px self-stretch bg-white/25 shrink-0" />
          <div>
            <div className="text-sm opacity-75">{t.orgName}</div>
            <h1 className="text-2xl font-bold">{r.title}</h1>
            <p className="text-sm opacity-80 mt-0.5">{r.subtitle}</p>
          </div>
          {/* Language switcher */}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="ms-auto shrink-0 text-sm bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg"
          >
            {t.switchLang}
          </button>
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl border shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {errors.form && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.form}
              </div>
            )}

            {/* ── Section 1: Identity ── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b w-full block">
                {lang === "ar" ? "البيانات الشخصية" : "Personal Information"}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nameAr">{r.nameAr} <span className="text-destructive">*</span></Label>
                  <Input
                    id="nameAr"
                    dir="rtl"
                    placeholder={r.nameArPlaceholder}
                    value={form.nameAr}
                    onChange={(e) => set("nameAr")(e.target.value)}
                    className={errors.nameAr ? "border-destructive" : ""}
                  />
                  {errors.nameAr && <p className="text-xs text-destructive">{errors.nameAr}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nameEn">{r.nameEn}</Label>
                  <Input
                    id="nameEn"
                    dir="ltr"
                    placeholder={r.nameEnPlaceholder}
                    value={form.nameEn}
                    onChange={(e) => set("nameEn")(e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Section 2: Account ── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b w-full block">
                {lang === "ar" ? "بيانات الحساب" : "Account Details"}
              </legend>

              <div className="space-y-1.5">
                <Label htmlFor="username">{r.username} <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  dir="ltr"
                  placeholder={r.usernamePlaceholder}
                  value={form.username}
                  onChange={(e) => set("username")(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className={errors.username ? "border-destructive" : ""}
                  autoComplete="username"
                />
                {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">{r.password} <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      dir="ltr"
                      type={showPw ? "text" : "password"}
                      placeholder={r.passwordPlaceholder}
                      value={form.password}
                      onChange={(e) => set("password")(e.target.value)}
                      className={errors.password ? "border-destructive pe-10" : "pe-10"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">{r.confirmPassword} <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      dir="ltr"
                      type={showConfirm ? "text" : "password"}
                      placeholder={r.confirmPasswordPlaceholder}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword")(e.target.value)}
                      className={errors.confirmPassword ? "border-destructive pe-10" : "pe-10"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>
            </fieldset>

            {/* ── Section 3: Job Info ── */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b w-full block">
                {lang === "ar" ? "البيانات الوظيفية" : "Job Information"}
              </legend>

              <div className="space-y-1.5">
                <Label>{r.designation} <span className="text-destructive">*</span></Label>
                <Select value={form.designation} onValueChange={set("designation")}>
                  <SelectTrigger className={errors.designation ? "border-destructive" : ""}>
                    <SelectValue placeholder={r.designationPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATION_KEYS.map((key) => (
                      <SelectItem key={key} value={r.designations[key]}>
                        {r.designations[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>{r.directorate} <span className="text-destructive">*</span></Label>
                <Select value={form.directorate} onValueChange={set("directorate")}>
                  <SelectTrigger className={errors.directorate ? "border-destructive" : ""}>
                    <SelectValue placeholder={r.directoratePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTORATES.map((key) => (
                      <SelectItem key={key} value={r.directorates[key]}>
                        {r.directorates[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.directorate && <p className="text-xs text-destructive">{errors.directorate}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{r.department} <span className="text-destructive">*</span></Label>
                  <Select value={form.department} onValueChange={set("department")}>
                    <SelectTrigger className={errors.department ? "border-destructive" : ""}>
                      <SelectValue placeholder={r.departmentPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((key) => (
                        <SelectItem key={key} value={r.departments[key]}>
                          {r.departments[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>{r.section} <span className="text-destructive">*</span></Label>
                  <Select value={form.section} onValueChange={set("section")}>
                    <SelectTrigger className={errors.section ? "border-destructive" : ""}>
                      <SelectValue placeholder={r.sectionPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((key) => (
                        <SelectItem key={key} value={r.sections[key]}>
                          {r.sections[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.section && <p className="text-xs text-destructive">{errors.section}</p>}
                </div>
              </div>
            </fieldset>

            {/* Submit */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base"
              >
                {loading ? r.submitting : r.submit}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {r.alreadyHaveAccount}{" "}
                <Link href="/" className="text-primary hover:underline font-medium">
                  {r.backToLogin}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
