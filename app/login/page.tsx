"use client";

import { Eye, EyeOff, LogIn, AlertCircle, User, Lock } from "lucide-react";

import { useRouter } from "next/navigation";
import Image from "next/image";

import { useState, useEffect } from "react";


import { useAuth, getDefaultRoute } from "../context/AuthContext";
import type { UserProfile, UserRole } from "./types";

/* ─── 3D Cube Transition Screen ─── */
function TransitionScreen({ targetRoute }: { targetRoute: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const dur = 2500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / dur) * 100);
      setProgress(pct);
      if (elapsed < dur) requestAnimationFrame(tick);
      else {
        setFadeOut(true);
        setTimeout(() => router.push(targetRoute), 400);
      }
    };
    requestAnimationFrame(tick);
  }, [router, targetRoute]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(135deg, #0a1628 0%, #0f2044 40%, #162a58 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: fadeOut ? 0 : 1, transition: "opacity .4s ease",
    }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "20%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "25%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* 3D Cube Grid */}
      <div style={{ perspective: 600, marginBottom: 40 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 44px)", gap: 6,
          transformStyle: "preserve-3d",
          transform: "rotateX(25deg) rotateY(-25deg)",
        }}>
          {Array.from({ length: 9 }).map((_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const delay = (row + col) * 0.12;
            return (
              <div key={i} style={{
                width: 44, height: 44,
                background: `linear-gradient(135deg, rgba(0,212,255,${0.15 + (i * 0.04)}) 0%, rgba(30,47,69,0.9) 100%)`,
                border: "1px solid rgba(0,212,255,0.18)",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                transformStyle: "preserve-3d",
                animation: `cubeAssemble 2s ${delay}s ease-in-out infinite`,
              }} />
            );
          })}
        </div>
      </div>

      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,.85)", letterSpacing: "1.5px" }}>
          STS — Student Tracking System
        </div>
        <div style={{ fontSize: 12, color: "rgba(184,208,248,.5)", marginTop: 6, fontWeight: 500 }}>
          กำลังเตรียมข้อมูล Dashboard...
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 240, height: 4, borderRadius: 4, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <div style={{
          width: `${progress}%`, height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, #00d4ff, #6366f1)",
          transition: "width .1s linear",
          boxShadow: "0 0 12px rgba(0,212,255,.4)",
        }} />
      </div>
      <div style={{ fontSize: 10, color: "rgba(184,208,248,.35)", marginTop: 8, fontWeight: 600 }}>
        {Math.round(progress)}%
      </div>

      <style>{`
        @keyframes cubeAssemble {
          0% { transform: translateZ(0px) scale(1); opacity: 0.5; }
          20% { transform: translateZ(30px) scale(1.08); opacity: 1; }
          40% { transform: translateZ(30px) scale(1.08); opacity: 1; }
          60% { transform: translateZ(0px) scale(1); opacity: 0.5; }
          100% { transform: translateZ(0px) scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [transition, setTransition] = useState<{ route: string } | null>(null);
  const { loginByUsername } = useAuth();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      return;
    }

    setLoading(true);

    try {
      const profile = await loginByUsername(username.trim(), password);
      if (profile) {
        setTransition({ route: getDefaultRoute(profile.role) });
      } else {
        setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };


  /* Show transition screen */
  if (transition) {
    return <TransitionScreen targetRoute={transition.route} />;
  }


  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">

      {/* Left — Branding (light background with school image) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <Image src="/school.jpg" alt="" fill className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="flex flex-col items-center gap-6 relative z-10">
          <Image src="/sts.png" alt="STS Logo" width={140} height={140} className="drop-shadow-xl" />
          <div className="text-center">
            <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
              Student Tracking<br />System
            </h1>
            <p className="text-white/70 text-base mt-3">ระบบติดตามและช่วยเหลือผู้เรียน</p>
          </div>
          <p className="text-white/40 text-xs mt-8">
            สำนักปลัดกระทรวงศึกษาธิการ &copy; 2026
          </p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        {/* Decorative blobs (right side only) */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-60 -left-40 w-96 h-96 rounded-full bg-indigo-500/[0.07] blur-3xl pointer-events-none" />
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/sts.png" alt="STS Logo" width={80} height={80} className="mx-auto mb-4 drop-shadow-2xl" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Student Tracking System</h1>
            <p className="text-slate-500 text-sm mt-1">ระบบติดตามและช่วยเหลือผู้เรียน</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">เข้าสู่ระบบ</h2>
              <p className="text-slate-500 text-sm mt-1">ลงชื่อเข้าใช้เพื่อเข้าถึงระบบ</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  ชื่อผู้ใช้งาน
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    placeholder="กรอกชื่อผู้ใช้งาน"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-800 text-blue-500"
                  />
                  จดจำการเข้าใช้งาน
                </label>
                <a
                  href="#"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/70" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900/50 px-2 text-slate-500">หรือ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.alert("ไม่สามารถเข้าสู่ระบบด้วย ThaiD ได้ในขณะนี้ (ยังทำไม่ได้)")}
                className="w-full bg-white/90 hover:bg-white text-slate-800 font-medium py-2.5 rounded-lg border border-slate-200/80 transition-colors flex items-center justify-center gap-2"
              >
                <Image src="/thaid.png" alt="ThaiD" width={18} height={18} className="rounded-sm" />
                เข้าสู่ระบบด้วย ThaiD
              </button>
            </form>


          </div>

          {/* Footer (mobile) */}
          <p className="text-center text-slate-600 text-xs mt-6 lg:hidden">
            สำนักปลัดกระทรวงศึกษาธิการ &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
