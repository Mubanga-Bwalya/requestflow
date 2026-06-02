import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center p-6">
      <Card className="w-full">
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-brand-dark">RequestFlow User Portal</h1>
          <p className="text-sm text-slate-600">Foundation is ready. Open the dashboard to continue development.</p>
          <Link href="/dashboard"><Button>Open Dashboard</Button></Link>
        </CardContent>
      </Card>
    </main>
  );
}
