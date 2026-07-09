import { useUser } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import { usePreferences } from "@/hooks/use-preferences";
import type { Theme, FontSize } from "@/hooks/use-preferences";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  User, Palette, Accessibility, Sun, Moon, Monitor,
  ALargeSmall, Eye, Zap, CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const { t, lang } = useLocale();
  const { prefs, setPrefs } = usePreferences();
  const p = t.profile;

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light",  label: p.themeLight,  icon: Sun     },
    { value: "dark",   label: p.themeDark,   icon: Moon    },
    { value: "system", label: p.themeSystem, icon: Monitor },
  ];

  const fontSizes: { value: FontSize; label: string; sampleClass: string }[] = [
    { value: "sm", label: p.fontSm, sampleClass: "text-xs" },
    { value: "md", label: p.fontMd, sampleClass: "text-sm" },
    { value: "lg", label: p.fontLg, sampleClass: "text-base" },
  ];

  const roleLabel = t.roles[user.role as keyof typeof t.roles];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <User className="w-6 h-6" />
          {p.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{p.subtitle}</p>
      </div>

      {/* ── Account Info ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {p.accountInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label={lang === "ar" ? "الاسم" : "Name"} value={user.name} />
          {user.username && (
            <Row label={lang === "ar" ? "اسم المستخدم" : "Username"} value={user.username} mono />
          )}
          <Row
            label={lang === "ar" ? "المسمى الوظيفي" : "Designation"}
            value={user.designation || "—"}
          />
          <Row
            label={lang === "ar" ? "الدور" : "Role"}
            value={
              <Badge variant="outline" className="font-medium">
                {roleLabel}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      {/* ── Appearance ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            {p.appearance}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Theme */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{p.theme}</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label, icon: Icon }) => {
                const active = prefs.theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => setPrefs({ theme: value })}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <CheckCircle2 className="absolute top-2 end-2 w-3.5 h-3.5 text-primary" />
                    )}
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font size */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <ALargeSmall className="w-4 h-4" />
              {p.fontSize}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {fontSizes.map(({ value, label }) => {
                const active = prefs.fontSize === value;
                return (
                  <button
                    key={value}
                    onClick={() => setPrefs({ fontSize: value })}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <CheckCircle2 className="absolute top-1.5 end-1.5 w-3 h-3 text-primary" />
                    )}
                    <span
                      className={`font-bold ${
                        value === "sm" ? "text-base" : value === "md" ? "text-xl" : "text-2xl"
                      }`}
                    >
                      أ A
                    </span>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
              {p.fontPreview}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Accessibility ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-primary" />
            {p.accessibility}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <ToggleRow
            icon={<Eye className="w-4 h-4 text-primary" />}
            label={p.highContrast}
            description={p.highContrastDesc}
            checked={prefs.highContrast}
            onCheckedChange={(v) => setPrefs({ highContrast: v })}
            id="hc-toggle"
          />

          <ToggleRow
            icon={<Zap className="w-4 h-4 text-primary" />}
            label={p.reducedMotion}
            description={p.reducedMotionDesc}
            checked={prefs.reducedMotion}
            onCheckedChange={(v) => setPrefs({ reducedMotion: v })}
            id="rm-toggle"
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        {p.savedAuto}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-end ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="space-y-0.5">
          <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
