import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="max-w-2xl text-center px-6">
        <h1 className="text-5xl font-bold tracking-tight mb-4">Atomized</h1>
        <p className="text-xl text-gray-400 mb-8">
          Intelligence reporting for marketing agencies. Auto-generate strategic
          PowerPoint reports from multi-source data.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold hover:bg-indigo-500 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
