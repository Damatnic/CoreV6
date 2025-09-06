'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Activity,
  Heart,
  Target,
  Award,
  ArrowLeft,
  Download,
  Filter,
  Clock,
  Flame,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function WellnessAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overall');

  // Mock analytics data
  const analytics = {
    overview: {
      totalSessions: 156,
      averageRating: 7.8,
      currentStreak: 12,
      totalMinutes: 2340,
      weeklyGoal: 7,
      weeklyProgress: 5,
      improvementScore: 85
    },
    trends: {
      mood: [6, 7, 8, 7, 9, 8, 7, 8, 9, 7, 8, 9],
      stress: [8, 7, 6, 7, 5, 6, 7, 6, 4, 6, 5, 4],
      energy: [5, 6, 7, 8, 7, 8, 9, 8, 9, 8, 9, 10],
      sleep: [6, 7, 8, 7, 8, 9, 8, 9, 8, 9, 8, 9]
    },
    activities: [
      { name: 'Mindfulness', sessions: 45, minutes: 675, improvement: '+15%' },
      { name: 'Breathing', sessions: 38, minutes: 570, improvement: '+8%' },
      { name: 'Mood Tracking', sessions: 73, minutes: 146, improvement: '+22%' },
      { name: 'Journaling', sessions: 12, minutes: 360, improvement: '+5%' }
    ],
    achievements: [
      { name: '7-Day Streak', earned: true, date: '2024-12-15' },
      { name: 'Mindful Beginner', earned: true, date: '2024-12-10' },
      { name: 'Stress Warrior', earned: false, progress: 75 },
      { name: 'Wellness Champion', earned: false, progress: 45 }
    ],
    insights: [
      {
        type: 'positive',
        title: 'Mood Improvement',
        message: 'Your average mood has increased by 18% this week. Great progress!'
      },
      {
        type: 'suggestion',
        title: 'Consistency Opportunity',
        message: 'Try evening mindfulness sessions - your stress levels are highest around 7 PM.'
      },
      {
        type: 'milestone',
        title: 'Personal Best',
        message: 'You achieved your highest energy rating yesterday!'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Link 
              href="/wellness"
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">Wellness Analytics</h1>
              <p className="text-neutral-600 mt-1">Track your progress and insights</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
            </select>
            <button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Sessions', value: analytics.overview.totalSessions, icon: Activity, color: 'text-blue-600' },
            { label: 'Current Streak', value: `${analytics.overview.currentStreak} days`, icon: Flame, color: 'text-orange-500' },
            { label: 'Average Mood', value: analytics.overview.averageRating, icon: Heart, color: 'text-pink-500' },
            { label: 'Total Minutes', value: analytics.overview.totalMinutes, icon: Clock, color: 'text-green-500' }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
            >
              <div className="flex items-center justify-between mb-4">
                <metric.icon className={`w-8 h-8 ${metric.color}`} />
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-neutral-800 mb-1">{metric.value}</div>
              <div className="text-sm text-neutral-600">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts and Progress */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          
          {/* Mood Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-800">Wellness Trends</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="mood">Mood</option>
                <option value="stress">Stress</option>
                <option value="energy">Energy</option>
                <option value="sleep">Sleep</option>
              </select>
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-2">
              {analytics.trends[selectedMetric as keyof typeof analytics.trends].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(value / 10) * 100}%` }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-full rounded-t-lg ${
                      selectedMetric === 'mood' ? 'bg-pink-500' :
                      selectedMetric === 'stress' ? 'bg-red-500' :
                      selectedMetric === 'energy' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`}
                  />
                  <div className="text-xs text-neutral-500 mt-2">{index + 1}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <h3 className="text-xl font-bold text-neutral-800 mb-6">Weekly Goal</h3>
            
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.overview.weeklyProgress}/{analytics.overview.weeklyGoal}
              </div>
              <div className="text-sm text-neutral-600">Sessions completed</div>
            </div>

            <div className="w-full bg-neutral-200 rounded-full h-3 mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(analytics.overview.weeklyProgress / analytics.overview.weeklyGoal) * 100}%` }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
              />
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-full ${
                    i < analytics.overview.weeklyProgress 
                      ? 'bg-blue-500' 
                      : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Activities and Achievements */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Top Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <h3 className="text-xl font-bold text-neutral-800 mb-6">Activity Breakdown</h3>
            
            <div className="space-y-4">
              {analytics.activities.map((activity, index) => (
                <div key={activity.name} className="flex items-center justify-between p-4 rounded-lg bg-neutral-50">
                  <div>
                    <div className="font-semibold text-neutral-800">{activity.name}</div>
                    <div className="text-sm text-neutral-600">
                      {activity.sessions} sessions • {activity.minutes} minutes
                    </div>
                  </div>
                  <div className="text-green-600 font-medium text-sm">{activity.improvement}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <h3 className="text-xl font-bold text-neutral-800 mb-6">Achievements</h3>
            
            <div className="space-y-4">
              {analytics.achievements.map((achievement, index) => (
                <div key={achievement.name} className={`flex items-center space-x-4 p-4 rounded-lg ${
                  achievement.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-neutral-50'
                }`}>
                  <div className={`p-2 rounded-full ${
                    achievement.earned ? 'bg-yellow-100' : 'bg-neutral-200'
                  }`}>
                    {achievement.earned ? (
                      <Award className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Target className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      achievement.earned ? 'text-neutral-800' : 'text-neutral-600'
                    }`}>
                      {achievement.name}
                    </div>
                    {achievement.earned ? (
                      <div className="text-sm text-yellow-600">
                        Earned on {new Date(achievement.date!).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-500">
                        {achievement.progress}% complete
                      </div>
                    )}
                  </div>
                  {achievement.earned && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
        >
          <h3 className="text-xl font-bold text-neutral-800 mb-6">Personal Insights</h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {analytics.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-500' :
                  insight.type === 'suggestion' ? 'bg-blue-50 border-blue-500' :
                  'bg-purple-50 border-purple-500'
                }`}
              >
                <div className={`font-semibold mb-2 ${
                  insight.type === 'positive' ? 'text-green-800' :
                  insight.type === 'suggestion' ? 'text-blue-800' :
                  'text-purple-800'
                }`}>
                  {insight.title}
                </div>
                <div className="text-sm text-neutral-700">{insight.message}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}