import { LOGIN_BRAND_ASSETS } from "@/lib/login-brand-assets";

/** Brand panel art: come-home device plus subtle circular Zamtel-inspired graphics. */
export function LoginBrandArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-20 top-[12%] h-56 w-56 rounded-full border border-white/10 bg-white/[0.04]" />
      <div className="absolute -right-16 top-[6%] h-44 w-44 rounded-full border-2 border-brand-lime/25 bg-brand-lime/[0.06] max-[380px]:hidden" />
      <div className="absolute bottom-[28%] left-[8%] h-28 w-28 rounded-full border border-white/15 bg-brand-primary/20" />

      {/* Controlled magenta arc accent */}
      <div className="absolute right-[12%] top-[38%] h-36 w-36 rounded-full border-[3px] border-transparent border-t-brand-magenta/70 border-r-brand-magenta/35 rotate-[35deg]" />
      <div className="absolute right-[18%] top-[42%] h-20 w-20 rounded-full bg-brand-magenta/10 blur-sm" />

      <div className="relative flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center px-8 pb-4 pt-12">
          <img
            src={LOGIN_BRAND_ASSETS.comeHome}
            alt=""
            className="rf-login-come-home relative z-[1] h-auto w-full max-w-[min(340px,72%)] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
