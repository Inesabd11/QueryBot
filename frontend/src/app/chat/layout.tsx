import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QueryBot - AI-powered Document Chat",
  description: "Chat with your documents using RAG and LLM technology",
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}