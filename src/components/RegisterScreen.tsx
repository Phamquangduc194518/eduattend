import React, { useState } from "react";
import { TRANSLATIONS, Language, UserRole, AuthUser } from "../types";
import { RegisterInput } from "../services/auth";
import { ApiError } from "../services/apiClient";
import {
  GraduationCap,
  User,
  Globe,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  UserPlus
} from "lucide-react";

interface RegisterScreenProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onRegister: (input: RegisterInput, confirmPassword: string) => Promise<AuthUser>;
  onSuccess: (user: AuthUser) => void;
  onGoToLogin: () => void;
}

type RegisterStep = "portal" | "form";

export default function RegisterScreen({
  language,
  setLanguage,
  onRegister,
  onSuccess,
  onGoToLogin
}: RegisterScreenProps) {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<RegisterStep>("portal");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacher = selectedRole === "teacher";
  const accent = isTeacher
    ? {
        badge: "bg-indigo-50 border-indigo-100 text-indigo-700",
        icon: "bg-indigo-50 text-indigo-600",
        ring: "focus:border-indigo-500 focus:ring-indigo-500/20",
        btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
        gradient: "from-indigo-500 via-purple-500 to-indigo-500"
      }
    : {
        badge: "bg-emerald-50 border-emerald-100 text-emerald-700",
        icon: "bg-emerald-50 text-emerald-600",
        ring: "focus:border-emerald-500 focus:ring-emerald-500/20",
        btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        gradient: "from-emerald-500 via-teal-500 to-emerald-500"
      };

  const resolveError = (code: string) => {
    const map: Record<string, string> = {
      nameRequired: t.registerErrorName,
      emailInvalid: t.registerErrorEmail,
      passwordTooShort: t.registerErrorPassword,
      passwordMismatch: t.registerErrorConfirm,
      emailTaken: t.registerErrorTaken
    };
    return map[code] ?? t.registerErrorGeneric;
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setStep("form");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
  };

  const handleBack = () => {
    if (step === "form") {
      setStep("portal");
      setSelectedRole(null);
      setError("");
      return;
    }
    onGoToLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) return;

    const input: RegisterInput = { name, email, password, role: selectedRole };

    setIsSubmitting(true);
    try {
      const user = await onRegister(input, confirmPassword);
      onSuccess(user);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "registerErrorGeneric";
      setError(resolveError(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-8 relative animate-fade-in">
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
            step === "portal" ? "from-indigo-500 via-purple-500 to-emerald-500" : accent.gradient
          }`}
        />

        <div className="flex justify-between items-center mb-8 mt-2">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              EA
            </div>
            <div>
              <span className="font-bold text-slate-800 tracking-tight block text-lg">EduAttend</span>
              <span className="text-xs text-slate-400 block -mt-1 font-mono tracking-wider uppercase">Register</span>
            </div>
          </div>

          <button
            onClick={() => setLanguage(language === "en" ? "vi" : "en")}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs transition duration-200"
            id="register-lang-selector-btn"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-semibold">{language === "en" ? "VI" : "EN"}</span>
          </button>
        </div>

        {step === "portal" ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex py-1 px-3 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold mb-3 items-center space-x-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>Smart Check-In V2.6</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t.registerTitle}</h2>
              <p className="text-sm text-slate-500 mt-2">{t.registerSubtitle}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSelectRole("teacher")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-500 rounded-2xl group transition-all duration-300 shadow-sm"
                id="register-teacher-btn"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-800">{t.registerAsTeacher}</span>
                    <span className="block text-xs text-slate-400">{t.registerTeacherHint}</span>
                  </div>
                </div>
                <div className="h-7 w-7 rounded-full bg-slate-100 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-all duration-300">
                  →
                </div>
              </button>

              <button
                onClick={() => handleSelectRole("student")}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl group transition-all duration-300 shadow-sm"
                id="register-student-btn"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-800">{t.registerAsStudent}</span>
                    <span className="block text-xs text-slate-400">{t.registerStudentHint}</span>
                  </div>
                </div>
                <div className="h-7 w-7 rounded-full bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-all duration-300">
                  →
                </div>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t.registerHasAccount}{" "}
              <button
                type="button"
                onClick={onGoToLogin}
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                id="go-to-login-btn"
              >
                {t.registerGoLogin}
              </button>
            </p>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors mb-6 group"
              id="register-back-btn"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>{t.registerBack}</span>
            </button>

            <div className="text-center mb-6">
              <div
                className={`inline-flex py-1 px-3 border rounded-full text-xs font-semibold mb-3 items-center space-x-1.5 ${accent.badge}`}
              >
                {isTeacher ? <GraduationCap className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                <span>{isTeacher ? t.loginRoleTeacher : t.loginRoleStudent}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t.registerFormTitle}</h2>
              <p className="text-sm text-slate-500 mt-2">{t.registerFormSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="register-name" className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
                  {t.registerNameLabel}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.registerNamePlaceholder}
                    required
                    autoComplete="name"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${accent.ring}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-email" className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.registerEmailPlaceholder}
                    required
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${accent.ring}`}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{t.registerEmailHint}</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-password" className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.registerPasswordPlaceholder}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-20 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${accent.ring}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-confirm" className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
                  {t.registerConfirmLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="register-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.registerConfirmPlaceholder}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${accent.ring}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed ${accent.btn}`}
                id="register-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.registerSubmitting}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{t.registerButton}</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t.registerHasAccount}{" "}
              <button
                type="button"
                onClick={onGoToLogin}
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {t.registerGoLogin}
              </button>
            </p>
          </>
        )}

        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-slate-300" />
            <span>Secure Academic Compliance Standard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
