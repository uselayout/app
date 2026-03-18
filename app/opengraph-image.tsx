import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Layout — The compiler between design systems and AI coding agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0C0C0E",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
          >
            <rect width="32" height="32" rx="8" fill="#E0E0E6" />
            <path
              d="M8 10h16M8 16h10M8 22h13"
              stroke="#0C0C0E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#EDEDF4",
              letterSpacing: "-0.02em",
            }}
          >
            Layout
          </span>
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "rgba(237,237,244,0.7)",
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: "800px",
          }}
        >
          The compiler between design systems and AI coding agents
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "18px",
            color: "rgba(237,237,244,0.5)",
          }}
        >
          layout.design
        </div>
      </div>
    ),
    { ...size }
  );
}
