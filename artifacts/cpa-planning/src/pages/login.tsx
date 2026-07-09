import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { useLocale } from "@/hooks/use-locale";
import { UserContext } from "@/hooks/use-user";
import type { AppUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, AlertCircle, Globe } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LoginPage() {
  const { t, lang, setLang, dir } = useLocale();
  const l = t.login;
  const ctx = useContext(UserContext)!;
  const [, navigate] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.status === 401) { setError(l.errorInvalid); return; }
      if (res.status === 403) { setError(l.errorInactive); return; }
      if (!res.ok) { setError(l.errorGeneric); return; }

      const data = await res.json() as {
        id: number; nameAr: string; nameEn?: string; username: string;
        role: string; designation?: string;
      };

      const user: AppUser = {
        id: data.id,
        name: data.nameAr,
        username: data.username,
        role: data.role as AppUser["role"],
        designation: data.designation ?? "",
      };
      ctx.login(user);
      navigate("/");
    } catch {
      setError(l.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={dir} lang={lang} className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Language toggle */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="gap-1.5 text-muted-foreground hover:text-primary text-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            {t.switchLang}
          </Button>
        </div>

        {/* Branding card */}
        <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-lg text-center space-y-1">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">{t.appName}</h1>
          <p className="text-primary-foreground/70 text-sm font-medium">{t.orgName}</p>
        </div>

        {/* Login form */}
        <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-5">
          <div className="text-center space-y-0.5">
            <h2 className="text-lg font-bold text-foreground">{l.title}</h2>
            <p className="text-sm text-muted-foreground">{l.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">{l.username}</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder={l.usernamePlaceholder}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{l.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={l.passwordPlaceholder}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  disabled={loading}
                  required
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !username.trim() || !password}>
              {loading ? l.submitting : l.submit}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {l.noAccount}{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {l.registerLink}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">{t.internalOnly}</p>
      </div>
    </div>
  );
}
