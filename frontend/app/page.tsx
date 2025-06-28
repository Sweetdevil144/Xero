import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { MessageSquare, Sparkles, Shield, Zap } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-black" />
              <span className="text-xl font-semibold text-black">Xero</span>
            </div>
            <SignInButton mode="modal">
              <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-black mb-6">
            AI-Powered
            <span className="block text-gray-600">Conversations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the power of advanced AI with memory, file uploads, and
            seamless conversations. Built with modern technology for the best
            user experience.
          </p>

          <SignInButton mode="modal">
            <button className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg inline-flex items-center space-x-2">
              <span>Get Started</span>
              <Sparkles className="h-5 w-5" />
            </button>
          </SignInButton>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="bg-black/5 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Smart Conversations
            </h3>
            <p className="text-gray-600">
              Engage in natural conversations with AI that remembers context and
              learns from your interactions.
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="bg-black/5 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Secure & Private
            </h3>
            <p className="text-gray-600">
              Your conversations are protected with enterprise-grade security
              and authentication.
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="bg-black/5 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-600">
              Experience real-time responses with streaming AI and optimized
              performance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
