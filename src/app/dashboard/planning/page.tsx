export default function PlanningPage() {
  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Media Planning</h1>
        <p className="text-gray-400 mt-1">Manage budget allocations and KPI targets across platforms.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <a 
          href="/dashboard/planning/messaging"
          className="group rounded-2xl border border-gray-800 bg-gray-900/40 p-8 hover:bg-gray-900/60 hover:border-indigo-500/50 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Messaging & Prompt Versioning</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Track ad copy iterations, AI prompts, and campaign hooks. Connect strategic intent to creative output.
          </p>
          <div className="mt-6 flex items-center text-xs font-bold text-indigo-400 uppercase tracking-widest gap-2">
            Configure Messaging <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </a>

        <div className="group rounded-2xl border border-gray-800 bg-gray-900/20 p-8 opacity-60">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-8 13h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Media Plans <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded ml-2">Coming Soon</span></h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Budget matrices and KPI target mapping across Google, Meta, and GA4.
          </p>
        </div>
      </div>
    </div>
  );
}
