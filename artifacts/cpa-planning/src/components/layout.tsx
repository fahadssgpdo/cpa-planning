import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, USERS } from "@/hooks/use-user";
import { useLocale } from "@/hooks/use-locale";
import {
  LayoutDashboard, Megaphone, MessagesSquare,
  HelpCircle, BookOpen, MessageCircleQuestion,
  Lightbulb, Users, ChevronDown, BookMarked, ShieldCheck, Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, setUser, isAdmin } = useUser();
  const { t, lang, setLang } = useLocale();

  const NAV_ITEMS = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/announcements", label: t.nav.announcements, icon: Megaphone },
    { href: "/discussions", label: t.nav.discussions, icon: MessagesSquare },
    { href: "/inquiries", label: t.nav.inquiries, icon: HelpCircle },
    { href: "/knowledge", label: t.nav.knowledge, icon: BookOpen },
    { href: "/faq", label: t.nav.faq, icon: MessageCircleQuestion },
    { href: "/suggestions", label: t.nav.suggestions, icon: Lightbulb },
    { href: "/manual", label: t.nav.manual, icon: BookMarked },
  ];

  const roleLabel = t.roles[user.role as keyof typeof t.roles];

  return (
    <div className={`min-h-screen bg-background flex flex-col md:flex-row ${lang === "ar" ? "rtl" : "ltr"}`}>
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0 flex-col hidden md:flex">
        <div className="p-5 text-center border-b border-sidebar-border bg-sidebar relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          <h1 className="text-lg font-bold text-white mb-0.5 leading-tight">{t.appName}</h1>
          <p className="text-sidebar-primary text-xs font-semibold tracking-wider">{t.orgShort}</p>
        </div>
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="w-full block">
              <span className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${location === item.href || (item.href !== "/" && location.startsWith(item.href)) ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
          <Link href="/admin" className="w-full block mt-2 border-t border-sidebar-border pt-2">
            <span className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${location.startsWith('/admin') ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : isAdmin ? 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground' : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground/70'}`}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{t.nav.admin}</span>
              {isAdmin ? (
                <Badge variant="outline" className="ms-auto text-[10px] px-1.5 py-0 border-sidebar-primary text-sidebar-primary">
                  {lang === "ar" ? "إدارة" : "Admin"}
                </Badge>
              ) : (
                <Badge variant="outline" className="ms-auto text-[10px] px-1.5 py-0 opacity-50">
                  {lang === "ar" ? "مقيّد" : "Restricted"}
                </Badge>
              )}
            </span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="font-bold text-base text-primary md:hidden">{t.orgShort}</div>
            <div className="hidden md:block text-sm text-muted-foreground font-medium">{t.orgName}</div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="gap-1.5 text-muted-foreground hover:text-primary text-xs font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              {t.switchLang}
            </Button>

            {/* User switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 h-9">
                  <div className="flex flex-col items-start text-start">
                    <span className="text-xs font-semibold leading-none">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{roleLabel}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {USERS.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => setUser(u)}
                    className={user.id === u.id ? "bg-accent/10 text-accent font-medium" : ""}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{u.name}</span>
                      <span className="text-xs opacity-60">
                        {t.roles[u.role as keyof typeof t.roles]}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-7 overflow-y-auto bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        <footer className="py-3 text-center border-t text-xs text-muted-foreground bg-card">
          {t.internalOnly}
        </footer>
      </div>
    </div>
  );
}
