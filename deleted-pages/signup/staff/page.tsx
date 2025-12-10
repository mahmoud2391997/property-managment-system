// "use client";
// import { Button } from "@/components/ui/button"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Link from "next/link"
// import { signup } from "./actions";
// import { useState } from "react";
// import { Loader2Icon, CheckCircle2 } from "lucide-react";

// const SignupPage = () => {
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string>("");
//   const [success, setSuccess] = useState<boolean>(false);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     const formData = new FormData(e.currentTarget);

//     const result = await signup(formData);
//     if (result?.error) {
//       setError(result.error);
//     } else {
//       setSuccess(true);
//     }

//     setLoading(false);
//   };

//   if (success) {
//     return (
//       <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
//         <Card className="w-full max-w-sm">
//           <CardContent className="pt-6">
//             <div className="flex flex-col items-center gap-4 text-center">
//               <CheckCircle2 className="h-16 w-16 text-green-500" />
//               <h2 className="text-xl font-semibold">Check your email</h2>
//               <p className="text-muted-foreground text-sm">
//                 We&apos;ve sent a confirmation link to your email address. Please click the link to verify your account.
//               </p>
//               <Link href="/login/staff" className="text-sm underline underline-offset-4">
//                 Back to login
//               </Link>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
//       <div className="flex w-full max-w-md flex-col gap-6">
//         <Card>
//           <CardHeader className="text-center">
//             <CardTitle className="text-2xl">Create your account</CardTitle>
//             <CardDescription>
//               Enter your email and password to get started
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit}>
//               <div className="flex flex-col gap-4">
//                 <div className="grid gap-2">
//                   <Label htmlFor="email">Email</Label>
//                   <Input
//                     id="email"
//                     name="email"
//                     type="email"
//                     placeholder="john@example.com"
//                     required
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="password">Password</Label>
//                   <Input
//                     id="password"
//                     name="password"
//                     type="password"
//                     required
//                     minLength={6}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="confirm_password">Confirm Password</Label>
//                   <Input
//                     id="confirm_password"
//                     name="confirm_password"
//                     type="password"
//                     required
//                     minLength={6}
//                   />
//                 </div>

//                 {error && <p className="text-red-600 text-sm">{error}</p>}

//                 <Button type="submit" className="w-full" disabled={loading}>
//                   {loading && <Loader2Icon className="animate-spin" />}
//                   {loading ? 'Creating account...' : 'Sign up'}
//                 </Button>
//               </div>
//               <div className="mt-4 text-center text-sm">
//                 Already have an account?{" "}
//                 <Link href="/login/staff" className="underline underline-offset-4">
//                   Login
//                 </Link>
//               </div>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

// export default SignupPage;
