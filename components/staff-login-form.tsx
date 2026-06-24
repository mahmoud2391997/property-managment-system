"use client";
import { useEffect } from "react";
import { login } from "@/app/(auth)/login/staff/actions";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const LoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  useEffect(() => {
    const autoLogin = async () => {
      const formData = new FormData();
      formData.set('userType', 'staff');
      try {
        await login(formData);
      } catch (error) {
        // Redirect errors are expected
      }
    };
    autoLogin();
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-40", className)} {...props}>
      <div className="flex flex-col items-center gap-3">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-[14px] text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

export default LoginForm;
