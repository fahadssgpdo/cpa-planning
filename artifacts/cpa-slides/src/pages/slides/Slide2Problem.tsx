export default function Slide2Problem() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f8f7f4",
        fontFamily: "'Readex Pro', 'DM Sans', sans-serif",
        position: "relative",
        color: "#1a202c",
        display: "flex",
        direction: "rtl",
      }}
    >
      {/* Memphis background blobs */}
      <div style={{ position: "absolute", top: "-15vh", left: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#dde3f0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", right: "-10vw", width: "38vw", height: "38vw", backgroundColor: "#c6e8e6", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "20vh", right: "52vw", width: "8vw", height: "22vw", backgroundColor: "#f4e0b0", borderRadius: "4vw", transform: "rotate(-15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "22vh", left: "18vw", width: "12vw", height: "12vw", backgroundColor: "#0ab0a2", borderRadius: "50% 50% 0 0", opacity: 0.45, zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "14vh", right: "44vw", width: "10vw", height: "2vw", background: "radial-gradient(circle, #24336b 0.5vw, transparent 0.6vw)", backgroundSize: "2vw 2vw", zIndex: 1 }} />

      {/* Main card */}
      <div
        style={{
          position: "relative", zIndex: 10, margin: "8vh 8vw",
          width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)",
          backgroundColor: "rgba(255,255,255,0.45)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)",
          borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxSizing: "border-box", padding: "4vh 4vw",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#24336b", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6972d", fontWeight: 800, fontSize: "1.4vw" }}>ح</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#24336b" }}>هيئة حماية المستهلك</div>
          </div>
          <div style={{ backgroundColor: "#f4e0b0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#24336b" }}>التحدي</div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", height: "100%", marginTop: "5vh", gap: "4vw" }}>
          {/* Left: headline */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: "4.2vw", fontWeight: 800, color: "#24336b", lineHeight: 1.15, margin: "0 0 3vh 0", letterSpacing: "-0.05vw", textWrap: "balance" }}>
              ما المشكلة التي تحلها المنصة؟
            </h2>
            <p style={{ fontSize: "2vw", color: "#4a5568", lineHeight: 1.5, margin: 0 }}>
              تنسيق العمل مشتت عبر قنوات متعددة وغير مركزية
            </p>
          </div>

          {/* Right: 4 problem cards */}
          <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: "2vh", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2.2vh 2vw", display: "flex", alignItems: "center", gap: "1.5vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.07)" }}>
              <div style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%", backgroundColor: "#dde3f0", flexShrink: 0 }} />
              <span style={{ fontSize: "2vw", color: "#24336b", fontWeight: 500 }}>التنسيق عبر البريد الإلكتروني مكلف زمنياً ومشتت</span>
            </div>
            <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2.2vh 2vw", display: "flex", alignItems: "center", gap: "1.5vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.07)" }}>
              <div style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%", backgroundColor: "#f4e0b0", flexShrink: 0 }} />
              <span style={{ fontSize: "2vw", color: "#24336b", fontWeight: 500 }}>لا مرجعية موحدة للإعلانات والتعميمات</span>
            </div>
            <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2.2vh 2vw", display: "flex", alignItems: "center", gap: "1.5vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.07)" }}>
              <div style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%", backgroundColor: "#c6e8e6", flexShrink: 0 }} />
              <span style={{ fontSize: "2vw", color: "#24336b", fontWeight: 500 }}>الاستفسارات والردود تضيع بين الرسائل</span>
            </div>
            <div style={{ backgroundColor: "#fff", borderRadius: "1.2vw", padding: "2.2vh 2vw", display: "flex", alignItems: "center", gap: "1.5vw", boxShadow: "0 0.5vw 1.5vw rgba(36,51,107,0.07)" }}>
              <div style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%", backgroundColor: "#24336b", flexShrink: 0 }} />
              <span style={{ fontSize: "2vw", color: "#24336b", fontWeight: 500 }}>المعرفة المؤسسية غير مركزية ويصعب الوصول إليها</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.15vw solid rgba(36,51,107,0.15)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>هيئة حماية المستهلك — للاستخدام الداخلي فقط</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#24336b" }}>02</div>
        </div>
      </div>
    </div>
  );
}
