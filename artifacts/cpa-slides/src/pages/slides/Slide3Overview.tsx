export default function Slide3Overview() {
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
          <div style={{ backgroundColor: "#dde3f0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#24336b" }}>نظرة عامة</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "4vh" }}>
          <h2 style={{ fontSize: "3.8vw", fontWeight: 800, color: "#24336b", lineHeight: 1.15, margin: "0 0 1.5vh 0", letterSpacing: "-0.05vw" }}>المنصة: نظرة عامة</h2>
          <p style={{ fontSize: "1.8vw", color: "#4a5568", margin: "0 0 4vh 0", lineHeight: 1.5, maxWidth: "48vw" }}>تطبيق ويب داخلي عربي بالكامل يخدم جميع موظفي الهيئة</p>

          <div style={{ display: "flex", gap: "2.5vw", flex: 1, paddingBottom: "2vh" }}>
            {/* Big stat */}
            <div style={{ flex: 0.9, backgroundColor: "#24336b", borderRadius: "1.8vw", padding: "3vw", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "10vw", fontWeight: 800, lineHeight: 1, color: "#c6972d" }}>8</div>
              <div style={{ fontSize: "2.2vw", fontWeight: 700, marginTop: "1.5vh" }}>وحدات متكاملة</div>
              <div style={{ fontSize: "1.6vw", color: "#c6e8e6", marginTop: "1.5vh", lineHeight: 1.4 }}>من لوحة التحكم إلى إدارة المستخدمين</div>
            </div>

            {/* Feature list */}
            <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: "2.2vh", justifyContent: "center" }}>
              <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 2vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)" }}>
                <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#24336b" }}>واجهة RTL عربية أصيلة</div>
                <div style={{ fontSize: "1.5vw", color: "#718096", marginTop: "0.5vh" }}>Readex Pro — خط عربي احترافي</div>
              </div>
              <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 2vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)" }}>
                <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#24336b" }}>4 أدوار وظيفية</div>
                <div style={{ fontSize: "1.5vw", color: "#718096", marginTop: "0.5vh" }}>موظف / أخصائي / مدير / مسؤول</div>
              </div>
              <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 2vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)" }}>
                <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#24336b" }}>قاعدة بيانات مركزية</div>
                <div style={{ fontSize: "1.5vw", color: "#718096", marginTop: "0.5vh" }}>PostgreSQL + Drizzle ORM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.15vw solid rgba(36,51,107,0.15)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#24336b" }}>03</div>
        </div>
      </div>
    </div>
  );
}
