"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Brain, 
  Activity, 
  Sun,
  Moon,
  Leaf,
  Target,
  BarChart3,
  Calendar,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WellnessPage() {
  const router = useRouter();
  const [expandedAction, setExpandedAction] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close expanded menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpandedAction(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close expanded menu when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedAction(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const wellnessTools = [
    {
      icon: Brain,
      title: "Mood Tracking",
      description: "Track your daily mood patterns and identify triggers",
      color: "bg-wellness-mindful",
      link: "/wellness/mood-tracker"
    },
    {
      icon: Activity,
      title: "Breathing Exercises", 
      description: "Guided breathing exercises for stress relief and anxiety",
      color: "bg-wellness-calm",
      link: "/wellness/breathing"
    },
    {
      icon: Target,
      title: "Goal Setting",
      description: "Set and track personal wellness and mental health goals",
      color: "bg-wellness-growth",
      link: "/wellness/goals"
    },
    {
      icon: Sun,
      title: "Daily Check-ins",
      description: "Regular wellness check-ins to monitor your progress",
      color: "bg-wellness-balanced",
      link: "/wellness/check-in"
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Visualize your wellness journey with detailed insights",
      color: "bg-primary-500",
      link: "/wellness/analytics"
    },
    {
      icon: Leaf,
      title: "Mindfulness",
      description: "Meditation and mindfulness exercises for mental clarity",
      color: "bg-green-500",
      link: "/wellness/mindfulness"
    }
  ];

  const quickActions = [
    {
      title: "Take a Quick Mood Check",
      description: "2-minute assessment",
      icon: Heart,
      action: "Start Now",
      options: [
        { name: "Quick Check-in", time: "2 min", action: () => router.push('/wellness/mood-tracker?mode=quick') },
        { name: "Detailed Assessment", time: "5 min", action: () => router.push('/wellness/mood-tracker?mode=detailed') },
        { name: "Weekly Review", time: "10 min", action: () => router.push('/wellness/mood-tracker?mode=weekly') }
      ]
    },
    {
      title: "5-Minute Breathing Exercise",
      description: "Reduce stress instantly",
      icon: Activity,
      action: "Begin",
      options: [
        { name: "Box Breathing", time: "4 min", action: () => router.push('/wellness/breathing?type=box') },
        { name: "4-7-8 Technique", time: "3 min", action: () => router.push('/wellness/breathing?type=478') },
        { name: "Deep Belly Breathing", time: "5 min", action: () => router.push('/wellness/breathing?type=belly') },
        { name: "Custom Session", time: "Variable", action: () => router.push('/wellness/breathing?type=custom') }
      ]
    },
    {
      title: "Set a Wellness Goal",
      description: "Plan your wellness journey",
      icon: Target,
      action: "Create Goal",
      options: [
        { name: "Mood Goal", time: "3 min", action: () => router.push('/wellness/goals?type=mood') },
        { name: "Habit Goal", time: "5 min", action: () => router.push('/wellness/goals?type=habit') },
        { name: "Mindfulness Goal", time: "4 min", action: () => router.push('/wellness/goals?type=mindfulness') },
        { name: "Exercise Goal", time: "3 min", action: () => router.push('/wellness/goals?type=exercise') }
      ]
    }
  ];

  const handleActionClick = (actionIndex: number) => {
    if (expandedAction === actionIndex) {
      setExpandedAction(null);
    } else {
      setExpandedAction(actionIndex);
    }
  };

  const handleToolClick = (toolLink: string) => {
    router.push(toolLink);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wellness-calm/10 via-white to-wellness-growth/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-wellness-growth rounded-full p-4 mr-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-neutral-800">
                Wellness Hub
              </h1>
            </div>
            
            <p className="text-xl text-neutral-600 mb-4">
              Tools and resources to support your mental health journey
            </p>
            <p className="text-sm text-neutral-500">
              Track progress • Build habits • Find balance
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-neutral-800 mb-6 text-center">
              Quick Wellness Actions
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6" ref={containerRef}>
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div 
                    className={`text-center p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                      expandedAction === index 
                        ? 'border-wellness-calm shadow-lg bg-wellness-calm/5' 
                        : 'border-neutral-100 hover:border-wellness-calm hover:shadow-md'
                    }`}
                    onClick={() => handleActionClick(index)}
                  >
                    <action.icon className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                      expandedAction === index 
                        ? 'text-wellness-mindful' 
                        : 'text-wellness-calm group-hover:text-wellness-mindful'
                    }`} />
                    <h3 className="font-bold text-lg text-neutral-800 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-center text-wellness-calm font-semibold hover:text-wellness-mindful transition-colors">
                      <span>{action.action}</span>
                      {expandedAction === index ? (
                        <ChevronUp className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-2" />
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedAction === index && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 z-10 mt-2 bg-white rounded-xl shadow-lg border border-neutral-200 p-4"
                      >
                        <div className="space-y-3">
                          {action.options?.map((option, optionIndex) => (
                            <motion.div
                              key={option.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: optionIndex * 0.1 }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-wellness-calm/10 cursor-pointer transition-colors group/option"
                              onClick={(e) => {
                                e.stopPropagation();
                                option.action();
                                setExpandedAction(null);
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-neutral-800 group-hover/option:text-wellness-mindful transition-colors">
                                  {option.name}
                                </div>
                                <div className="text-xs text-neutral-500 mt-1">
                                  {option.time}
                                </div>
                              </div>
                              <Play className="w-4 h-4 text-wellness-calm opacity-0 group-hover/option:opacity-100 transition-opacity" />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Wellness Tools Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-neutral-800 mb-8 text-center">
              Wellness Tools & Resources
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wellnessTools.map((tool, index) => (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="relative bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden hover:shadow-glow transition-all duration-300 group cursor-pointer"
                  onClick={() => handleToolClick(tool.link)}
                >
                  <div className={`${tool.color} p-4`}>
                    <tool.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-neutral-800 mb-3 group-hover:text-primary-700 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-neutral-600 mb-4 group-hover:text-neutral-700 transition-colors">
                      {tool.description}
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                      <span>Explore Tool</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Wellness Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-wellness-calm/20 to-wellness-mindful/20 rounded-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-neutral-800 mb-6 text-center">
              Daily Wellness Tips
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Practice gratitude by writing down 3 things you&apos;re thankful for each day</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Take regular breaks from screens and social media</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Engage in regular physical activity, even if it&apos;s just a short walk</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Maintain a consistent sleep schedule for better mental health</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Connect with friends and family regularly</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Practice mindfulness or meditation for just 5-10 minutes daily</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-center">
            <Link 
              href="/"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
