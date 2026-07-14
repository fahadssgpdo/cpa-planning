import { useState } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookMarked, LayoutDashboard, Megaphone, MessagesSquare,
  HelpCircle, BookOpen, MessageCircleQuestion, Lightbulb,
  ShieldCheck, Users, Globe, CheckCircle2, Info, BarChart2, BrainCircuit, UserCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "intro", icon: Info },
  { id: "login", icon: Users },
  { id: "dashboard", icon: LayoutDashboard },
  { id: "announcements", icon: Megaphone },
  { id: "discussions", icon: MessagesSquare },
  { id: "inquiries", icon: HelpCircle },
  { id: "knowledge", icon: BookOpen },
  { id: "faq", icon: MessageCircleQuestion },
  { id: "suggestions", icon: Lightbulb },
  { id: "admin", icon: ShieldCheck },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
      <span>{children}</span>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-foreground/80 leading-relaxed">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-foreground/80">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RoleTable({ lang }: { lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const rows = [
    { role: ar ? "موظف" : "Employee",           access: ar ? "عرض الإعلانات، النقاشات، قاعدة المعرفة، الأسئلة الشائعة، رفع استفسار ومقترح" : "View announcements, discussions, knowledge base, FAQ, submit inquiries & suggestions" },
    { role: ar ? "أخصائي تخطيط" : "Planning Officer", access: ar ? "كل صلاحيات الموظف + إنشاء إعلانات، الرد على الاستفسارات، إدارة المستندات، مراجعة المقترحات" : "All employee permissions + create announcements, respond to inquiries, manage documents, review suggestions" },
    { role: ar ? "مدير دائرة" : "Dept. Manager",      access: ar ? "كل صلاحيات الأخصائي + أرشفة الإعلانات، إغلاق النقاشات" : "All officer permissions + archive announcements, close discussions" },
    { role: ar ? "مسؤول النظام" : "System Admin",     access: ar ? "صلاحيات كاملة + إدارة المستخدمين والأدوار وسجل الأنشطة" : "Full access + user management, roles, and audit trail" },
  ];
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="px-4 py-2.5 text-start font-semibold text-muted-foreground text-xs">{ar ? "الدور" : "Role"}</th>
            <th className="px-4 py-2.5 text-start font-semibold text-muted-foreground text-xs">{ar ? "الصلاحيات" : "Permissions"}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">{r.role}</td>
              <td className="px-4 py-3 text-foreground/75 leading-relaxed">{r.access}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ManualPage() {
  const { t, lang } = useLocale();
  const [activeSection, setActiveSection] = useState<SectionId>("intro");
  const ar = lang === "ar";

  const scrollTo = (id: SectionId) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sections: Record<SectionId, React.ReactNode> = {
    intro: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed text-foreground/80">
          {ar
            ? "منصة دائرة التخطيط هي نظام ويب داخلي يوفر بيئة رقمية موحدة لجميع موظفي هيئة حماية المستهلك، تتيح التواصل والتنسيق ومشاركة المعرفة المؤسسية."
            : "The Planning Department Platform is an internal web system that provides a unified digital environment for all CPA employees, enabling communication, coordination, and knowledge sharing."}
        </p>
        <FeatureList items={ar ? [
          "واجهة عربية بالكامل مع دعم ثنائي اللغة (عربي / إنجليزي)",
          "8 وحدات وظيفية متكاملة",
          "4 مستويات صلاحية متدرجة",
          "قاعدة بيانات مركزية آمنة",
          "سجل أنشطة شامل للمسؤولين",
        ] : [
          "Full Arabic interface with bilingual support (Arabic / English)",
          "8 integrated functional modules",
          "4 graduated permission levels",
          "Secure centralized database",
          "Comprehensive audit trail for admins",
        ]} />
        <Tip>{ar ? "يعمل هذا النظام على جميع المتصفحات الحديثة على أجهزة الكمبيوتر والجوال." : "This system works on all modern browsers on both desktop and mobile devices."}</Tip>
      </div>
    ),

    login: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "يتيح النظام تبديل المستخدمين عبر قائمة الملف الشخصي في الشريط العلوي. كل مستخدم له دور يحدد الصفحات والإجراءات المتاحة."
            : "The system allows switching users via the profile menu in the top bar. Each user has a role that determines available pages and actions."}
        </p>
        <RoleTable lang={lang} />
        <Tip>{ar ? "لتغيير اللغة بين العربية والإنجليزية، اضغط زر اللغة في الشريط العلوي." : "To switch between Arabic and English, click the language button in the top bar."}</Tip>
      </div>
    ),

    dashboard: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "لوحة التحكم تعرض نظرة شاملة وسريعة لنشاط الدائرة، مع إحصائيات فورية وروابط سريعة لجميع الوحدات."
            : "The dashboard provides a comprehensive overview of department activity, with real-time statistics and quick links to all modules."}
        </p>
        <FeatureList items={ar ? [
          "إحصائيات فورية: عدد الإعلانات، النقاشات، الاستفسارات، المستندات",
          "عداد الاستفسارات المفتوحة والمقترحات النشطة",
          "روابط سريعة لجميع الأقسام",
          "آخر الإعلانات النشطة",
        ] : [
          "Real-time stats: announcements, discussions, inquiries, documents count",
          "Open inquiries and active suggestions counters",
          "Quick links to all sections",
          "Latest active announcements",
        ]} />
      </div>
    ),

    announcements: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "قسم الإعلانات والمستجدات يتيح للمسؤولين وفريق التخطيط نشر وإدارة الإشعارات الرسمية للموظفين."
            : "The Announcements section allows admins and planning team to publish and manage official notifications for employees."}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-semibold">{ar ? "التصنيفات المتاحة:" : "Available categories:"}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{ar ? "إعلان" : "Announcement"}</Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{ar ? "مستجدات التخطيط" : "Planning Update"}</Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{ar ? "تعميم" : "Circular"}</Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{ar ? "موعد مهم" : "Important Deadline"}</Badge>
          </div>
        </div>
        <p className="text-sm font-semibold">{ar ? "الإجراءات المتاحة للمسؤولين وفريق التخطيط:" : "Actions available to admins & planning team:"}</p>
        <StepList steps={ar ? [
          "إنشاء إعلان جديد: اضغط 'إعلان جديد' ثم أدخل العنوان والتصنيف والمحتوى ثم اضغط 'نشر'.",
          "تعديل إعلان: اضغط أيقونة القائمة (⋮) على الإعلان واختر 'تعديل'.",
          "نسخ للنشر: إنشاء إعلان جديد من محتوى إعلان موجود مع إمكانية التعديل.",
          "أرشفة: نقل الإعلان من النشط إلى الأرشيف مع إمكانية الاسترداد.",
          "إعادة تفعيل: استعادة إعلان مؤرشف وجعله نشطاً مجدداً.",
          "إعادة استخدام: نسخ إعلان مؤرشف كمسودة لإعلان جديد.",
          "حذف نهائي: حذف الإعلان بشكل دائم — لا يمكن التراجع.",
        ] : [
          "Create: Click 'New Announcement', fill in title, category, body, then 'Publish'.",
          "Edit: Click the menu icon (⋮) on an announcement and select 'Edit'.",
          "Copy & Republish: Create a new announcement from existing content.",
          "Archive: Move from active to archive; can be restored.",
          "Reactivate: Restore an archived announcement back to active.",
          "Reuse: Copy archived content as a draft for a new announcement.",
          "Delete permanently: Cannot be undone.",
        ]} />
      </div>
    ),

    discussions: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "النقاشات التشاركية تتيح لجميع الموظفين فتح موضوعات للنقاش والتعليق عليها. يستطيع المدير والمسؤول إغلاق الموضوعات."
            : "Participatory discussions allow all employees to open topics and comment. Managers and admins can close topics."}
        </p>
        <FeatureList items={ar ? [
          "فتح موضوع نقاش جديد بعنوان ووصف",
          "التعليق على الموضوعات المفتوحة",
          "عرض حالة الموضوع: مفتوح / مغلق",
          "عرض عدد التعليقات لكل موضوع",
          "إغلاق الموضوعات (مدير / مسؤول فقط)",
        ] : [
          "Open a new discussion topic with title and description",
          "Comment on open topics",
          "View topic status: open / closed",
          "View comment count per topic",
          "Close topics (manager / admin only)",
        ]} />
      </div>
    ),

    inquiries: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "قسم الاستفسارات يتيح للموظفين رفع أسئلة رسمية يتم الرد عليها من أخصائيي التخطيط أو المدير."
            : "The Inquiries section allows employees to submit formal questions, responded to by planning officers or the manager."}
        </p>
        <StepList steps={ar ? [
          "الموظف يرفع استفساراً بعنوان وتفاصيل.",
          "الأخصائي أو المدير يرى الاستفسارات ويكتب رداً.",
          "تتغير حالة الاستفسار: مفتوح ← قيد المعالجة ← مجاب ← محلول.",
          "الموظف يرى رده ويضع علامة 'محلول'.",
        ] : [
          "Employee submits an inquiry with subject and details.",
          "Officer or manager views inquiries and writes a response.",
          "Inquiry status changes: Open ← Processing ← Answered ← Resolved.",
          "Employee views the response and marks as 'Resolved'.",
        ]} />
      </div>
    ),

    knowledge: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "قاعدة المعرفة هي مستودع مركزي للمستندات الرسمية مصنفة حسب النوع."
            : "The Knowledge Base is a centralized repository for official documents, categorized by type."}
        </p>
        <FeatureList items={ar ? [
          "تصفية المستندات حسب التصنيف: أدلة، إرشادات، مؤشرات أداء، سياسات، نماذج",
          "عرض تفاصيل كل مستند: الاسم، الوصف، التاريخ",
          "رفع مستند جديد (أخصائي / مدير / مسؤول)",
          "حذف المستندات (مسؤول فقط)",
        ] : [
          "Filter documents by category: manuals, guidelines, KPIs, policies, templates",
          "View document details: name, description, date",
          "Upload new document (officer / manager / admin)",
          "Delete documents (admin only)",
        ]} />
      </div>
    ),

    faq: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "الأسئلة الشائعة تعرض قائمة منظمة بالأسئلة المتكررة وإجاباتها. يستطيع الأخصائيون والمديرون إضافة أسئلة وتعديلها."
            : "The FAQ displays an organized list of frequently asked questions and answers. Officers and managers can add and edit questions."}
        </p>
        <FeatureList items={ar ? [
          "عرض جميع الأسئلة الشائعة مع إمكانية طي وتوسيع الإجابة",
          "إضافة سؤال وإجابة جديدة (أخصائي / مدير / مسؤول)",
          "تعديل سؤال موجود",
          "حذف سؤال",
        ] : [
          "View all FAQs with collapsible/expandable answers",
          "Add new question & answer (officer / manager / admin)",
          "Edit existing questions",
          "Delete questions",
        ]} />
      </div>
    ),

    suggestions: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "صندوق المقترحات يتيح للجميع تقديم أفكار ومقترحات تحسينية ومتابعة حالتها."
            : "The Suggestions box allows everyone to submit ideas and improvement proposals and track their status."}
        </p>
        <StepList steps={ar ? [
          "رفع مقترح بتصنيف وتفاصيل.",
          "الأخصائي / المدير يراجع المقترح ويغير حالته.",
          "دورة الحياة: جديد ← قيد الدراسة ← مقبول / مرفوض ← منفّذ.",
          "إمكانية إضافة ملاحظة أو رد على المقترح.",
        ] : [
          "Submit a suggestion with category and details.",
          "Officer / manager reviews and changes status.",
          "Lifecycle: New ← Under Review ← Accepted / Rejected ← Implemented.",
          "Option to add a note or response to the suggestion.",
        ]} />
      </div>
    ),

    admin: (
      <div className="space-y-4">
        <p className="text-sm text-foreground/75 leading-relaxed">
          {ar
            ? "لوحة الإدارة متاحة فقط لمسؤول النظام وتضم أربعة أقسام رئيسية."
            : "The Admin Panel is available only to the System Admin and has four main sections."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border shadow-none">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-primary">
                <Users className="w-4 h-4" />{ar ? "المستخدمون" : "Users"}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ar ? "إضافة مستخدمين جدد، تعديل الأسماء، تغيير الأدوار، تفعيل أو تعطيل الحسابات." : "Add new users, edit names, change roles, enable or disable accounts."}
              </p>
            </CardContent>
          </Card>
          <Card className="border shadow-none">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-primary">
                <ShieldCheck className="w-4 h-4" />{ar ? "الأدوار والصلاحيات" : "Roles & Permissions"}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ar ? "عرض مصفوفة الصلاحيات الكاملة لكل دور." : "View the full permissions matrix for each role."}
              </p>
            </CardContent>
          </Card>
          <Card className="border shadow-none">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-primary">
                <Globe className="w-4 h-4" />{ar ? "سجل الأنشطة" : "Audit Trail"}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ar ? "متابعة جميع الإجراءات المسجلة في النظام: من أنشأ، من عدّل، ومتى." : "Track all recorded system activities: who created, who edited, and when."}
              </p>
            </CardContent>
          </Card>
          <Card className="border shadow-none">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-primary">
                <Settings className="w-4 h-4" />{ar ? "الإعدادات" : "Settings"}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ar ? "تخصيص اسم المنصة والمنظمة والإعدادات العامة." : "Customize platform name, organization name, and general settings."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-secondary" />
          {t.manual.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.manual.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* TOC sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          <Card className="shadow-none sticky top-24">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.manual.toc}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <nav className="flex flex-col gap-0.5">
                {SECTIONS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-start transition-colors w-full",
                      activeSection === id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {t.manual.sections[id]}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {SECTIONS.map(({ id, icon: Icon }, idx) => (
            <div key={id} id={`section-${id}`}>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="w-5 h-5 text-secondary" />
                    {t.manual.sections[id]}
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {sections[id]}
                </CardContent>
              </Card>
              {idx < SECTIONS.length - 1 && <div className="h-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Settings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
