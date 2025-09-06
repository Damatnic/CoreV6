'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Target,
  Plus,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Star,
  Edit3,
  Trash2,
  Flag,
  Activity,
  Heart,
  Brain,
  Moon
} from 'lucide-react';
import Link from 'next/link';

export default function WellnessGoalsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'mindfulness',
    frequency: 'daily',
    target: 1,
    unit: 'session'
  });

  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Daily Mindfulness',
      description: 'Practice mindfulness meditation for at least 10 minutes each day',
      category: 'mindfulness',
      frequency: 'daily',
      target: 1,
      unit: 'session',
      progress: 12,
      totalDays: 14,
      streak: 5,
      isActive: true,
      createdAt: '2024-12-01'
    },
    {
      id: 2,
      title: 'Mood Tracking',
      description: 'Record my mood and energy levels twice daily',
      category: 'mood',
      frequency: 'daily',
      target: 2,
      unit: 'check-in',
      progress: 8,
      totalDays: 7,
      streak: 3,
      isActive: true,
      createdAt: '2024-12-08'
    },
    {
      id: 3,
      title: 'Quality Sleep',
      description: 'Get 7-8 hours of sleep each night',
      category: 'sleep',
      frequency: 'daily',
      target: 7,
      unit: 'hours',
      progress: 4,
      totalDays: 7,
      streak: 2,
      isActive: true,
      createdAt: '2024-12-10'
    },
    {
      id: 4,
      title: 'Weekly Reflection',
      description: 'Complete a comprehensive weekly wellness review',
      category: 'reflection',
      frequency: 'weekly',
      target: 1,
      unit: 'session',
      progress: 3,
      totalDays: 4,
      streak: 1,
      isActive: false,
      completedAt: '2024-11-30'
    }
  ]);

  const categories = [
    { id: 'mindfulness', name: 'Mindfulness', icon: Brain, color: 'text-purple-500' },
    { id: 'mood', name: 'Mood', icon: Heart, color: 'text-pink-500' },
    { id: 'exercise', name: 'Exercise', icon: Activity, color: 'text-green-500' },
    { id: 'sleep', name: 'Sleep', icon: Moon, color: 'text-blue-500' },
    { id: 'habit', name: 'Habit', icon: Target, color: 'text-orange-500' }
  ];

  const activeGoals = goals.filter(goal => goal.isActive);
  const completedGoals = goals.filter(goal => !goal.isActive);

  const handleCreateGoal = () => {
    const goal = {
      id: Date.now(),
      ...newGoal,
      progress: 0,
      totalDays: 1,
      streak: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    } as any;
    
    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      description: '',
      category: 'mindfulness',
      frequency: 'daily',
      target: 1,
      unit: 'session'
    });
    setShowCreateForm(false);
  };

  const getProgressPercentage = (goal: any) => {
    return Math.min((goal.progress / goal.totalDays) * 100, 100);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category || categories[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
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
              <h1 className="text-3xl font-bold text-neutral-800">Wellness Goals</h1>
              <p className="text-neutral-600 mt-1">Set and track your personal wellness objectives</p>
            </div>
          </div>

          <motion.button
            onClick={() => setShowCreateForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Goal</span>
          </motion.button>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-8 h-8 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold text-neutral-800">{activeGoals.length}</div>
                <div className="text-sm text-neutral-600">Active Goals</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-neutral-800">{completedGoals.length}</div>
                <div className="text-sm text-neutral-600">Completed</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-neutral-800">
                  {Math.round(activeGoals.reduce((acc, goal) => acc + getProgressPercentage(goal), 0) / activeGoals.length || 0)}%
                </div>
                <div className="text-sm text-neutral-600">Avg Progress</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-neutral-800">
                  {Math.max(...activeGoals.map(g => g.streak), 0)}
                </div>
                <div className="text-sm text-neutral-600">Best Streak</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-neutral-100 rounded-xl p-1 mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            Active Goals
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Goals List */}
        <div className="space-y-6">
          {(activeTab === 'active' ? activeGoals : completedGoals).map((goal, index) => {
            const category = getCategoryIcon(goal.category) || categories[0];
            const progressPercentage = getProgressPercentage(goal);
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full bg-neutral-100`}>
                      <category.icon className={`w-6 h-6 ${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-neutral-800 mb-2">{goal.title}</h3>
                      <p className="text-neutral-600 mb-4">{goal.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-600 capitalize">{goal.frequency}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-600">{goal.target} {goal.unit}/day</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Flag className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-600">{goal.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
                      <Edit3 className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Progress</span>
                    <span className="font-medium text-neutral-800">
                      {goal.progress}/{goal.totalDays} days ({Math.round(progressPercentage)}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        progressPercentage >= 80 ? 'from-green-400 to-green-500' :
                        progressPercentage >= 60 ? 'from-yellow-400 to-yellow-500' :
                        'from-blue-400 to-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Create Goal Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-neutral-800 mb-6">Create New Goal</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Goal Title
                    </label>
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                      placeholder="e.g., Daily Meditation"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                      placeholder="Describe your goal and why it's important to you"
                      rows={3}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={newGoal.frequency}
                        onChange={(e) => setNewGoal({...newGoal, frequency: e.target.value})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal({...newGoal, target: Number(e.target.value)})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Unit
                      </label>
                      <select
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="session">session</option>
                        <option value="minute">minute</option>
                        <option value="hour">hour</option>
                        <option value="check-in">check-in</option>
                        <option value="entry">entry</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 px-4 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={!newGoal.title.trim()}
                    className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Create Goal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}