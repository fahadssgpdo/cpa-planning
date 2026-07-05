export default function Slide1Title() {
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
      {/* Memphis background blobs — CPA navy + teal + gold */}
      <div
        style={{
          position: "absolute",
          top: "-15vh",
          left: "-5vw",
          width: "45vw",
          height: "45vw",
          backgroundColor: "#dde3f0",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10vh",
          right: "-10vw",
          width: "38vw",
          height: "38vw",
          backgroundColor: "#c6e8e6",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      {/* Gold pill accent */}
      <div
        style={{
          position: "absolute",
          top: "22vh",
          right: "52vw",
          width: "8vw",
          height: "22vw",
          backgroundColor: "#f4e0b0",
          borderRadius: "4vw",
          transform: "rotate(-15deg)",
          zIndex: 1,
        }}
      />
      {/* Teal half-circle */}
      <div
        style={{
          position: "absolute",
          bottom: "22vh",
          left: "18vw",
          width: "12vw",
          height: "12vw",
          backgroundColor: "#0ab0a2",
          borderRadius: "50% 50% 0 0",
          opacity: 0.55,
          zIndex: 1,
        }}
      />
      {/* Small navy dot */}
      <div
        style={{
          position: "absolute",
          top: "38vh",
          left: "8vw",
          width: "4vw",
          height: "4vw",
          backgroundColor: "#24336b",
          borderRadius: "50%",
          opacity: 0.4,
          zIndex: 1,
        }}
      />
      {/* Dot grid accent */}
      <div
        style={{
          position: "absolute",
          bottom: "14vh",
          right: "44vw",
          width: "10vw",
          height: "2vw",
          background: "radial-gradient(circle, #24336b 0.5vw, transparent 0.6vw)",
          backgroundSize: "2vw 2vw",
          zIndex: 1,
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          margin: "8vh 8vw",
          width: "calc(100vw - 16vw)",
          height: "calc(100vh - 16vh)",
          backgroundColor: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(1vw)",
          WebkitBackdropFilter: "blur(1vw)",
          borderRadius: "2vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
          padding: "4vh 4vw",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              backgroundColor: "#c6972d",
              padding: "0.8vh 1.5vw",
              borderRadius: "2vw",
              fontSize: "1vw",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.05vw",
            }}
          >
            داخلي — دائرة التخطيط
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
            <div
              style={{
                width: "3vw",
                height: "3vw",
                backgroundColor: "#24336b",
                borderRadius: "0.8vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c6972d",
                fontWeight: 800,
                fontSize: "1.4vw",
              }}
            >
              ح
            </div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#24336b" }}>هيئة حماية المستهلك</div>
          </div>
        </div>

        {/* Title content */}
        <div style={{ maxWidth: "55vw", marginBottom: "auto", marginTop: "10vh" }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.5vh 1.2vw",
              backgroundColor: "#e8edf5",
              borderRadius: "0.5vw",
              fontSize: "1.1vw",
              fontWeight: 700,
              color: "#24336b",
              marginBottom: "2.5vh",
              textTransform: "uppercase",
              letterSpacing: "0.08vw",
            }}
          >
            2026 — عرض تقديمي
          </div>
          <h1
            style={{
              fontSize: "6.2vw",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              color: "#24336b",
              letterSpacing: "-0.05vw",
              textWrap: "balance",
            }}
          >
            منصة دائرة التخطيط التفاعلية
          </h1>
          <p
            style={{
              fontSize: "2.2vw",
              fontWeight: 400,
              color: "#4a5568",
              marginTop: "3vh",
              lineHeight: 1.4,
            }}
          >
            النظام الداخلي الموحد للتواصل والتخطيط والتعاون المعرفي
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "3vh",
            borderTop: "0.15vw solid rgba(36,51,107,0.15)",
          }}
        >
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>
            هيئة حماية المستهلك — للاستخدام الداخلي فقط
          </div>
          <div style={{ display: "flex", gap: "1vw" }}>
            <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", backgroundColor: "#c6972d" }} />
            <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", backgroundColor: "#0ab0a2" }} />
            <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", backgroundColor: "#24336b" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
