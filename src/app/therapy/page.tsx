"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageCircle, 
  Heart, 
  Shield,
  Sparkles,
  Clock,
  CheckCircle,
  ArrowRight,
  User,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import AITherapyInterface from '@/components/ai/AITherapyInterface';

export default function TherapyPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-wellness-calm/10">
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence>
          {!isStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-center mb-6"
                >
                  <div className="bg-primary-500 rounded-full p-4 mr-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-neutral-800">
                    AI Therapy Assistant
                  </h1>
                </motion.div>
                
                <p className="text-xl text-neutral-600 mb-4">
                  Get immediate, confidential mental health support powered by advanced AI
                </p>
                <p className="text-sm text-neutral-500">
                  Available 24/7 • Completely Anonymous • Crisis Support Enabled
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: Shield,
                    title: "100% Anonymous",
                    description: "No personal information required. Your privacy is completely protected.",
                    color: "bg-green-500"
                  },
                  {
                    icon: Clock,
                    title: "24/7 Availability",
                    description: "Get support whenever you need it, day or night.",
                    color: "bg-blue-500"
                  },
                  {
                    icon: Heart,
                    title: "Crisis Support",
                    description: "Advanced crisis detection with immediate intervention protocols.",
                    color: "bg-red-500"
                  },
                  {
                    icon: Brain,
                    title: "Advanced AI",
                    description: "Powered by cutting-edge therapy and counseling techniques.",
                    color: "bg-purple-500"
                  },
                  {
                    icon: CheckCircle,
                    title: "Evidence-Based",
                    description: "Uses proven therapeutic approaches like CBT and DBT.",
                    color: "bg-wellness-growth"
                  },
                  {
                    icon: Sparkles,
                    title: "Personalized",
                    description: "Adapts to your unique needs and communication style.",
                    color: "bg-wellness-mindful"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6 hover:shadow-glow transition-all duration-300"
                  >
                    <div className={`${feature.color} rounded-full p-3 w-fit mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-neutral-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Getting Started */}
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 text-center">
                <h2 className="text-2xl font-bold text-neutral-800 mb-4">
                  Ready to get started?
                </h2>
                <p className="text-neutral-600 mb-6">
                  Your conversation will be completely anonymous and confidential. 
                  You can stop at any time.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => setIsStarted(true)}
                    className="flex items-center justify-center px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all duration-200 group"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Start Anonymous Session
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <Link 
                    href="/crisis"
                    className="flex items-center justify-center px-8 py-4 bg-crisis-primary text-white rounded-xl font-semibold hover:bg-crisis-secondary transition-all duration-200"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Crisis Support
                  </Link>
                </div>
                
                <p className="text-xs text-neutral-500 mt-4">
                  If you're experiencing a mental health emergency, please call 988 (Suicide & Crisis Lifeline) or your local emergency services.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-center mt-8">
                <Link 
                  href="/"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto"
            >
              <AITherapyInterface />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}