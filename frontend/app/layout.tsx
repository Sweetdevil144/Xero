import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "Xero",
  description: "Xero is a chatbot for your Daily Tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#000000",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#000000",
          fontFamily: "inherit",
        },
        elements: {
          formButtonPrimary:
            "bg-black hover:bg-gray-800 text-white font-medium",
          card: "shadow-lg",
          headerTitle: "text-black font-semibold",
          headerSubtitle: "text-gray-600",
        },
      }}
    >
      <html lang="en">
        <body className="antialiased bg-white dark:bg-gray-900 text-black dark:text-white transition-colors">
          <ThemeProvider>
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
