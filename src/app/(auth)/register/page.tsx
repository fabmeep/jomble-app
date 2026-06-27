"use client";

import { useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import AuthInputFields from "@/app/(auth)/_components/auth-input-fields";
import AuthSubmitButton from "@/app/(auth)/_components/auth-submit-buttons";
import GoogleButton from "../_components/google-buttons";
import FormFooter from "../_components/form-footers";
import AuthDivider from "../_components/auth-dividers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import FormHeader from "../_components/form-headers";

const registerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormInput = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = watch("password", "");

  // Calculate password strength score (0 to 4)
  const getPasswordStrength = (val: string) => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  const getStrengthMeta = (score: number) => {
    const levels = ["", "weak", "weak", "medium", "strong"];
    const labels = [
      "Enter a password",
      "Too short",
      "Could be stronger",
      "Almost there",
      "Strong password",
    ];
    // Color mapping
    const textColors = [
      "text-muted-foreground", // Enter a password
      "text-primary",           // Too short (coral)
      "text-primary",           // Could be stronger (coral)
      "text-accent",            // Almost there (amber)
      "text-[#2E7D32]",         // Strong password (green)
    ];

    const barColors = [
      "bg-border",  // Empty
      "bg-primary", // Weak
      "bg-primary", // Weak
      "bg-accent",  // Medium
      "bg-[#2E7D32]", // Strong
    ];

    return {
      level: levels[score],
      label: labels[score],
      textColor: textColors[score],
      barColor: barColors[score],
    };
  };

  const strengthMeta = getStrengthMeta(strengthScore);

  const onSubmit = async (data: RegisterFormInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in on success
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Account created, but automatic sign-in failed. Please sign in manually.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <FormHeader
        title="Start tracking"
        description="Create your free account"
      />

      {/* Google Sign-Up */}
      <GoogleButton label="Sign up with Google" />

      {/* Divider */}
      <AuthDivider label="use email" />

      {/* Global Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary rounded-[9px] text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          {/* First Name */}
          <AuthInputFields
            labelName="First Name"
            type="text"
            id="reg-first"
            placeholder="John"
            autoComplete="given-name"
            icon={User}
            error={errors.firstName?.message}
            disabled={loading}
            {...register("firstName")}
          />

          {/* Last Name */}
          <AuthInputFields
            labelName="Last Name"
            type="text"
            id="reg-last"
            placeholder="Doe"
            autoComplete="family-name"
            icon={User}
            error={errors.lastName?.message}
            disabled={loading}
            {...register("lastName")}
          />
        </div>

        {/* Email */}
        <AuthInputFields
          labelName="Email"
          type="email"
          id="reg-email"
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
          type="password"
          id="reg-password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          icon={Lock}
          error={errors.password?.message}
          disabled={loading}
          {...register("password")}
          bottomElement={
            <>
              {/* Strength Bars */}
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((barNum) => (
                  <div
                    key={barNum}
                    className={`flex-1 h-[3px] rounded-[2px] transition-colors duration-300 ${barNum <= strengthScore ? strengthMeta.barColor : "bg-border"
                      }`}
                  />
                ))}
              </div>
              <span className={`text-[11px] font-medium mt-1 block ${strengthMeta.textColor}`}>
                {strengthMeta.label}
              </span>
            </>
          }
        />

        {/* Submit Button */}
        <AuthSubmitButton buttonTitle={loading ? "Creating account..." : "Create my account"} />
      </form>

      <FormFooter plainText="Already have an account?" linkText="Sign in →" href="/login" />
    </div>
  );
}
