import { Check, Minus } from "lucide-react";

const ROWS = [
  { label: "Approach", us: "Compiler", paper: "New canvas", pencil: "IDE canvas" },
  { label: "Figma integration", us: "Bidirectional", paper: "None", pencil: "None" },
  { label: "Designer workflow", us: "Unchanged", paper: "Must re-learn", pencil: "Not involved" },
  { label: "Website extraction", us: true, paper: false, pencil: false },
  { label: "Output formats", us: "6 portable formats", paper: "Proprietary", pencil: ".pen files" },
  { label: "AI agent support", us: "Any (via MCP)", paper: "Built-in only", pencil: "Built-in only" },
  { label: "Open source", us: true, paper: false, pencil: false },
  { label: "Adoption cost", us: "Zero", paper: "High", pencil: "Medium" },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} className="text-emerald-500" />;
  if (value === false) return <Minus size={16} className="text-gray-300" />;
  return <span>{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Why Figma
          </p>
          <h2 className="mb-6 text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight leading-[1.1]">
            We don&apos;t replace Figma.
            <br />
            We make it smarter.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500 leading-relaxed">
            Paper.design asks your designers to learn a new canvas.
            Pencil.dev renders components only inside the IDE.
            Both require adoption. Both create friction. Both ignore
            the tool your design team already knows.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500 leading-relaxed">
            SuperDuper is a compiler, not a canvas. It reads your
            existing Figma files, extracts the design system, and serves
            structured context to your existing AI tools. Nobody changes
            anything. The AI just starts building correctly.
          </p>
        </div>

        {/* TypeScript analogy */}
        <div className="mx-auto mb-16 max-w-2xl rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-8 text-center">
          <p className="text-base leading-relaxed text-gray-700">
            TypeScript didn&apos;t replace JavaScript. It made JavaScript
            smarter by adding a type system on top.{" "}
            <span className="font-semibold text-[#0a0a0a]">
              SuperDuper does the same for Figma
            </span>{" "}
            — it adds an AI context layer on top of files your team already
            uses.
          </p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-2xl border border-black/[0.06]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className="px-6 py-4 font-medium text-gray-500" />
                <th className="px-6 py-4 font-semibold text-[#0a0a0a]">
                  SuperDuper
                </th>
                <th className="px-6 py-4 font-medium text-gray-500">
                  Paper.design
                </th>
                <th className="px-6 py-4 font-medium text-gray-500">
                  Pencil.dev
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ label, us, paper, pencil }, i) => (
                <tr
                  key={label}
                  className={
                    i < ROWS.length - 1 ? "border-b border-black/[0.04]" : ""
                  }
                >
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {label}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#0a0a0a]">
                    <CellValue value={us} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <CellValue value={paper} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <CellValue value={pencil} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing */}
        <p className="mt-12 text-center text-base text-gray-500 leading-relaxed max-w-xl mx-auto">
          Your designers stay in Figma. Your developers stay in their terminal.
          SuperDuper sits invisibly between them, making every AI build on-brand.
        </p>
      </div>
    </section>
  );
}
