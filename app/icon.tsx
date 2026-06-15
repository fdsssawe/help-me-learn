import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
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
          fontSize: 44,
          fontWeight: 800,
          fontFamily: "serif",
          borderRadius: 14,
        }}
      >
        L
      </div>
    ),
    size
  )
}
