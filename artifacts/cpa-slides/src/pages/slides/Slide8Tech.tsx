export default function Slide8Tech() {
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
          <div style={{ backgroundColor: "#f4e0b0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#24336b" }}>البنية التقنية</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "3.5vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#24336b", margin: "0 0 1vh 0" }}>التقنيات المستخدمة</h2>
          <p style={{ fontSize: "1.6vw", color: "#4a5568", margin: "0 0 3vh 0" }}>بنية تقنية حديثة — TypeScript من الطبقة إلى الطبقة</p>

          <div style={{ display: "flex", gap: "2.5vw", flex: 1, paddingBottom: "1vh" }}>
            {/* Frontend */}
            <div style={{ flex: 1, backgroundColor: "#24336b", borderRadius: "1.8vw", padding: "2.5vh 2vw", color: "#fff" }}>
              <div style={{ fontSize: "1.3vw", textTransform: "uppercase", letterSpacing: "0.1vw", opacity: 0.7, marginBottom: "1.5vh" }}>الواجهة الأمامية</div>
              <div style={{ fontSize: "2vw", fontWeight: 800, marginBottom: "2vh" }}>React + Vite</div>
              <div style={{ fontSize: "1.5vw", color: "#c6e8e6", lineHeight: 1.6 }}>TypeScript</div>
              <div style={{ fontSize: "1.5vw", color: "#c6e8e6", lineHeight: 1.6 }}>RTL كامل</div>
              <div style={{ fontSize: "1.5vw", color: "#c6e8e6", lineHeight: 1.6 }}>Readex Pro</div>
              <div style={{ fontSize: "1.5vw", color: "#c6972d", lineHeight: 1.6, fontWeight: 700 }}>React Query Hooks</div>
            </div>

            {/* Backend */}
            <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "1.8vw", padding: "2.5vh 2vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.08)" }}>
              <div style={{ fontSize: "1.3vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#718096", marginBottom: "1.5vh" }}>الواجهة الخلفية</div>
              <div style={{ fontSize: "2vw", fontWeight: 800, color: "#24336b", marginBottom: "2vh" }}>Express 5</div>
              <div style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.6 }}>PostgreSQL</div>
              <div style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.6 }}>Drizzle ORM</div>
              <div style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.6 }}>Zod Validation</div>
              <div style={{ fontSize: "1.5vw", color: "#0ab0a2", lineHeight: 1.6, fontWeight: 700 }}>Pino Logging</div>
            </div>

            {/* API Contract */}
            <div style={{ flex: 1, backgroundColor: "#0ab0a2", borderRadius: "1.8vw", padding: "2.5vh 2vw", color: "#fff" }}>
              <div style={{ fontSize: "1.3vw", textTransform: "uppercase", letterSpacing: "0.1vw", opacity: 0.8, marginBottom: "1.5vh" }}>عقود API</div>
              <div style={{ fontSize: "2vw", fontWeight: 800, marginBottom: "2vh" }}>OpenAPI</div>
              <div style={{ fontSize: "1.5vw", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>Orval Codegen</div>
              <div style={{ fontSize: "1.5vw", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>React Query</div>
              <div style={{ fontSize: "1.5vw", color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>Zod Schemas</div>
              <div style={{ fontSize: "1.5vw", color: "#f4e0b0", lineHeight: 1.6, fontWeight: 700 }}>Replit — جاهز للنشر</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.15vw solid rgba(36,51,107,0.15)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#24336b" }}>08</div>
        </div>
      </div>
    </div>
  );
}
