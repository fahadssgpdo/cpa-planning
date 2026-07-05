export default function Slide6Knowledge() {
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
          <div style={{ backgroundColor: "#c6e8e6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#24336b" }}>الوحدة الخامسة والسادسة</div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", height: "100%", marginTop: "4vh", gap: "3vw" }}>
          {/* Left column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.5vh" }}>
            <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#24336b", lineHeight: 1.15, margin: 0 }}>قاعدة المعرفة والأسئلة الشائعة</h2>
            <p style={{ fontSize: "1.7vw", color: "#4a5568", margin: 0, lineHeight: 1.5 }}>مرجع مركزي موثوق لجميع موظفي الهيئة</p>

            <div style={{ backgroundColor: "#24336b", borderRadius: "1.5vw", padding: "2.5vh 2vw", color: "#fff" }}>
              <div style={{ fontSize: "2vw", fontWeight: 700, marginBottom: "1.5vh" }}>8 وثائق مصنفة</div>
              <div style={{ display: "flex", gap: "1vw", flexWrap: "wrap" }}>
                <div style={{ backgroundColor: "#c6972d", borderRadius: "0.6vw", padding: "0.5vh 1vw", fontSize: "1.3vw", fontWeight: 700 }}>أدلة</div>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "0.6vw", padding: "0.5vh 1vw", fontSize: "1.3vw" }}>سياسات</div>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "0.6vw", padding: "0.5vh 1vw", fontSize: "1.3vw" }}>نماذج</div>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "0.6vw", padding: "0.5vh 1vw", fontSize: "1.3vw" }}>مؤشرات أداء</div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2vh" }}>
            <div style={{ fontSize: "2vw", fontWeight: 700, color: "#24336b" }}>الأسئلة الشائعة — FAQ</div>
            <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 2vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)", borderRight: "0.4vw solid #c6972d" }}>
              <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#24336b" }}>متى تقدم تقارير مؤشرات الأداء؟</div>
              <div style={{ fontSize: "1.4vw", color: "#718096", marginTop: "0.8vh" }}>خلال 10 أيام عمل من نهاية كل ربع</div>
            </div>
            <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2vh 2vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.06)", borderRight: "0.4vw solid #0ab0a2" }}>
              <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#24336b" }}>كيف أقترح مبادرة جديدة؟</div>
              <div style={{ fontSize: "1.4vw", color: "#718096", marginTop: "0.8vh" }}>عبر نموذج ميثاق المبادرة في قاعدة المعرفة</div>
            </div>
            <div style={{ fontSize: "1.5vw", color: "#718096" }}>5 أسئلة جاهزة — قابلة للإضافة والتحرير من الأخصائيين</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.15vw solid rgba(36,51,107,0.15)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#24336b" }}>06</div>
        </div>
      </div>
    </div>
  );
}
