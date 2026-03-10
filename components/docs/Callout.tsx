import { Info, AlertTriangle, Lightbulb } from "lucide-react";

interface CalloutProps {
  type: "info" | "warning" | "tip";
  children: React.ReactNode;
}

const styles = {
  info: {
    wrapper: "border-l-indigo-500 bg-indigo-50",
    icon: <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />,
  },
  warning: {
    wrapper: "border-l-amber-500 bg-amber-50",
    icon: <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />,
  },
  tip: {
    wrapper: "border-l-emerald-500 bg-emerald-50",
    icon: <Lightbulb size={16} className="text-emerald-500 mt-0.5 shrink-0" />,
  },
} as const;

export function Callout({ type, children }: CalloutProps) {
  const { wrapper, icon } = styles[type];

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${wrapper}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="text-sm text-gray-700">{children}</div>
      </div>
    </div>
  );
}
