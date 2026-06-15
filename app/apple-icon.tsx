import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C85A2E",
          color: "#F6EFE3",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: "serif",
        }}
      >
        L
      </div>
    ),
    size
  )
}
