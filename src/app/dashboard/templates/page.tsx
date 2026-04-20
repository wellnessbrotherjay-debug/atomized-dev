"use client";

import { useState } from "react";
import { 
  Columns, 
  Layout, 
  Plus, 
  Save, 
  Trash2, 
  Settings, 
  Eye,
  Type,
  BarChart3,
  ListFilter,
  Move
} from "lucide-react";

interface WidgetNode {
  id: string;
  type: string;
  title: string;
  w: number;
  h: number;
}

export default function TemplateBuilder() {
  const [templateName, setTemplateName] = useState("Standard Performance Review");
  const [widgets, setWidgets] = useState<WidgetNode[]>([
    { id: "1", type: "kpi_tile", title: "Efficiency Delta", w: 1, h: 1 },
    { id: "2", type: "ai_narrative", title: "Strategic Summary", w: 2, h: 1 },
    { id: "3", type: "time_series_overlay", title: "Performance Analysis", w: 3, h: 2 },
  ]);

  const addWidget = (type: string) => {
    setWidgets([...widgets, { id: Date.now().toString(), type, title: `New ${type}`, w: 1, h: 1 }]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Builder Top Bar */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <Layout className="w-5 h-5 text-indigo-400" />
          </div>
          <input 
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent text-lg font-bold border-none focus:outline-none focus:ring-0 text-white w-64"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors border border-gray-800 rounded-xl">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-white text-black rounded-xl hover:bg-gray-200 transition-all active:scale-95">
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Components */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/30 p-6 space-y-8 overflow-y-auto">
          <div>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Metric Elements</h4>
            <div className="grid grid-cols-1 gap-2">
              <ComponentButton icon={<ListFilter className="w-4 h-4" />} label="KPI Tile" onClick={() => addWidget('kpi_tile')} />
              <ComponentButton icon={<BarChart3 className="w-4 h-4" />} label="Data Table" onClick={() => addWidget('comparison_table')} />
              <ComponentButton icon={<Type className="w-4 h-4" />} label="Text Block" onClick={() => addWidget('markdown_block')} />
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Signal AI Elements</h4>
            <div className="grid grid-cols-1 gap-2">
              <ComponentButton icon={<Settings className="w-4 h-4" />} label="AI Narrative" onClick={() => addWidget('ai_narrative')} />
              <ComponentButton icon={<Plus className="w-4 h-4" />} label="Insight Panel" onClick={() => addWidget('insight_panel')} />
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-950 p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto border-2 border-dashed border-gray-800 rounded-[40px] min-h-[1000px] p-8 bg-gray-900/10">
            <div className="grid grid-cols-3 gap-6">
              {widgets.map((widget) => (
                <div 
                  key={widget.id} 
                  className={`relative p-6 rounded-3xl border border-gray-800 bg-gray-900/50 group hover:border-indigo-500/50 transition-all ${
                    widget.w === 2 ? 'col-span-2' : widget.w === 3 ? 'col-span-3' : 'col-span-1'
                  }`}
                  style={{ height: widget.h * 180 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4 text-gray-700 cursor-move" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{widget.title}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:text-indigo-400"><Settings className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="h-full w-full bg-gray-950/40 rounded-xl border border-gray-800/50 flex items-center justify-center">
                    <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">{widget.type} Viewport</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-800 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-sm font-bold text-gray-400 hover:text-white"
    >
      <div className="p-1.5 bg-gray-950 rounded-lg">{icon}</div>
      {label}
    </button>
  );
}
