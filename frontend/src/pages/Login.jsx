import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, Shield, AlertCircle, Lock, Mail, Smartphone, CheckSquare, Square, QrCode, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import OTPInput from "../components/ui/OTPInput";
import LanguageSelector from "../components/ui/LanguageSelector";
import api from "../api/client";
import toast from "react-hot-toast";

// DotMap — Animasyonlu Dünya Haritası ve Canlı Rota Çizgileri Canvas Bileşeni
const DotMap = () => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const routes = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 }, color: "#2563eb" },
    { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 }, color: "#2563eb" },
    { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 }, color: "#2563eb" },
    { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 }, color: "#2563eb" },
  ];

  const generateDots = (width, height) => {
    const dots = [];
    const gap = 12;
    const dotRadius = 1;

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const isInMapShape =
          ((x < width * 0.25 && x > width * 0.05) && (y < height * 0.4 && y > height * 0.1)) ||
          ((x < width * 0.25 && x > width * 0.15) && (y < height * 0.8 && y > height * 0.4)) ||
          ((x < width * 0.45 && x > width * 0.3) && (y < height * 0.35 && y > height * 0.15)) ||
          ((x < width * 0.5 && x > width * 0.35) && (y < height * 0.65 && y > height * 0.35)) ||
          ((x < width * 0.7 && x > width * 0.45) && (y < height * 0.5 && y > height * 0.1)) ||
          ((x < width * 0.8 && x > width * 0.65) && (y < height * 0.8 && y > height * 0.6));

        if (isInMapShape && Math.random() > 0.3) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.5 + 0.2,
          });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId;
    let startTime = Date.now();

    function drawDots() {
      if (!ctx) return;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${dot.opacity})`;
        ctx.fill();
      });
    }

    function drawRoutes() {
      if (!ctx) return;
      const currentTime = (Date.now() - startTime) / 1000;

      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;

        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);

        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }

    function animate() {
      drawDots();
      drawRoutes();

      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) {
        startTime = Date.now();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default function Login() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  // step: 'credentials' | 'setup_2fa' | 'verify_2fa'
  const [step, setStep] = useState("credentials");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("admin@txtoolbox.com");
  const [password, setPassword] = useState("Admin123!");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  // 2FA state'leri
  const [twoFAData, setTwoFAData] = useState({
    qrCodeDataUrl: null,
    recoveryCodes: [],
    setupToken: null,
    loginToken: null,
  });
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const handleCredentials = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const d = data.data;

      if (d.step === "SETUP_2FA") {
        // İlk giriş: QR kurulum zorunlu
        setTwoFAData({
          qrCodeDataUrl: d.qrCodeDataUrl,
          recoveryCodes: d.recoveryCodes || [],
          setupToken: d.setupToken,
          loginToken: null,
        });
        setStep("setup_2fa");
        toast(t("login.securitySetupRequired"), { icon: "🔐" });
      } else if (d.step === "VERIFY_2FA" || d.requires2FA) {
        // Kurulu 2FA doğrulama (geriye dönük uyumluluk)
        setTwoFAData(prev => ({
          ...prev,
          loginToken: d.loginToken || d.tempToken,
        }));
        setStep("verify_2fa");
        toast(t("login.twoFactorRequired"), { icon: "🔐" });
      } else {
        // Direkt giriş (2FA kurulmuş ve doğrulanmış durum yoksa)
        login(d.token, d.refreshToken, d.user);
        toast.success(t("login.welcomeUser", { name: d.user.name }));
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || t("login.loginFailedCheck"));
    } finally {
      setLoading(false);
    }
  };

  // 2FA kurulum tamamlama (ilk giriş sonrası QR ekranı)
  const handleSetup2FA = async () => {
    if (!recoveryAcknowledged) {
      setError(t("login.confirmRecoveryCodes"));
      return;
    }
    if (otpCode.length !== 6) {
      setError(t("login.enter6DigitCode"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/setup-2fa", {
        setupToken: twoFAData.setupToken,
        code: otpCode,
      });
      login(data.data.token, data.data.refreshToken, data.data.user);
      toast.success(t("login.twoFaActivatedWelcome", { name: data.data.user.name }));
    } catch (err) {
      setError(err.response?.data?.error?.message || t("login.verifyFailed"));
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  // 2FA kod doğrulama (sonraki girişler)
  const handleVerify2FA = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        loginToken: twoFAData.loginToken,
        ...(recoveryMode
          ? { recoveryCode: recoveryCode.toUpperCase().trim() }
          : { code: otpCode }),
      };
      const { data } = await api.post("/auth/verify-2fa", payload);
      login(data.data.token, data.data.refreshToken, data.data.user);
      toast.success(t("login.welcomeUser", { name: data.data.user.name }));
    } catch (err) {
      setError(err.response?.data?.error?.message || t("login.codeExpired"));
      setOtpCode("");
      setRecoveryCode("");
    } finally {
      setLoading(false);
    }
  };

  const resetToCredentials = () => {
    setStep("credentials");
    setError("");
    setOtpCode("");
    setRecoveryCode("");
    setRecoveryMode(false);
    setRecoveryAcknowledged(false);
    setTwoFAData({ qrCodeDataUrl: null, recoveryCodes: [], setupToken: null, loginToken: null });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl rounded-2xl flex bg-white shadow-xl"
        style={{ border: '1px solid #CBD5E1', overflow: 'hidden', alignItems: 'stretch' }}
      >
        {/* SOL KOLON: DOTMAP ANİMASYONLU TUVAL — step'e göre min yükseklik */}
        <div className="hidden md:flex md:flex-col w-1/2 relative overflow-hidden border-r border-gray-100" style={{ minHeight: '580px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100">
            <DotMap />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-4"
              >
                <span style={{ fontSize: '3.5rem', display: 'block', textAlign: 'center' }}>🔐</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mb-1"
              >
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                  OTP MANAGER
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-xs text-gray-600 max-w-xs leading-relaxed mt-2"
              >
                {t("login.tagline")}
              </motion.p>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON — step'e göre scroll destekli */}
        <div
          className="w-full md:w-1/2 bg-white"
          style={{
            padding: '2rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justify: step === 'credentials' ? 'center' : 'flex-start',
            overflowY: 'auto',
            maxHeight: '90vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Adım İndikatörü + Dil Seçici */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  step === "credentials" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-400"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  {t("auth.user")}
                </span>
                <span className="text-gray-300 text-xs">→</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  step === "setup_2fa" ? "bg-violet-100 text-violet-700 border border-violet-200" : "bg-gray-100 text-gray-400"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">2</span>
                  {t("common.system")}
                </span>
                <span className="text-gray-300 text-xs">→</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  step === "verify_2fa" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-gray-100 text-gray-400"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                  {t("login.verification")}
                </span>
              </div>
              <LanguageSelector />
            </div>

            <h1 className="text-2xl font-bold mb-1 text-gray-800">
              {step === "credentials" && t("login.titleCredentials")}
              {step === "setup_2fa" && t("login.titleSetup2FA")}
              {step === "verify_2fa" && t("login.titleVerify2FA")}
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              {step === "credentials" && t("login.subCredentials")}
              {step === "setup_2fa" && t("login.subSetup2FA")}
              {step === "verify_2fa" && t("login.subVerify2FA")}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === "credentials" && (
              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    {t("login.emailLabel")} <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@txtoolbox.com"
                      required
                      className="w-full flex h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    {t("login.passwordLabel")} <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full flex h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 pr-10 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                  className="pt-2"
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r relative overflow-hidden from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2.5 rounded-lg transition-all duration-300 text-sm ${
                      isHovered ? "shadow-lg shadow-blue-200" : ""
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? t("login.loggingIn") : t("login.loginBtn")}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    {isHovered && (
                      <motion.span
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ filter: "blur(8px)" }}
                      />
                    )}
                  </button>
                </motion.div>
              </form>
            )}

            {/* ─── SETUP_2FA: İlk giriş — Zorunlu QR Kurulum ─── */}
            {step === "setup_2fa" && (
              <div className="space-y-4">
                {/* Google Authenticator indirme */}
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                  <p className="text-xs font-bold text-violet-800 mb-2 flex items-center gap-1.5">
                    <Smartphone size={14} /> {t("login.step1")}
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                      target="_blank" rel="noreferrer"
                      className="flex-1 text-center text-xs bg-white border border-violet-200 rounded-md py-1.5 px-2 text-violet-700 font-semibold hover:bg-violet-50 transition-colors"
                    >
                      📱 Android
                    </a>
                    <a
                      href="https://apps.apple.com/app/google-authenticator/id388497605"
                      target="_blank" rel="noreferrer"
                      className="flex-1 text-center text-xs bg-white border border-violet-200 rounded-md py-1.5 px-2 text-violet-700 font-semibold hover:bg-violet-50 transition-colors"
                    >
                      🍏 iPhone
                    </a>
                  </div>
                </div>

                {/* QR Kod */}
                {twoFAData.qrCodeDataUrl && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-xs font-bold text-gray-700 mb-2 flex items-center justify-center gap-1.5">
                      <QrCode size={14} /> {t("login.step2")}
                    </p>
                    <img
                      src={twoFAData.qrCodeDataUrl}
                      alt="2FA QR Kodu"
                      className="w-36 h-36 mx-auto rounded-lg border-2 border-gray-200"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Google Authenticator → + → QR Kodu Tara</p>
                  </div>
                )}

                {/* Kurtarma Kodları */}
                {twoFAData.recoveryCodes.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                      <KeyRound size={14} /> {t("login.step3")}
                    </p>
                    <p className="text-[10px] text-amber-700 mb-2">
                      {t("login.recoveryWarning")}
                    </p>
                    <div className="grid grid-cols-2 gap-1 mb-3">
                      {twoFAData.recoveryCodes.map((code, i) => (
                        <code
                          key={i}
                          className="bg-white border border-amber-200 rounded px-2 py-1 text-xs font-mono text-amber-900 text-center tracking-wider"
                        >
                          {code}
                        </code>
                      ))}
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setRecoveryAcknowledged(!recoveryAcknowledged)}
                        className="mt-0.5 flex-shrink-0 text-amber-600"
                      >
                        {recoveryAcknowledged
                          ? <CheckSquare size={16} className="text-emerald-600" />
                          : <Square size={16} />}
                      </button>
                      <span className="text-[11px] text-amber-800 font-semibold leading-tight">
                        {t("login.confirmRecoveryCheck")}
                      </span>
                    </label>
                  </div>
                )}

                {/* OTP Giriş */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Shield size={14} /> {t("login.step4")}
                  </p>
                  <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSetup2FA}
                  disabled={loading || otpCode.length !== 6 || !recoveryAcknowledged}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? t("login.activating") : t("login.activateAndLogin")}
                </button>

                <button
                  type="button"
                  onClick={resetToCredentials}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                >
                  {t("login.back")}
                </button>
              </div>
            )}

            {/* ─── VERIFY_2FA: Sonraki girişler ─── */}
            {step === "verify_2fa" && (
              <div className="space-y-4">
                {!recoveryMode ? (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                        {t("login.openApp")}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                        {t("login.enterCodeHeader")}
                      </div>
                      <OTPInput value={otpCode} onChange={setOtpCode} autoFocus disabled={loading} />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerify2FA}
                      disabled={loading || otpCode.length !== 6}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? t("login.verifying") : t("login.verifyAndLogin")}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setRecoveryMode(true); setError(""); setOtpCode(""); }}
                      className="w-full text-xs text-indigo-500 hover:text-indigo-700 py-1 font-semibold"
                    >
                      {t("login.cannotAccessPhone")}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-1.5">
                        <KeyRound size={14} /> {t("login.recoveryTitle")}
                      </p>
                      <p className="text-[11px] text-amber-700 mb-3">
                        {t("login.recoverySub")}
                      </p>
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="A1B2C3D4"
                        maxLength={8}
                        autoFocus
                        className="w-full text-center font-mono text-lg font-bold tracking-[0.3em] h-12 rounded-md border-2 border-amber-200 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerify2FA}
                      disabled={loading || recoveryCode.length < 6}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? t("login.verifying") : t("login.loginWithRecovery")}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setRecoveryMode(false); setError(""); setRecoveryCode(""); }}
                      className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                    >
                      {t("login.backToNormalCode")}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={resetToCredentials}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-0.5"
                >
                  {t("login.backToCredentials")}
                </button>
              </div>
            )}

            <div className="text-center mt-8 text-[11px] text-gray-400">
              {t("login.copyright")}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
