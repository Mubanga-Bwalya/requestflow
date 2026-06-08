import { LoginBrandArt } from "@/components/login/login-brand-art";

export function LoginBrandingPanel() {
  return (
    <div className="rf-login-brand relative hidden min-h-screen overflow-hidden md:block">
      <LoginBrandArt />

      <div className="relative z-10 flex min-h-screen flex-col justify-end px-10 py-12 lg:px-14 lg:pb-16">
        <div className="max-w-md space-y-5">
          <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            create <span className="text-brand-lime">your</span> world
          </h2>
          <p className="text-base leading-relaxed text-white/95 sm:text-lg">
            Together, we <span className="font-bold text-brand-lime">connect</span> ideas, people and{" "}
            <span className="font-bold text-brand-lime">possibilities</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginMobileHeader() {
  return (
    <div className="rf-login-brand relative min-h-[140px] overflow-hidden px-6 py-6 md:hidden">
      <LoginBrandArt />
      <p className="relative z-10 mt-auto text-lg font-extrabold text-white">
        create <span className="text-brand-lime">your</span> world
      </p>
    </div>
  );
}
