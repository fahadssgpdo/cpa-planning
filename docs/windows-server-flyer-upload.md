# إعداد تخزين الملفات على Windows Server

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

## 4. إعداد التخزين الخاص للمستندات

أنشئ مجلداً دائماً خاصاً بالمستندات:

```text
C:\Planning\CPA-Planning-Platform\uploads\documents
```

امنح حساب Windows الذي يشغّل خدمة Node.js صلاحية **Modify** على هذا المجلد. لا تمنح مستخدمي IIS أو زوار الموقع وصولاً مباشراً إليه؛ تنزيل المستندات يتم حصراً من خلال مسار API المحمي بتسجيل الدخول.

عيّن متغير البيئة التالي للحساب أو الخدمة التي تشغّل المنصة:

```text
DOCUMENT_UPLOAD_DIR=C:\Planning\CPA-Planning-Platform\uploads\documents
```

ويمكن تعيينه على مستوى الجهاز من PowerShell بصلاحية مسؤول:

```powershell
[Environment]::SetEnvironmentVariable(
  "DOCUMENT_UPLOAD_DIR",
  "C:\Planning\CPA-Planning-Platform\uploads\documents",
  "Machine"
)
```

أعد تشغيل خدمة Node.js بعد تعيين المتغير. لا تضف هذا المجلد إلى إعدادات الملفات الثابتة في IIS أو أي خادم ويب آخر.

## التشغيل والنسخ الاحتياطي

- أدرج مجلد `uploads\announcements` ضمن النسخ الاحتياطية الدورية إلى جانب قاعدة بيانات PostgreSQL.
- أدرج مجلد `uploads\documents` ضمن النسخ الاحتياطية الدورية؛ يجب استعادة قاعدة البيانات وهذا المجلد معاً للحفاظ على ارتباط السجلات بالملفات.
- لا تحذف هذا المجلد عند تحديث ملفات التطبيق أو استبدال مجلد `dist`.
- الملفات المدعومة: JPEG وPNG وWebP وGIF، وبحد أقصى **10 MB** لكل فلاير.

## التشغيل عبر HTTP داخل الشبكة المحلية

الإعداد الافتراضي في وضع الإنتاج يستخدم ملفات ارتباط جلسة آمنة تتطلب HTTPS. إذا كانت المنصة ستعمل عمداً عبر HTTP داخل شبكة داخلية موثوقة، أضف متغير الخدمة التالي:

```text
COOKIE_SECURE=false
```

أعد تشغيل خدمة Node.js بعد إضافته. استخدم `COOKIE_SECURE=true` عند تفعيل HTTPS لاحقاً. إبقاء ملفات الارتباط آمنة هو الخيار الموصى به متى كان HTTPS متاحاً.