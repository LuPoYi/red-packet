import "./globals.css"
import "@rainbow-me/rainbowkit/styles.css"

import { Fredoka } from "next/font/google"
import type { Metadata } from "next"
import { Providers } from "./providers"

const fredoka = Fredoka({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Red Packet",
  description: "RedRedRed Packet",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={fredoka.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
