import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Development bypass: keep the redirect to dashboard as in local changes
  redirect("/dashboard");

  return (
    <main className="flex min-h-screen bg-gray-950 text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Atomized</h1>
            <p className="mt-3 text-gray-400">
              Intelligence reporting for marketing agencies
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-900 border-l border-gray-800">
        <div className="max-w-md px-10 text-center">
          <div className="text-6xl mb-6">&#x26A1;</div>
          <h2 className="text-2xl font-semibold mb-4">
            Auto-generate strategic reports
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Connect your marketing data sources, track media metrics, digital
            outcomes, and business results — then generate PowerPoint reports
            in seconds.
          </p>
        </div>
      </div>
    </main>
  );
}
