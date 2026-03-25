export default function RootLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f1b2d 0%, #162a58 100%)",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(0, 212, 255, 0.2)",
          borderTopColor: "#00d4ff",
          animation: "spin .7s linear infinite",
        }} />
        <div style={{ color: "rgba(255,255,255,.7)", fontSize: 14, fontWeight: 600 }}>
          กำลังโหลดระบบ...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
