import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { PinGate } from "@/components/auth/pin-gate";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mood Tracker",
  description: "Track your mood, habits, journal, and meditation",
};

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem("moodtracker-theme");
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full font-sans text-foreground">
        <PinGate>{children}</PinGate>
      </body>
    </html>
  );
}
