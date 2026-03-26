"use client";

export default function ReportsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-400 mt-1">Auto-generate strategic PowerPoint reports</p>
      </div>

      <div className="rounded-lg border border-gray-800 border-dashed p-16 text-center">
        <div className="text-5xl mb-4 opacity-30">&#x1F4CA;</div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Report generation is the next feature. Once you have clients, campaigns,
          and metric data entered, you&apos;ll be able to generate period-over-period
          PowerPoint reports from this page.
        </p>
      </div>
    </div>
  );
}
