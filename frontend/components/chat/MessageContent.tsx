"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageContentProps {
  content: string;
  role: "user" | "assistant";
}

export default function MessageContent({ content, role }: MessageContentProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (role === "user") {
    // For user messages, render as plain text with line breaks
    return (
      <div className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed">
        {content}
      </div>
    );
  }

  // For assistant messages, render as markdown
  return (
    <div className="prose prose-sm max-w-none text-gray-900 dark:text-white leading-relaxed dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          code({
            className,
            children,
            ...props
          }: {
            className?: string;
            children?: React.ReactNode;
          }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeId = crypto.randomUUID();
            const codeContent = String(children).replace(/\n$/, "");

            if (className?.includes("language-")) {
              return (
                <div className="relative group">
                  <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-700 text-gray-200 dark:text-gray-300 px-4 py-2 rounded-t-lg text-sm">
                    <span className="font-medium">{match?.[1]}</span>
                    <button
                      onClick={() => copyToClipboard(codeContent, codeId)}
                      className="flex items-center space-x-1 text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors"
                    >
                      {copiedCode === codeId ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-200 p-4 rounded-b-lg overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom paragraph styling
          p({ children }) {
            return (
              <p className="mb-3 last:mb-0 text-gray-900 dark:text-white">
                {children}
              </p>
            );
          },
          // Custom heading styling
          h1({ children }) {
            return (
              <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">
                {children}
              </h3>
            );
          },
          // Custom list styling
          ul({ children }) {
            return (
              <ul className="list-disc list-inside mb-3 space-y-1 text-gray-900 dark:text-white">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-900 dark:text-white">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return (
              <li className="text-gray-900 dark:text-white">{children}</li>
            );
          },
          // Custom blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-3">
                {children}
              </blockquote>
            );
          },
          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-3">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-white">
                {children}
              </td>
            );
          },
          // Custom link styling
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
