export type AdministrativeOption = {
  key: string;
  ar: string;
  en: string;
};

const option = (key: string, ar: string, en: string): AdministrativeOption => ({ key, ar, en });

export const DIRECTORATE_OPTIONS: AdministrativeOption[] = [
  option("chairmanOffice", "مكتب رئيس الهيئة والدوائر التابعة له", "Office of the Chairman and Affiliated Departments"),
  option("consumerServices", "المديرية العامة لخدمات المستهلكين ومراقبة الأسواق", "Directorate General of Consumer Services and Market Control"),
  option("studiesDevelopment", "المديرية العامة للدراسات والتطوير", "Directorate General of Studies and Development"),
  option("administrativeFinancial", "المديرية العامة للشؤون الإدارية والمالية", "Directorate General of Administrative and Financial Affairs"),
  option("northBatinah", "المديرية العامة لحماية المستهلك بمحافظة شمال الباطنة بصحار", "Directorate General of Consumer Protection in North Al Batinah, Sohar"),
  option("dhofar", "المديرية العامة لحماية المستهلك بمحافظة ظفار بصلالة", "Directorate General of Consumer Protection in Dhofar, Salalah"),
  option("dakhliyah", "إدارة حماية المستهلك بمحافظة الداخلية بنزوى", "Consumer Protection Department in Al Dakhiliyah, Nizwa"),
  option("northSharqiyah", "إدارة حماية المستهلك بمحافظة شمال الشرقية بإبراء", "Consumer Protection Department in North Al Sharqiyah, Ibra"),
  option("southSharqiyah", "إدارة حماية المستهلك بمحافظة جنوب الشرقية بصور", "Consumer Protection Department in South Al Sharqiyah, Sur"),
  option("southBatinahBarka", "إدارة حماية المستهلك بمحافظة جنوب الباطنة ببركاء", "Consumer Protection Department in South Al Batinah, Barka"),
  option("southBatinahRustaq", "إدارة حماية المستهلك بمحافظة جنوب الباطنة بالرستاق", "Consumer Protection Department in South Al Batinah, Rustaq"),
  option("dhahirah", "إدارة حماية المستهلك بمحافظة الظاهرة بعبري", "Consumer Protection Department in Al Dhahirah, Ibri"),
  option("buraimi", "إدارة حماية المستهلك بمحافظة البريمي", "Consumer Protection Department in Al Buraimi"),
  option("musandamKhasab", "إدارة حماية المستهلك بمحافظة مسندم بخصب", "Consumer Protection Department in Musandam, Khasab"),
  option("musandamDibba", "إدارة حماية المستهلك بمحافظة مسندم بولاية دبا", "Consumer Protection Department in Musandam, Dibba"),
  option("alWusta", "إدارة حماية المستهلك بمحافظة الوسطى بهيما", "Consumer Protection Department in Al Wusta, Haima"),
];

export const DEPARTMENT_OPTIONS: AdministrativeOption[] = [
  option("directUnit", "وحدة مباشرة ضمن مركز العمل", "Direct unit within the work center"),
  option("chairmanOffice", "مكتب رئيس الهيئة", "Office of the Chairman"),
  option("visionOffice", "مكتب متابعة رؤية عُمان 2040", "Oman Vision 2040 Follow-up Office"),
  option("securityOffice", "مكتب الأمن", "Security Office"),
  option("legal", "الدائرة القانونية", "Legal Department"),
  option("fieldAssessment", "دائرة تقييم الأعمال الميدانية بالأسواق", "Department of Field Work Assessment in Markets"),
  option("councilsInternational", "دائرة المجالس والتعاون الدولي", "Department of Councils and International Cooperation"),
  option("documents", "دائرة الوثائق", "Document Department"),
  option("customerServices", "دائرة خدمات المراجعين", "Customer Services Department"),
  option("communications", "دائرة التواصل والإعلام", "Communication and Media Department"),
  option("quality", "دائرة ضبط الجودة", "Quality Control Department"),
  option("consultantsExperts", "المستشارون والخبراء", "Consultants and Experts"),
  option("internalAudit", "دائرة التدقيق الداخلي", "Internal Audit Department"),
  option("planningFollowUp", "دائرة التخطيط والمتابعة", "Planning and Follow-up Department"),
  option("vicePresidentConsumer", "نائب الرئيس لخدمات المستهلكين ومراقبة الأسواق", "Vice President for Consumer Services and Market Control"),
  option("antiCommercialFraud", "دائرة مكافحة الغش التجاري", "Commercial Fraud Control Department"),
  option("marketRegulation", "دائرة تنظيم ومراقبة الأسواق", "Market Regulation and Control Department"),
  option("recallsWarnings", "دائرة الاستدعاءات والتحذيرات", "Recalls and Warnings Department"),
  option("vicePresidentAdmin", "نائب الرئيس للشؤون الإدارية والمالية", "Vice President for Administrative and Financial Affairs"),
  option("innovationDigital", "دائرة الابتكار والتحول الرقمي", "Innovation and Digital Transformation Department"),
  option("humanResources", "دائرة الموارد البشرية", "Human Resources Department"),
  option("trainingQualification", "دائرة التدريب والتأهيل", "Training and Qualification Department"),
  option("informationTechnology", "دائرة تقنية المعلومات", "Information Technology Department"),
  option("administrativeAffairs", "دائرة الشؤون الإدارية", "Administrative Affairs Department"),
  option("publicRelations", "دائرة العلاقات العامة", "Public Relations Department"),
  option("financialAffairs", "دائرة الشؤون المالية", "Financial Affairs Department"),
  option("complaints", "دائرة الشكاوى", "Complaints Department"),
  option("marketStudies", "دائرة الدراسات وبحوث السوق", "Market Studies and Research Department"),
  option("economicData", "دائرة البيانات والمعلومات الاقتصادية", "Economic Data and Information Department"),
  option("counterfeitGoodsExhibition", "معرض السلع المقلدة", "Counterfeit Goods Exhibition"),
  option("consumerCallCenter", "مركز اتصالات المستهلكين", "Consumer Call Center"),
  option("regionalConsumerServicesSohar", "دائرة خدمات المستهلكين ومراقبة الأسواق بصحار", "Consumer Services and Market Control Department, Sohar"),
  option("regionalStudiesSohar", "دائرة الدراسات والتطوير بصحار", "Studies and Development Department, Sohar"),
  option("regionalAdminSohar", "دائرة الشؤون الإدارية والمالية بصحار", "Administrative and Financial Affairs Department, Sohar"),
  option("regionalConsumerServicesSalalah", "دائرة خدمات المستهلكين ومراقبة الأسواق بصلالة", "Consumer Services and Market Control Department, Salalah"),
  option("regionalStudiesSalalah", "دائرة الدراسات والتطوير بصلالة", "Studies and Development Department, Salalah"),
  option("regionalAdminSalalah", "دائرة الشؤون الإدارية والمالية بصلالة", "Administrative and Financial Affairs Department, Salalah"),
  option("suwayqOffice", "مكتب السويق", "Suwayq Office"),
  option("sinawOffice", "مكتب سناو", "Sinaw Office"),
  option("alKamilAlWafiOffice", "مكتب الكامل والوافي", "Al Kamil and Al Wafi Office"),
  option("masirahOffice", "مكتب مصيرة", "Masirah Office"),
  option("thumraitOffice", "مكتب حماية المستهلك بولاية ثمريت", "Consumer Protection Office in Thumrait"),
  option("mirbatOffice", "مكتب حماية المستهلك بولاية مرباط", "Consumer Protection Office in Mirbat"),
  option("mazyounaDepartment", "إدارة حماية المستهلك بمحافظة ظفار بالمزيونة", "Consumer Protection Department in Dhofar, Al Mazyunah"),
  option("rawdahOffice", "مكتب حماية المستهلك بنيابة الروضة التابع لإدارة حماية المستهلك بمحافظة البريمي", "Consumer Protection Office in Al Rawdah, affiliated with Al Buraimi"),
];

const CENTRAL_SECTIONS: AdministrativeOption[] = [
  option("coordination", "قسم التنسيق", "Coordination Section"),
  option("followUp", "قسم المتابعة", "Follow-up Section"),
  option("translation", "قسم الترجمة", "Translation Section"),
  option("casesJudgments", "قسم القضايا ومتابعة الأحكام", "Cases and Judgments Follow-up Section"),
  option("legalStudies", "قسم الدراسات والبحوث القانونية", "Legal Studies and Research Section"),
  option("researchInvestigation", "قسم البحث والاستدلال", "Research and Investigation Section"),
  option("contractsAgreements", "قسم العقود والاتفاقيات", "Contracts and Agreements Section"),
  option("fieldInspection", "قسم التفتيش الميداني", "Field Inspection Section"),
  option("fieldAssessment", "قسم تقييم الأعمال الميدانية بالأسواق", "Field Work Assessment in Markets Section"),
  option("internationalCooperation", "قسم التعاون الدولي", "International Cooperation Section"),
  option("councilsCommittees", "قسم المجالس واللجان", "Councils and Committees Section"),
  option("informationSecurity", "قسم أمن المعلومات الإلكترونية", "Electronic Information Security Section"),
  option("documentOrganization", "قسم تنظيم الوثائق", "Document Organization Section"),
  option("mail", "قسم البريد", "Mail Section"),
  option("archiving", "قسم الحفظ", "Archiving Section"),
  option("requestReception", "قسم استقبال وتسجيل الطلبات", "Request Reception and Registration Section"),
  option("coordinationFollowUp", "قسم التنسيق والمتابعة", "Coordination and Follow-up Section"),
  option("media", "قسم الإعلام", "Media Section"),
  option("digitalCommunication", "قسم التواصل الرقمي", "Digital Communication Section"),
  option("creativeContent", "قسم المحتوى الإبداعي", "Creative Content Section"),
  option("strategicCommunication", "قسم التواصل الاستراتيجي", "Strategic Communication Section"),
  option("performanceQuality", "قسم ضبط جودة الأداء", "Performance Quality Control Section"),
  option("goodsServicesQuality", "قسم ضبط جودة السلع والخدمات", "Goods and Services Quality Control Section"),
  option("revenueAudit", "قسم تدقيق الإيرادات", "Revenue Audit Section"),
  option("administrativeAudit", "قسم التدقيق الإداري", "Administrative Audit Section"),
  option("expenseAudit", "قسم تدقيق المصروفات", "Expense Audit Section"),
  option("riskManagement", "قسم إدارة المخاطر", "Risk Management Section"),
  option("planning", "قسم التخطيط", "Planning Section"),
  option("planFollowUp", "قسم متابعة وتقييم الخطط", "Plans Follow-up and Evaluation Section"),
  option("fraudCounterfeit", "قسم مكافحة الغش والتقليد", "Fraud and Counterfeit Control Section"),
  option("misleadingAds", "قسم الإعلانات المضللة", "Misleading Advertisements Section"),
  option("onlineShopping", "قسم مراقبة التسوق الإلكتروني", "Online Shopping Monitoring Section"),
  option("marketMonitoring", "قسم مراقبة الأسواق", "Market Monitoring Section"),
  option("vehicleComplaints", "قسم شكاوى المركبات", "Vehicle Complaints Section"),
  option("serviceOfficeComplaints", "قسم شكاوى مكاتب الخدمات", "Service Office Complaints Section"),
  option("generalGoodsComplaints", "قسم شكاوى السلع العامة وخدماتها", "General Goods and Services Complaints Section"),
  option("electronicsComplaints", "قسم شكاوى الإلكترونيات", "Electronics Complaints Section"),
  option("expertsTechnicians", "قسم الاستعانة بالخبراء والفنيين", "Experts and Technicians Support Section"),
  option("recalls", "قسم الاستدعاءات", "Recalls Section"),
  option("warningsResearch", "قسم التحذيرات والبحث", "Warnings and Research Section"),
  option("innovationDevelopment", "قسم الابتكار والتطوير", "Innovation and Development Section"),
  option("digitalTransformation", "قسم التحول الرقمي", "Digital Transformation Section"),
  option("appointmentsService", "قسم التعيينات وشؤون الخدمة", "Appointments and Service Affairs Section"),
  option("leaves", "قسم الإجازات", "Leave Section"),
  option("personnelData", "قسم المعلومات والبيانات الوظيفية", "Personnel Information and Data Section"),
  option("jobClassification", "قسم التنظيم وتصنيف وموازنة الوظائف", "Job Organization, Classification and Budgeting Section"),
  option("qualification", "قسم التأهيل", "Qualification Section"),
  option("training", "قسم التدريب", "Training Section"),
  option("operationsSupport", "قسم إدارة العمليات والدعم الفني", "Operations and Technical Support Management Section"),
  option("networks", "قسم الشبكات", "Networks Section"),
  option("systemsDatabases", "قسم تطوير الأنظمة وقواعد البيانات", "Systems and Databases Development Section"),
  option("warehouses", "قسم المخازن", "Warehouses Section"),
  option("maintenance", "قسم الخدمات والصيانة", "Services and Maintenance Section"),
  option("transport", "قسم النقليات", "Transport Section"),
  option("employeeActivities", "قسم الأنشطة ورعاية الموظفين", "Employee Activities and Welfare Section"),
  option("receptionHospitality", "قسم الاستقبال والضيافة", "Reception and Hospitality Section"),
  option("salaries", "قسم الرواتب", "Payroll Section"),
  option("purchases", "قسم المشتريات", "Purchasing Section"),
  option("expenses", "قسم المصروفات", "Expenses Section"),
  option("treasury", "قسم الخزينة", "Treasury Section"),
  option("budgetProjects", "قسم الموازنة وحسابات المشاريع", "Budget and Project Accounts Section"),
  option("financialRevenue", "قسم الإيرادات المالية", "Financial Revenue Section"),
  option("nationalDataGovernance", "قسم حوكمة وإدارة البيانات الوطنية", "National Data Governance and Management Section"),
  option("publicOpinionSurveys", "قسم استطلاعات الرأي العام", "Public Opinion Surveys Section"),
  option("marketStudiesResearch", "قسم دراسات وبحوث السوق", "Market Studies and Research Section"),
  option("marketForecasting", "قسم التوقعات المستقبلية للأسواق", "Future Market Forecasting Section"),
  option("priceEvaluation", "قسم تقييم ومتابعة الأسعار", "Price Evaluation and Monitoring Section"),
  option("economicData", "قسم البيانات والمعلومات الاقتصادية", "Economic Data and Information Section"),
  option("dataReview", "قسم مراجعة وتحليل البيانات", "Data Review and Analysis Section"),
  option("statisticalSurveys", "قسم المسوحات والبيانات الإحصائية", "Statistical Surveys and Data Section"),
];

const REGIONAL_SECTION_NAMES: AdministrativeOption[] = [
  option("regionalCoordinationFollowUp", "قسم التنسيق والمتابعة", "Coordination and Follow-up Section"),
  option("regionalLegal", "قسم الشؤون القانونية", "Legal Affairs Section"),
  option("regionalMailDocuments", "قسم البريد والوثائق", "Mail and Documents Section"),
  option("regionalCommunicationMedia", "قسم التواصل والإعلام", "Communication and Media Section"),
  option("regionalInformationTechnology", "قسم تقنية المعلومات", "Information Technology Section"),
  option("regionalComplaints", "قسم الشكاوى", "Complaints Section"),
  option("regionalMarketRegulation", "قسم تنظيم ومراقبة الأسواق", "Market Regulation and Control Section"),
  option("regionalStudiesDevelopment", "قسم الدراسات والتطوير", "Studies and Development Section"),
  option("regionalAdminFinancial", "قسم الشؤون الإدارية والمالية", "Administrative and Financial Affairs Section"),
  option("regionalAdministrative", "قسم الشؤون الإدارية", "Administrative Affairs Section"),
  option("regionalFinancial", "قسم الشؤون المالية", "Financial Affairs Section"),
  option("regionalMarketStudies", "قسم الدراسات وبحوث السوق", "Market Studies and Research Section"),
  option("regionalEconomicData", "قسم البيانات والمعلومات الاقتصادية", "Economic Data and Information Section"),
  option("regionalTraining", "قسم التدريب", "Training Section"),
];

const REGIONAL_LOCATIONS = [
  ["sohar", "بصحار", ", Sohar"],
  ["salalah", "بصلالة", ", Salalah"],
  ["nizwa", "بنزوى", ", Nizwa"],
  ["rustaq", "بالرستاق", ", Rustaq"],
  ["barka", "ببركاء", ", Barka"],
  ["ibra", "بإبراء", ", Ibra"],
  ["sur", "بصور", ", Sur"],
  ["ibri", "بعبري", ", Ibri"],
  ["buraimi", "بالبريمي", ", Al Buraimi"],
  ["khasab", "بخصب", ", Khasab"],
  ["dibba", "بدبا", ", Dibba"],
  ["haima", "بهيما", ", Haima"],
  ["mazyouna", "بالمزيونة", ", Al Mazyunah"],
] as const;

const REGIONAL_SECTION_OPTIONS = REGIONAL_LOCATIONS.flatMap(([location, arSuffix, enSuffix]) =>
  REGIONAL_SECTION_NAMES.map(section =>
    option(`${section.key}-${location}`, `${section.ar}${arSuffix}`, `${section.en}${enSuffix}`),
  ),
);

export const SECTION_OPTIONS: AdministrativeOption[] = [
  ...CENTRAL_SECTIONS,
  ...REGIONAL_SECTION_NAMES,
  ...REGIONAL_SECTION_OPTIONS,
  option("directOffice", "مكتب أو وحدة لا تتبع قسماً", "Office or unit without a section"),
];

export function getAdministrativeOptions(lang: "ar" | "en") {
  const label = (item: AdministrativeOption) => (lang === "ar" ? item.ar : item.en);
  const localizeUnique = (items: AdministrativeOption[]) => {
    const labels = new Set<string>();
    return items
      .map(item => ({ key: item.key, label: label(item) }))
      .filter(item => {
        if (labels.has(item.label)) return false;
        labels.add(item.label);
        return true;
      });
  };
  return {
    directorates: localizeUnique(DIRECTORATE_OPTIONS),
    departments: localizeUnique(DEPARTMENT_OPTIONS),
    sections: localizeUnique(SECTION_OPTIONS),
  };
}