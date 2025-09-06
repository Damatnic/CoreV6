"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Heart, 
  Users, 
  Shield,
  Activity,
  MessageCircle,
  BarChart3,
  Calendar,
  Settings,
  Bell,
  Star,
  ArrowRight,
  Plus,
  Eye,
  Target,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const session = useSession();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'therapy' | 'wellness' | 'community'>('overview');
  const [stats, setStats] = useState({
    therapySessions: 3,
    moodEntries: 12,
    daysStreak: 5,
    wellnessScore: 7.2,
    communityPosts: 2,
    supportGiven: 8
  });

  const quickActions = [
    {
      icon: MessageCircle,
      title: "Start AI Therapy",
      description: "Begin an anonymous therapy session",
      color: "bg-primary-500",
      link: "/therapy"
    },
    {
      icon: Heart,
      title: "Log Mood",
      description: "Track how you're feeling today",
      color: "bg-wellness-mindful",
      link: "/wellness?action=mood"
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with peer support",
      color: "bg-green-500",
      link: "/community"
    },
    {
      icon: Shield,
      title: "Crisis Support",
      description: "Get immediate help if needed",
      color: "bg-crisis-primary",
      link: "/crisis"
    }
  ];

  const recentActivity = [
    {
      type: "therapy",
      title: "AI Therapy Session",
      time: "2 hours ago",
      description: "Discussed anxiety management techniques"
    },
    {
      type: "mood",
      title: "Mood Entry",
      time: "1 day ago", 
      description: "Feeling: Good (7/10)"
    },
    {
      type: "community",
      title: "Community Post",
      time: "3 days ago",
      description: "Shared experience in Anxiety Support group"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-wellness-calm/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                Welcome to your Dashboard
              </h1>
              <p className="text-neutral-600">
                Your personal mental health and wellness hub
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <button className="flex items-center px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all duration-200">
                <Bell className="w-5 h-5 text-neutral-600 mr-2" />
                <span className="text-neutral-700">Notifications</span>
              </button>
              <button className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200">
                <Settings className="w-5 h-5 mr-2" />
                <span>Settings</span>
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {[
              { label: "Therapy Sessions", value: stats.therapySessions, icon: Brain, color: "text-primary-600" },
              { label: "Mood Entries", value: stats.moodEntries, icon: Heart, color: "text-wellness-mindful" },
              { label: "Days Streak", value: stats.daysStreak, icon: Calendar, color: "text-wellness-growth" },
              { label: "Wellness Score", value: stats.wellnessScore, icon: Star, color: "text-wellness-balanced" },
              { label: "Community Posts", value: stats.communityPosts, icon: Users, color: "text-green-600" },
              { label: "Support Given", value: stats.supportGiven, icon: Shield, color: "text-blue-600" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl shadow-soft border border-neutral-200 p-4 text-center"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-neutral-800">
                  {typeof stat.value === 'number' && stat.value % 1 !== 0 ? stat.value.toFixed(1) : stat.value}
                </div>
                <div className="text-xs text-neutral-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-6">
                  Quick Actions
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link
                      key={action.title}
                      href={action.link}
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="p-4 rounded-xl border-2 border-neutral-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-center mb-3">
                          <div className={`${action.color} rounded-lg p-2 mr-3`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-neutral-800">
                            {action.title}
                          </h3>
                        </div>
                        <p className="text-neutral-600 text-sm mb-2">
                          {action.description}
                        </p>
                        <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                          <span>Get Started</span>
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-6">
                  Recent Activity
                </h2>
                
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-start p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full mt-2 mr-3 ${
                        activity.type === 'therapy' ? 'bg-primary-500' :
                        activity.type === 'mood' ? 'bg-wellness-mindful' :
                        'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800 text-sm">
                          {activity.title}
                        </h4>
                        <p className="text-neutral-600 text-xs mb-1">
                          {activity.description}
                        </p>
                        <p className="text-neutral-500 text-xs">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <button className="w-full mt-4 text-primary-600 font-medium hover:text-primary-700 transition-colors text-sm">
                  View All Activity →
                </button>
              </div>
            </motion.div>
          </div>

          {/* Weekly Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-800">
                  This Week&#39;s Progress
                </h2>
                <Link
                  href="/wellness"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                >
                  View Details
                </Link>
              </div>
              
              <div className="grid md:grid-cols-7 gap-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-neutral-600 mb-2">{day}</div>
                    <div className={`w-12 h-12 rounded-lg mx-auto flex items-center justify-center ${
                      index < 5 ? 'bg-wellness-growth text-white' :
                      index === 5 ? 'bg-wellness-balanced text-white' :
                      'bg-neutral-200 text-neutral-400'
                    }`}>
                      {index < 6 ? <CheckCircle className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-center mt-8">
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