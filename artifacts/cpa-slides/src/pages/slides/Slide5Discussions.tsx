export default function Slide5Discussions() {
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
      <div style={{ position: "absolute", bottom: "14vh", right: "44vw", width: "10vw", height: "2vw", background: "radial-gradient(circle, #24336b 0.5vw, transparent 0.6vw)", backgroundSize: "2vw 2vw", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255,255,255,0.45)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#24336b", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6972d", fontWeight: 800, fontSize: "1.4vw" }}>ح</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#24336b" }}>هيئة حماية المستهلك</div>
          </div>
          <div style={{ backgroundColor: "#f4e0b0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#24336b" }}>الوحدة الثالثة والرابعة</div>
        </div>

        {/* Content — two-column */}
        <div style={{ display: "flex", height: "100%", marginTop: "4vh", gap: "3vw" }}>
          {/* Discussions */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ backgroundColor: "#24336b", borderRadius: "1.8vw", padding: "3vh 2.5vw", color: "#fff", flex: 1 }}>
              <div style={{ fontSize: "2.2vw", fontWeight: 800, marginBottom: "2.5vh" }}>النقاشات التشاركية</div>
              <div style={{ fontSize: "1.7vw", color: "#c6e8e6", lineHeight: 1.6 }}>
                موضوعات مفتوحة / مغلقة
              </div>
              <div style={{ fontSize: "1.7vw", color: "#c6e8e6", lineHeight: 1.6 }}>
                تعليقات مترابطة ومنظمة
              </div>
              <div style={{ marginTop: "3vh", display: "flex", gap: "1.5vw" }}>
                <div style={{ backgroundColor: "#0ab0a2", borderRadius: "0.8vw", padding: "1vh 1.5vw", fontSize: "1.4vw", fontWeight: 700 }}>مفتوح</div>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "0.8vw", padding: "1vh 1.5vw", fontSize: "1.4vw", fontWeight: 700 }}>مغلق</div>
              </div>
            </div>
          </div>

          {/* Inquiries */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <h2 style={{ fontSize: "3.4vw", fontWeight: 800, color: "#24336b", margin: "0 0 0.5vh 0" }}>النقاشات والاستفسارات</h2>
            <p style={{ fontSize: "1.6vw", color: "#4a5568", margin: "0 0 2vh 0" }}>الاستفسارات: الموظف يرفع، الأخصائي يرد، المدير يتابع الكل</p>

            <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#24336b", marginBottom: "1.5vh" }}>إدارة الحالة</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#c6972d", flexShrink: 0 }} />
                <span style={{ fontSize: "1.7vw", color: "#24336b" }}>مفتوح</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#0ab0a2", flexShrink: 0 }} />
                <span style={{ fontSize: "1.7vw", color: "#24336b" }}>قيد المعالجة</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#24336b", flexShrink: 0 }} />
                <span style={{ fontSize: "1.7vw", color: "#24336b" }}>مجاب</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#dde3f0", flexShrink: 0 }} />
                <span style={{ fontSize: "1.7vw", color: "#24336b" }}>محلول</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.15vw solid rgba(36,51,107,0.15)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#24336b" }}>05</div>
        </div>
      </div>
    </div>
  );
}
