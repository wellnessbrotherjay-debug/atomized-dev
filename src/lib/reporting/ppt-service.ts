import pptxgen from "pptxgenjs";

interface ReportData {
  clientName: string;
  projectName: string;
  dateRange: string;
  summary: string;
  metrics: {
    label: string;
    value: string;
    change: string;
  }[];
  strategicNotes: {
    date: string;
    type: string;
    description: string;
  }[];
}

export async function generatePitchDeck(data: ReportData) {
  const pptx = new pptxgen();

  // 1. Title Slide
  let slide1 = pptx.addSlide();
  slide1.background = { fill: "1A1B1E" };
  
  slide1.addText("STRATEGIC PERFORMANCE REVIEW", {
    x: 0.5,
    y: 1.5,
    w: "90%",
    fontSize: 44,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });

  slide1.addText(data.clientName.toUpperCase(), {
    x: 0.5,
    y: 2.2,
    w: "90%",
    fontSize: 24,
    color: "6366F1", // Indigo
    fontFace: "Arial",
  });

  slide1.addText(data.dateRange, {
    x: 0.5,
    y: 4.5,
    w: "90%",
    fontSize: 14,
    color: "9CA3AF",
  });

  // 2. Executive Summary
  let slide2 = pptx.addSlide();
  slide2.addText("Executive Summary", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: "111827" });
  slide2.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: "6366F1", width: 2 } });
  
  slide2.addText(data.summary, {
    x: 0.5,
    y: 1.5,
    w: 8.5,
    fontSize: 16,
    color: "374151",
    bullet: true,
  });

  // 3. Performance Snapshot
  let slide3 = pptx.addSlide();
  slide3.addText("Performance Snapshot", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: "111827" });
  
  data.metrics.forEach((metric, idx) => {
    const xPos = 0.5 + (idx * 3);
    if (idx < 3) {
      slide3.addText(metric.label, { x: xPos, y: 1.5, fontSize: 14, color: "6B7280" });
      slide3.addText(metric.value, { x: xPos, y: 2.0, fontSize: 32, bold: true, color: "111827" });
      slide3.addText(metric.change, { 
        x: xPos, 
        y: 2.5, 
        fontSize: 12, 
        color: metric.change.startsWith("+") ? "10B981" : "EF4444" 
      });
    }
  });

  // 4. Strategic Context Layer (The "Why")
  let slide4 = pptx.addSlide();
  slide4.addText("Strategic Decisions & Impact", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: "111827" });
  
  const rows = [
    ["Date", "Action Type", "Strategic Rationale"].map(text => ({ text })),
    ...data.strategicNotes.map(n => [
      { text: n.date }, 
      { text: n.type.toUpperCase() }, 
      { text: n.description }
    ])
  ];

  slide4.addTable(rows, {
    x: 0.5,
    y: 1.2,
    w: 9.0,
    colW: [1.5, 1.5, 6.0],
    border: { pt: 1, color: "E5E7EB" },
    fill: { color: "F9FAFB" },
    fontSize: 11,
    headerProps: { fill: { color: "F3F4F6" }, bold: true },
  } as any);

  // 5. Final Slide
  let slide5 = pptx.addSlide();
  slide5.background = { fill: "6366F1" };
  slide5.addText("ATOMIZED", {
    x: 0,
    y: 2,
    w: "100%",
    align: "center",
    fontSize: 60,
    bold: true,
    color: "FFFFFF",
  });

  // Save the File
  return pptx.writeFile({ fileName: `Atomized_Pitch_${data.clientName}_${new Date().getTime()}.pptx` });
}
