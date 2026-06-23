"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react";
import { Loader2Icon, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { mockLogin, mockSetCurrentUser } from "@/lib/mock-auth";

const TenantLoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const urlError = searchParams.get('error');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const user = mockLogin(email, password);
      if (user) {
        mockSetCurrentUser(user);
        // Redirect based on user type
        if (user.user_type === 'tenant') {
          router.push('/tenant-dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    }

    setLoading(false);
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

      <p className="text-center text-[12px] text-[#999] mt-6">
        Demo credentials: admin@example.com / admin123
      </p>
    </div>
  )
}

export default TenantLoginForm;
