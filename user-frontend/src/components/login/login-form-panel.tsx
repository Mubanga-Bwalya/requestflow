import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function LoginFormPanel({ children }: Props) {
  return (
    <div className="rf-login-form-side relative flex min-h-0 flex-1 flex-col justify-center px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10 md:min-h-screen lg:px-10">
      <div className="relative mx-auto w-full max-w-[440px] md:hidden">
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark shadow-sm">
            Internal Access Only
          </div>
        </div>
      </div>

      <div className="rf-login-card relative mx-auto w-full max-w-[440px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-magenta" aria-hidden />

        <div className="pt-8">
          <h1 className="text-center text-2xl font-bold tracking-tight text-brand-dark sm:text-[1.65rem]">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-zamtel-muted">Sign in with your Zamtel work account</p>
        </div>

        <div className="mt-7 space-y-5">{children}</div>
        <p className="mt-8 text-center text-xs text-zamtel-muted">© 2026 Zamtel. All rights reserved.</p>
      </div>
    </div>
  );
}
