"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, Zap, Brain, Sparkles, Key, X } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
  maxTokens: number;
  isFree: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
  provider: string;
  modelName: string;
}

function ApiKeyModal({
  isOpen,
  onClose,
  onSubmit,
  provider,
  modelName,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const cachedKey = localStorage.getItem(`${provider}_api_key`);
      if (cachedKey) {
        setApiKey(cachedKey);
      }
    }
  }, [isOpen, provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("Please enter a valid API key");
      return;
    }

    localStorage.setItem(`${provider}_api_key`, apiKey.trim());
    onSubmit(apiKey.trim());
    onClose();
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "openai":
        return "OpenAI";
      case "gemini":
        return "Google Gemini";
      case "claude":
        return "Anthropic Claude";
      default:
        return provider;
    }
  };

  const getApiKeyPlaceholder = (provider: string) => {
    switch (provider) {
      case "openai":
        return "sk-...";
      case "gemini":
        return "AI...";
      case "claude":
        return "sk-ant-...";
      default:
        return "Enter API key";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Premium Model Access
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            For premium model <strong>{modelName}</strong>, please use your own
            API key.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            For premium and paid model testing, please use your own API key
            (preferred). Your API key will be stored locally in your browser for
            convenience.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {getProviderName(provider)} API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError("");
                }}
                placeholder={getApiKeyPlaceholder(provider)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Use Model
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [pendingModel, setPendingModel] = useState<Model | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadModels();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const loadModels = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await apiClient.getAvailableModels(token);
      setModels(data.models || []);
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return <Zap className="h-4 w-4 text-green-600" />;
      case "gemini":
        return <Sparkles className="h-4 w-4 text-blue-600" />;
      case "claude":
        return <Brain className="h-4 w-4 text-purple-600" />;
      default:
        return <Zap className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProviderColor = (provider: string, isFree: boolean) => {
    if (isFree) {
      switch (provider) {
        case "openai":
          return "bg-green-50 text-green-700 border-green-200";
        case "gemini":
          return "bg-blue-50 text-blue-700 border-blue-200";
        case "claude":
          return "bg-purple-50 text-purple-700 border-purple-200";
        default:
          return "bg-gray-50 text-gray-700 border-gray-200";
      }
    } else {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  const handleModelSelect = (model: Model) => {
    if (model.isFree) {
      onModelChange(model.id);
      setIsOpen(false);
    } else {
      const cachedKey = localStorage.getItem(`${model.provider}_api_key`);
      if (cachedKey) {
        onModelChange(model.id);
        setIsOpen(false);
      } else {
        setPendingModel(model);
        setShowApiKeyModal(true);
        setIsOpen(false);
      }
    }
  };

  const handleApiKeySubmit = () => {
    if (pendingModel) {
      onModelChange(pendingModel.id);
      setPendingModel(null);
    }
  };

  const selectedModelData = models.find((m) => m.id === selectedModel);

  if (isLoading) {
    return <div className="w-48 h-10 bg-gray-100 rounded-lg animate-pulse" />;
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex items-center justify-between w-40 sm:w-48 px-3 py-2 text-sm
            border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent
            text-gray-900 dark:text-white
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div className="flex items-center space-x-2 min-w-0">
            {selectedModelData && getProviderIcon(selectedModelData.provider)}
            <span className="truncate text-xs sm:text-sm">
              {selectedModelData?.name || "Select Model"}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-[400px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              {/* Free Models Section */}
              {models.filter((m) => m.isFree).length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Free Models
                  </div>
                  {models
                    .filter((m) => m.isFree)
                    .map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className={`
                        w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                        ${
                          selectedModel === model.id
                            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                            : ""
                        }
                      `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            {getProviderIcon(model.provider)}
                            <span className="font-medium text-sm truncate text-gray-900 dark:text-white">
                              {model.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs border flex-shrink-0 ${getProviderColor(
                                model.provider,
                                model.isFree
                              )}`}
                            >
                              {model.provider.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                              FREE
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                          {model.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Max tokens: {model.maxTokens.toLocaleString()}
                        </p>
                      </button>
                    ))}
                </>
              )}

              {/* Premium Models Section */}
              {models.filter((m) => !m.isFree).length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 mt-2">
                    Premium Models
                  </div>
                  {models
                    .filter((m) => !m.isFree)
                    .map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className={`
                        w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                        ${
                          selectedModel === model.id
                            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                            : ""
                        }
                      `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            {getProviderIcon(model.provider)}
                            <span className="font-medium text-sm truncate text-gray-900 dark:text-white">
                              {model.name}
                            </span>
                            <Key className="h-3 w-3 text-orange-500" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs border flex-shrink-0 ${getProviderColor(
                                model.provider,
                                model.isFree
                              )}`}
                            >
                              {model.provider.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 border border-orange-200">
                              PREMIUM
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                          {model.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Max tokens: {model.maxTokens.toLocaleString()}
                        </p>
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Backdrop to close dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setPendingModel(null);
        }}
        onSubmit={handleApiKeySubmit}
        provider={pendingModel?.provider || ""}
        modelName={pendingModel?.name || ""}
      />
    </>
  );
}
