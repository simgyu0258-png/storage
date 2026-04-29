import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "창고 물품 관리 MVP",
  description: "부서 자율 입출고 기반 창고 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}


