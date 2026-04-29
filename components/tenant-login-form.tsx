"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { login } from "@/app/(auth)/login/actions";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { Loader2Icon, CheckCircle2, Eye, EyeOff } from "lucide-react";

function isNextRedirectError(error: unknown): boolean {
  const maybeError = error as { digest?: unknown }
  return typeof maybeError?.digest === "string" && maybeError.digest.startsWith("NEXT_REDIRECT")
}

const TenantLoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const urlError = searchParams.get('error');

  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const error: string | void = await login(formData);
      if (error)
        setError(error);
    } catch (error) {
      if (isNextRedirectError(error)) return
      setError("Unable to connect. Please check your internet and try again");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <h1 className="text-[24px] font-semibold text-[#1a1a1a]">
        Welcome Back!
      </h1>
      <p className="mt-1 text-[14px] text-[#888]">
        Sign in to your account
      </p>

      {message === 'password_set' && (
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Password set successfully.
        </div>
      )}

      {urlError === 'no_account' && (
        <div className="mt-5 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
          No account found for this email. Please contact your property manager.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-[#444]">
              Your Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className="h-[46px] border-[#ccc] bg-[#f5f5f5] rounded-xl text-[14px] placeholder:text-[#aaa] focus-visible:border-[#0d9488] focus-visible:ring-0 focus-visible:bg-white transition-colors"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-[#444]">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="h-[46px] border-[#ccc] bg-[#f5f5f5] rounded-xl pr-10 text-[14px] placeholder:text-[#aaa] focus-visible:border-[#0d9488] focus-visible:ring-0 focus-visible:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#777] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" className="h-4 w-4 rounded border-[#d0d0d0] data-[state=checked]:bg-[#0d9488] data-[state=checked]:border-[#0d9488]" />
              <label htmlFor="remember" className="text-[13px] text-[#555] cursor-pointer select-none">
                Remember Me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-[13px] text-[#0d9488] hover:text-[#0a7a70] font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          {error && (
            <p className="text-[13px] text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-[46px] bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-[#333] rounded-xl transition-colors"
            disabled={loading}
          >
            {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#e8e8e8]" />
        <span className="text-[12px] text-[#bbb]">or</span>
        <div className="flex-1 h-px bg-[#e8e8e8]" />
      </div>

      {/* Google sign-in */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full h-[46px] flex items-center justify-center gap-2.5 border border-[#e0e0e0] rounded-xl text-[14px] font-medium text-[#333] bg-white hover:bg-[#fafafa] transition-colors disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2Icon className="animate-spin h-4 w-4" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>
    </div>
  )
}

export default TenantLoginForm;
