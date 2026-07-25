import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawMuse 宠物品牌设计助手",
  description: "为宠物门店生成品牌视觉与平台运营素材。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
