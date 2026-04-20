"use client";

import { useEffect, useState } from "react";

interface FormattedDateProps {
  date: string | Date;
  mode?: "date" | "datetime";
  className?: string;
}

export function FormattedDate({ date, mode = "date", className }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      setFormatted("Invalid Date");
      return;
    }

    if (mode === "datetime") {
      setFormatted(d.toLocaleString());
    } else {
      setFormatted(d.toLocaleDateString());
    }
  }, [date, mode]);

  // Render a placeholder or nothing during hydration to avoid mismatch
  if (!formatted) return <span className={className}>...</span>;

  return <span className={className}>{formatted}</span>;
}
