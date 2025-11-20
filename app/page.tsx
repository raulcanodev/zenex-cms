"use client";

import { useState } from "react";
import { SignInForm } from "@/components/Auth/SignInForm";
import { SignUpForm } from "@/components/Auth/SignUpForm";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { config } from "@/data/config";

export default function Home() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
        </div>
        <div>
          <h1 className="text-3xl font-bold">{config.appName}</h1>
          <p className="mt-2 text-muted-foreground">
            {isSignIn ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setIsSignIn(false)}
                  className="underline hover:text-foreground"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignIn(true)}
                  className="underline hover:text-foreground"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
        {isSignIn ? <SignInForm /> : <SignUpForm />}
      </div>
    </div>
  );
}
