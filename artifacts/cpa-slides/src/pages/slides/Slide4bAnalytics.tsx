export default function Slide4bAnalytics() {
  return (
    <div
      style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        backgroundColor: "#f8f7f4", fontFamily: "'Readex Pro', 'DM Sans', sans-serif",
        position: "relative", color: "#1a202c", display: "flex", direction: "rtl",
      }}
    >
      <div style={{ position: "absolute", top: "-15vh", left: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#dde3f0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", right: "-10vw", width: "38vw", height: "38vw", backgroundColor: "#c6e8e6", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "20vh", right: "52vw", width: "8vw", height: "22vw", backgroundColor: "#f4e0b0", borderRadius: "4vw", transform: "rotate(-15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "22vh", left: "18vw", width: "12vw", height: "12vw", backgroundColor: "#0ab0a2", borderRadius: "50% 50% 0 0", opacity: 0.45, zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255,255,255,0.45)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#24336b", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6972d", fontWeight: 800, fontSize: "1.4vw" }}>ح</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#24336b" }}>هيئة حماية المستهلك</div>
          </div>
          <div style={{ backgroundColor: "#e9d5ff", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#5b21b6" }}>جديد ✦ 2026</div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "4vw", marginTop: "2.5vh" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "3.2vw", fontWeight: 800, color: "#24336b", lineHeight: 1.15, margin: "0 0 0.6vh 0" }}>التحليلات والتقارير</h2>
            <p style={{ fontSize: "1.4vw", color: "#4a5568", margin: "0 0 2.5vh 0" }}>لوحة بيانية متكاملة + مساعد ذكاء اصطناعي</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vw", flex: 1 }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: "1.2vw", padding: "1.5vh 1.5vw", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#24336b", marginBottom: "0.5vh" }}>📈 اتجاه النشاط</div>
                <div style={{ fontSize: "0.95vw", color: "#64748b", lineHeight: 1.5 }}>مخطط مساحي لآخر 8 أسابيع يرصد المقترحات والاستفسارات والنقاشات</div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: "1.2vw", padding: "1.5vh 1.5vw", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#24336b", marginBottom: "0.5vh" }}>🍩 المقترحات</div>
                <div style={{ fontSize: "0.95vw", color: "#64748b", lineHeight: 1.5 }}>مخطط دائري يوزع المقترحات على جميع الحالات</div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: "1.2vw", padding: "1.5vh 1.5vw", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#24336b", marginBottom: "0.5vh" }}>📊 الاستفسارات</div>
                <div style={{ fontSize: "0.95vw", color: "#64748b", lineHeight: 1.5 }}>أعمدة أفقية تصنّف الموضوعات حسب الحجم</div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: "1.2vw", padding: "1.5vh 1.5vw", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#24336b", marginBottom: "0.5vh" }}>🏆 أبرز المساهمين</div>
                <div style={{ fontSize: "0.95vw", color: "#64748b", lineHeight: 1.5 }}>لوحة صدارة تعرض أكثر 7 موظفين تفاعلاً</div>
              </div>
            </div>
          </div>

          <div style={{ width: "28vw", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ backgroundColor: "#24336b", borderRadius: "1.5vw", padding: "2vh 2vw", color: "#fff", flex: 1 }}>
              <div style={{ fontSize: "1.1vw", fontWeight: 800, color: "#c6972d", marginBottom: "1.2vh" }}>🤖 مساعد الرؤى الذكي</div>
              <div style={{ fontSize: "0.95vw", lineHeight: 1.6, color: "#cbd5e1", marginBottom: "1.5vh" }}>يقرأ بيانات المنصة الحية ويُصدر 5 رؤى ثنائية اللغة مصنّفة بالألوان</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6vh", fontSize: "0.85vw" }}>
                <div style={{ backgroundColor: "rgba(16,185,129,0.2)", borderRadius: "0.5vw", padding: "0.4vh 0.8vw", color: "#6ee7b7" }}>✅ إيجابي — نقاط قوة وإنجازات</div>
                <div style={{ backgroundColor: "rgba(245,158,11,0.2)", borderRadius: "0.5vw", padding: "0.4vh 0.8vw", color: "#fcd34d" }}>⚠️ تنبيه — يستدعي متابعة</div>
                <div style={{ backgroundColor: "rgba(96,165,250,0.2)", borderRadius: "0.5vw", padding: "0.4vh 0.8vw", color: "#93c5fd" }}>ℹ️ معلومة — حقيقة مفيدة</div>
                <div style={{ backgroundColor: "rgba(167,139,250,0.2)", borderRadius: "0.5vw", padding: "0.4vh 0.8vw", color: "#c4b5fd" }}>⚡ إجراء موصى به</div>
              </div>
              <div style={{ marginTop: "1.5vh", backgroundColor: "rgba(198,151,45,0.15)", borderRadius: "0.8vw", padding: "0.8vh 1vw", fontSize: "0.8vw", color: "#fcd34d", textAlign: "center", fontWeight: 700 }}>
                مُشغَّل بـ Claude Sonnet — Anthropic AI
              </div>
            </div>
            <div style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: "1.2vw", padding: "1.5vh 1.5vw", border: "1.5px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ fontSize: "2vw", fontWeight: 800, color: "#24336b" }}>⬤ معدل الحل</div>
              <div style={{ fontSize: "0.95vw", color: "#64748b", marginTop: "0.5vh" }}>مقياس دائري يُظهر نسبة الاستفسارات المحلولة — أخضر/أصفر/أحمر</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "1.5vh" }}>
          <div style={{ fontSize: "0.9vw", color: "#94a3b8" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "0.9vw", color: "#94a3b8" }}>04b</div>
        </div>
      </div>
    </div>
  );
}
