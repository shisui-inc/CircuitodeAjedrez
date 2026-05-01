import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
