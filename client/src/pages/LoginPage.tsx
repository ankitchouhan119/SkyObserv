"use client";

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type SignupPayload } from "@/hooks/useAuth";
import { PublicLayout } from "@/components/layout/PublicLayout";

type Mode = "login" | "signup" | "forgot" | "reset";

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="pr-10"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, signup, forgotPassword, resetPassword, user } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  function resetFormFields() {
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    resetFormFields();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const normalizedEmail = email.trim().toLowerCase();
    let message: string | null = null;

    if (mode === "login") {
      if (!normalizedEmail || !password) {
        message = "Email and password are required";
      } else {
        message = await login(normalizedEmail, password);
      }
    } else if (mode === "signup") {
      if (password !== confirmPassword) {
        message = "Passwords do not match";
      } else {
        const payload: SignupPayload = {
          email: normalizedEmail,
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          organisation: organisation.trim(),
          password,
          confirmPassword,
        };
        message = await signup(payload);
      }
    } else if (mode === "forgot") {
      message = await forgotPassword(normalizedEmail);
      if (!message) {
        setInfo("If that email is registered, we sent a 6-digit reset code.");
        setMode("reset");
      }
    } else {
      message = await resetPassword(normalizedEmail, otp.trim(), password);
      if (!message) {
        setInfo("Password updated. Sign in with your new password.");
        setMode("login");
        resetFormFields();
      }
    }

    if (message) setError(message);
    setSubmitting(false);
  }

  const title =
    mode === "login"
      ? "Sign in to continue"
      : mode === "signup"
        ? "Create your account"
        : mode === "forgot"
          ? "Reset your password"
          : "Enter reset code";

  const isSignup = mode === "signup";

  return (
    <PublicLayout minimal>
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/40 flex items-center justify-center p-6">
      <Card
        className={`w-full so-card p-8 shadow-lg ${
          isSignup ? "max-w-lg" : "max-w-md"
        }`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>SkyObserv</h1>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="pl-10"
              />
            </div>
            {mode === "login" && (
              <p className="text-xs text-muted-foreground">
                Sign in with your registered email address.
              </p>
            )}
          </div>

          {isSignup && (
            <>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contactNumber"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organisation">Organisation (optional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="organisation"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    placeholder="Company or team name"
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "reset" && (
            <div className="space-y-2">
              <Label htmlFor="otp">Reset code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                required
              />
            </div>
          )}

          {(mode === "login" || isSignup || mode === "reset") && (
            <PasswordInput
              id="password"
              label={mode === "reset" ? "New password" : "Password"}
              value={password}
              onChange={setPassword}
              placeholder={isSignup || mode === "reset" ? "At least 8 characters" : "Enter password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          )}

          {isSignup && (
            <PasswordInput
              id="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          )}

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => switchMode("forgot")}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {info && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {info}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {mode === "login" && (
              <>
                <Lock className="w-4 h-4 mr-2" />
                {submitting ? "Signing in..." : "Sign in"}
              </>
            )}
            {isSignup && (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {submitting ? "Creating account..." : "Create account"}
              </>
            )}
            {mode === "forgot" && (
              <>
                <Mail className="w-4 h-4 mr-2" />
                {submitting ? "Sending code..." : "Send reset code"}
              </>
            )}
            {mode === "reset" && (
              <>
                <KeyRound className="w-4 h-4 mr-2" />
                {submitting ? "Updating..." : "Update password"}
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {mode === "login" && (
            <>
              No account yet?{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => switchMode("signup")}>
                Sign up
              </button>
            </>
          )}
          {isSignup && (
            <>
              Already have an account?{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => switchMode("login")}>
                Sign in
              </button>
            </>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <>
              Back to{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => switchMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="text-xs text-muted-foreground text-center mt-4">
          <Link href="/docs/overview" className="text-primary hover:underline">Documentation</Link>
          {" · "}
          <Link href="/" className="text-primary hover:underline">Home</Link>
        </p>
      </Card>
    </div>
    </PublicLayout>
  );
}
