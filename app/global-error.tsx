"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0C0C0E] font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#141418]">
            <svg
              className="h-8 w-8 text-[--studio-accent]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#EDEDF4]">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-[rgba(237,237,244,0.5)]">
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-8 rounded-lg bg-[--studio-accent] px-6 py-2.5 text-sm font-medium text-[--text-on-accent] transition-colors hover:bg-[--studio-accent-hover]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
