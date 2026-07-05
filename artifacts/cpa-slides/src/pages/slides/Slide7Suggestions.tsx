export default function Slide7Suggestions() {
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
          <div style={{ backgroundColor: "#dde3f0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#24336b" }}>الوحدة السابعة والثامنة</div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", height: "100%", marginTop: "4vh", gap: "3vw" }}>
          {/* Suggestions workflow */}
          <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <h2 style={{ fontSize: "3.4vw", fontWeight: 800, color: "#24336b", margin: 0 }}>المقترحات وإدارة المستخدمين</h2>
            <p style={{ fontSize: "1.6vw", color: "#4a5568", margin: 0 }}>دورة حياة المقترح من الرفع حتى التنفيذ</p>
            <div style={{ display: "flex", gap: "1.2vw", marginTop: "1vh" }}>
              <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 1vw", textAlign: "center", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", backgroundColor: "#dde3f0", margin: "0 auto 1vh" }} />
                <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#24336b" }}>جديد</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: "#c6972d", fontSize: "2vw", fontWeight: 700 }}>←</div>
              <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 1vw", textAlign: "center", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", backgroundColor: "#f4e0b0", margin: "0 auto 1vh" }} />
                <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#24336b" }}>قيد الدراسة</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: "#c6972d", fontSize: "2vw", fontWeight: 700 }}>←</div>
              <div style={{ flex: 1, backgroundColor: "#0ab0a2", borderRadius: "1.2vw", padding: "2vh 1vw", textAlign: "center" }}>
                <div style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.4)", margin: "0 auto 1vh" }} />
                <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#fff" }}>منفّذ</div>
              </div>
            </div>
            <div style={{ fontSize: "1.5vw", color: "#718096", marginTop: "0.5vh" }}>الموظف يقترح، الأخصائي يراجع ويعلّق، المدير يُغلق</div>
          </div>

          {/* Admin panel */}
          <div style={{ flex: 0.9, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#24336b", borderRadius: "1.8vw", padding: "3vh 2.5vw", color: "#fff", height: "100%" }}>
              <div style={{ fontSize: "2vw", fontWeight: 800, marginBottom: "2.5vh", color: "#c6972d" }}>إدارة المستخدمين</div>
              <div style={{ fontSize: "1.5vw", color: "#c6e8e6", marginBottom: "2vh" }}>للمسؤول فقط — جدول الأدوار والصلاحيات</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "0.8vw", padding: "1.2vh 1.5vw" }}>
                  <span style={{ fontSize: "1.5vw" }}>سالم الحارثي</span>
                  <span style={{ fontSize: "1.3vw", backgroundColor: "#c6972d", padding: "0.3vh 1vw", borderRadius: "0.5vw", color: "#fff" }}>موظف</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "0.8vw", padding: "1.2vh 1.5vw" }}>
                  <span style={{ fontSize: "1.5vw" }}>مريم البلوشية</span>
                  <span style={{ fontSize: "1.3vw", backgroundColor: "#0ab0a2", padding: "0.3vh 1vw", borderRadius: "0.5vw", color: "#fff" }}>أخصائية</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "0.8vw", padding: "1.2vh 1.5vw" }}>
                  <span style={{ fontSize: "1.5vw" }}>خالد الريامي</span>
                  <span style={{ fontSize: "1.3vw", backgroundColor: "#dde3f0", padding: "0.3vh 1vw", borderRadius: "0.5vw", color: "#24336b" }}>مدير</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.15vw solid rgba(36,51,107,0.15)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#24336b" }}>07</div>
        </div>
      </div>
    </div>
  );
}
