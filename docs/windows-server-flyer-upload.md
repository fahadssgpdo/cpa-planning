# إعداد رفع فلايرات الإعلانات على Windows Server

تُحفظ صور الفلايرات خارج قاعدة البيانات في مجلد دائم، بينما يحتفظ PostgreSQL ببيانات الملف ومساره فقط.

## 1. تحديث قاعدة البيانات

نفّذ ملف `setup-database.sql` المحدث في قاعدة بيانات `cpa_planning` من خلال pgAdmin. الأوامر الموجودة في نهاية الملف تضيف أعمدة الفلاير بأمان إلى التثبيت الحالي ولا تؤثر في الإعلانات السابقة.

## 2. إنشاء مجلد الصور

أنشئ المجلد الدائم التالي:

```text
C:\Planning\CPA-Planning-Platform\uploads\announcements
```

امنح حساب Windows الذي يشغّل خدمة Node.js صلاحية **Modify** على هذا المجلد.

## 3. تعيين متغير البيئة

عيّن متغير البيئة التالي للحساب أو الخدمة التي تشغّل المنصة:

```text
ANNOUNCEMENT_UPLOAD_DIR=C:\Planning\CPA-Planning-Platform\uploads\announcements
```

إذا استخدمت PowerShell بصلاحية مسؤول، يمكن تعيينه على مستوى الجهاز كالتالي:

```powershell
[Environment]::SetEnvironmentVariable(
  "ANNOUNCEMENT_UPLOAD_DIR",
  "C:\Planning\CPA-Planning-Platform\uploads\announcements",
  "Machine"
)
```

أعد تشغيل خدمة Node.js أو مهمة التشغيل بعد تعيين المتغير. لا تحتاج إلى إضافة مسار ويب منفصل؛ التطبيق يخدم الصور تلقائياً تحت:

```text
https://planning.cpa.gov.om/uploads/announcements/<file-name>
```

## التشغيل والنسخ الاحتياطي

- أدرج مجلد `uploads\announcements` ضمن النسخ الاحتياطية الدورية إلى جانب قاعدة بيانات PostgreSQL.
- لا تحذف هذا المجلد عند تحديث ملفات التطبيق أو استبدال مجلد `dist`.
- الملفات المدعومة: JPEG وPNG وWebP وGIF، وبحد أقصى **10 MB** لكل فلاير.