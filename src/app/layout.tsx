import type { Metadata } from "next";
import { NEXT_PUBLIC_URL } from "../config";

import "./global.css";
import "@coinbase/onchainkit/styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import dynamic from "next/dynamic";

const OnchainProviders = dynamic(
  () => import("src/components/OnchainProviders"),
  {
    ssr: false,
  }
);

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: "Imperfect Form",
  description: "Squats & Pushups",
  openGraph: {
    title: "Imperfect Squat",
    description: "Built by Papa",
    images: [`${NEXT_PUBLIC_URL}/vibes/vibes-19.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js"></script>
      </head>
      <body className="flex items-center justify-center h-screen w-screen">
        <OnchainProviders>{children}</OnchainProviders>
      </body>
    </html>
  );
}
