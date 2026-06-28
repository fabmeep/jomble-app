"use client";

import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import AuthInputFields from "@/app/(auth)/_components/auth-input-fields";
import AuthSubmitButton from "../_components/auth-submit-buttons";
import GoogleButton from "../_components/google-buttons";
import FormHeader from "../_components/form-headers";
import FormFooter from "../_components/form-footers";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import AuthDivider from "../_components/auth-dividers";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back! Signing you in...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <FormHeader
        title="Welcome back"
        description="Sign in to your Jomble account."
      />

      {/* Google Sign-In */}
      <GoogleButton label="Continue with Google" />

      {/* Divider */}
      <AuthDivider label="continue with email" />

      {/* Global Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary rounded-[9px] text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        {/* Email */}
        <AuthInputFields
          labelName="Email"
          type="email"
          id="login-email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          disabled={loading}
          {...register("email")}
        />

        {/* Password */}
        <AuthInputFields
          labelName="Password"
          id="login-password"
          placeholder="••••••••"
          autoComplete="current-password"
          icon={Lock}
          type="password"
          error={errors.password?.message}
          disabled={loading}
          {...register("password")}
        />

        {/* Submit */}
        <AuthSubmitButton buttonTitle={loading ? "Signing in..." : "Sign in to Jomble"} />
      </form>

      <FormFooter plainText="No account yet?" linkText="Create one free →" href="/register" />
    </div>
  );
}
