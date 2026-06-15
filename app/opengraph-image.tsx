import { ImageResponse } from "next/og"
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6EFE3",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#C85A2E",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 44,
            color: "#5A4636",
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    size
  )
}
