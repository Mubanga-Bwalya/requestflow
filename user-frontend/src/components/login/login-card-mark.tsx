import { User } from "lucide-react";

/** Simple user mark on the login card (no extra brand SVGs on the white side). */
export function LoginCardMark() {
  return (
    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary">
      <User className="h-7 w-7 text-white" strokeWidth={2.25} aria-hidden />
    </div>
  );
}
