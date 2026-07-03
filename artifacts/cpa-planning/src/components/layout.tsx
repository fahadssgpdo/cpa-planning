import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, USERS } from "@/hooks/use-user";
import { 
  LayoutDashboard, Megaphone, MessagesSquare, 
  HelpCircle, BookOpen, MessageCircleQuestion, 
  Lightbulb, Users, ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/announcements", label: "الإعلانات والمستجدات", icon: Megaphone },
  { href: "/discussions", label: "النقاشات التشاركية", icon: MessagesSquare },
  { href: "/inquiries", label: "استفسارات الموظفين", icon: HelpCircle },
  { href: "/knowledge", label: "قاعدة المعرفة", icon: BookOpen },
  { href: "/faq", label: "الأسئلة الشائعة", icon: MessageCircleQuestion },
  { href: "/suggestions", label: "المقترحات", icon: Lightbulb },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, setUser, isAdmin } = useUser();

  const activeRoleLabel = {
    employee: "موظف",
    officer: "أخصائي تخطيط",
    manager: "مدير دائرة التخطيط",
    admin: "مسؤول النظام"
  }[user.role];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar border-l border-sidebar-border flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-6 text-center border-b border-sidebar-border bg-sidebar relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          <h1 className="text-xl font-bold text-white mb-1">منصة دائرة التخطيط</h1>
          <p className="text-sidebar-primary text-sm font-semibold tracking-wider">HEMA</p>
        </div>
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="w-full block">
              <span className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location === item.href || (item.href !== "/" && location.startsWith(item.href)) ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="w-full block mt-auto">
              <span className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location.startsWith('/admin') ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <Users className="w-5 h-5" />
                <span>إدارة المستخدمين</span>
              </span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-primary md:hidden">HEMA</div>
            <div className="hidden md:block text-muted-foreground font-medium">هيئة حماية المستهلك</div>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 pr-3 pl-2">
                  <div className="flex flex-col items-start text-right mr-2">
                    <span className="text-sm font-semibold leading-none">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{activeRoleLabel}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {USERS.map((u) => (
                  <DropdownMenuItem 
                    key={u.id} 
                    onClick={() => setUser(u)}
                    className={user.id === u.id ? "bg-accent/10 text-accent font-medium" : ""}
                  >
                    <div className="flex flex-col">
                      <span>{u.name}</span>
                      <span className="text-xs opacity-70">
                        {u.role === 'employee' ? 'موظف' : u.role === 'officer' ? 'أخصائي تخطيط' : u.role === 'manager' ? 'مدير دائرة التخطيط' : 'مسؤول النظام'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="py-4 text-center border-t text-sm text-muted-foreground bg-card">
          للاستخدام الداخلي فقط — هيئة حماية المستهلك، دائرة التخطيط
        </footer>
      </div>
    </div>
  );
}