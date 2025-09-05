// Global loading UI component
// Displays while pages are loading

import { Loader2, Heart, Brain } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo and loading animation */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Brain className="w-16 h-16 text-purple-600 mx-auto" />
            <Heart className="w-6 h-6 text-pink-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Astral Core
          </h1>
          <p className="text-gray-600">
            Your mental wellness companion
          </p>
        </div>

        {/* Loading spinner */}
        <div className="mb-6">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
        </div>

        {/* Loading message */}
        <div className="max-w-md mx-auto">
          <p className="text-gray-700 text-lg mb-2">
            Loading your safe space...
          </p>
          <p className="text-gray-500 text-sm">
            We&apos;re preparing everything to support your mental wellness journey.
          </p>
        </div>

        {/* Loading progress animation */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Tips while loading */}
        <div className="mt-8 p-4 bg-white/50 rounded-lg backdrop-blur-sm max-w-md mx-auto">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Remember to take deep breaths and be gentle with yourself today.
          </p>
        </div>
      </div>
    </div>
  );
}