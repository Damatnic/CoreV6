"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  ArrowLeft,
  Save,
  Smile,
  Meh,
  Frown,
  Sun,
  Cloud,
  CloudRain,
  HelpCircle,
  Lightbulb,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function MoodTrackerPage() {
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);

  const moodOptions = [
    { value: 1, label: 'Very Low', color: 'bg-red-500', icon: CloudRain },
    { value: 2, label: 'Low', color: 'bg-orange-500', icon: Cloud },
    { value: 3, label: 'Okay', color: 'bg-yellow-500', icon: Cloud },
    { value: 4, label: 'Good', color: 'bg-green-500', icon: Sun },
    { value: 5, label: 'Very Good', color: 'bg-blue-500', icon: Sun },
  ];

  const emotionOptions = [
    'Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Worried',
    'Grateful', 'Frustrated', 'Hopeful', 'Lonely', 'Content', 'Overwhelmed',
    'Peaceful', 'Irritated', 'Motivated', 'Tired', 'Confident', 'Stressed'
  ];

  const triggerOptions = [
    'Work stress', 'Relationship issues', 'Financial concerns', 'Health issues',
    'Social situations', 'Weather', 'Sleep issues', 'Exercise', 'Family',
    'Social media', 'News', 'Academic pressure'
  ];

  const toggleEmotion = (emotion: string) => {
    setEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const toggleTrigger = (trigger: string) => {
    setTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const saveMoodEntry = () => {
    const entry = {
      mood: currentMood,
      emotions,
      notes,
      triggers,
      date: new Date().toISOString()
    };
    console.log('Saving mood entry:', entry);
    // Here you would save to your backend/database
    alert('Mood entry saved successfully!');
  };

  const mockData = [
    { date: '2024-01-01', mood: 4 },
    { date: '2024-01-02', mood: 3 },
    { date: '2024-01-03', mood: 5 },
    { date: '2024-01-04', mood: 2 },
    { date: '2024-01-05', mood: 4 },
    { date: '2024-01-06', mood: 3 },
    { date: '2024-01-07', mood: 4 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-wellness-calm/10 via-white to-wellness-growth/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mb-8"
          >
            <Link href="/wellness" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-neutral-600 hover:text-neutral-800 transition-colors" />
            </Link>
            <div className="flex items-center">
              <div className="bg-wellness-mindful rounded-full p-3 mr-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-800">Mood Tracker</h1>
                <p className="text-neutral-600">Track your daily emotional well-being</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Today's Mood Entry */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6 mb-6"
              >
                <h2 className="text-2xl font-bold text-neutral-800 mb-6">
                  How are you feeling today?
                </h2>
                
                {/* Mood Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-700 mb-4">Overall Mood</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {moodOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCurrentMood(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          currentMood === option.value
                            ? `${option.color} border-transparent text-white shadow-lg scale-105`
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <option.icon className={`w-8 h-8 mx-auto mb-2 ${
                          currentMood === option.value ? 'text-white' : 'text-neutral-600'
                        }`} />
                        <div className={`text-sm font-medium ${
                          currentMood === option.value ? 'text-white' : 'text-neutral-700'
                        }`}>
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emotions */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-700 mb-4">Specific Emotions</h3>
                  <div className="flex flex-wrap gap-2">
                    {emotionOptions.map((emotion) => (
                      <button
                        key={emotion}
                        onClick={() => toggleEmotion(emotion)}
                        className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                          emotions.includes(emotion)
                            ? 'bg-wellness-mindful text-white border-transparent'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Triggers */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-700 mb-4">Triggers</h3>
                  <div className="flex flex-wrap gap-2">
                    {triggerOptions.map((trigger) => (
                      <button
                        key={trigger}
                        onClick={() => toggleTrigger(trigger)}
                        className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                          triggers.includes(trigger)
                            ? 'bg-orange-500 text-white border-transparent'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {trigger}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-700 mb-4">Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    placeholder="How was your day? What influenced your mood?"
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wellness-mindful resize-none"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={saveMoodEntry}
                  disabled={currentMood === null}
                  className="w-full flex items-center justify-center px-6 py-3 bg-wellness-mindful text-white rounded-xl font-semibold hover:bg-wellness-calm transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Today&apos;s Mood
                </button>
              </motion.div>
            </div>

            {/* Mood History & Insights */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6 mb-6"
              >
                <h3 className="text-lg font-bold text-neutral-800 mb-4">This Week</h3>
                <div className="space-y-3">
                  {mockData.map((day, index) => {
                    const moodInfo = moodOptions.find(m => m.value === day.mood);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <div className="flex items-center">
                          {moodInfo && (
                            <>
                              <div className={`w-3 h-3 rounded-full ${moodInfo.color} mr-2`}></div>
                              <span className="text-sm text-neutral-700">{moodInfo.label}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6"
              >
                <h3 className="text-lg font-bold text-neutral-800 mb-4">Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-wellness-growth mr-3" />
                    <div>
                      <div className="text-sm font-medium text-neutral-800">Average Mood</div>
                      <div className="text-xs text-neutral-600">3.6/5 this week</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-primary-500 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-neutral-800">Streak</div>
                      <div className="text-xs text-neutral-600">7 days tracked</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-wellness-balanced mr-3" />
                    <div>
                      <div className="text-sm font-medium text-neutral-800">Best Day</div>
                      <div className="text-xs text-neutral-600">Wednesday (5/5)</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Help & Guidance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-gradient-to-r from-wellness-mindful/10 to-wellness-calm/10 rounded-2xl p-8"
          >
            <div className="flex items-center mb-6">
              <HelpCircle className="w-6 h-6 text-wellness-mindful mr-3" />
              <h3 className="text-2xl font-bold text-neutral-800">Mood Tracking Guidance</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 text-wellness-balanced mr-2" />
                  Tips for Effective Mood Tracking
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-neutral-800">Be consistent:</strong>
                      <span className="text-neutral-600"> Track your mood at the same time each day for better patterns</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-neutral-800">Be honest:</strong>
                      <span className="text-neutral-600"> Record how you actually feel, not how you think you should feel</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-neutral-800">Include context:</strong>
                      <span className="text-neutral-600"> Note specific events, thoughts, or situations that influenced your mood</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-wellness-growth mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-neutral-800">Look for patterns:</strong>
                      <span className="text-neutral-600"> Review your weekly insights to identify trends and triggers</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 text-primary-500 mr-2" />
                  Understanding Your Emotions
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border border-neutral-200">
                    <h5 className="font-medium text-neutral-800 mb-2">Primary Emotions</h5>
                    <p className="text-neutral-600 text-sm">
                      Focus on core feelings like joy, sadness, anger, fear, surprise, and disgust. These are your emotional foundation.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-neutral-200">
                    <h5 className="font-medium text-neutral-800 mb-2">Complex Emotions</h5>
                    <p className="text-neutral-600 text-sm">
                      Notice mixed feelings like feeling grateful but anxious, or excited but worried. It&apos;s normal to experience multiple emotions.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-neutral-200">
                    <h5 className="font-medium text-neutral-800 mb-2">Emotional Intensity</h5>
                    <p className="text-neutral-600 text-sm">
                      Pay attention to how strong your emotions feel. A 3/5 sadness is different from 5/5 sadness and may need different responses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Help Links */}
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <h4 className="text-lg font-semibold text-neutral-800 mb-4">Need More Support?</h4>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/therapy"
                  className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Talk to AI Therapist
                </Link>
                <Link
                  href="/resources"
                  className="flex items-center px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Mood Resources
                </Link>
                <Link
                  href="/community"
                  className="flex items-center px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Community Support
                </Link>
                <Link
                  href="/crisis"
                  className="flex items-center px-4 py-2 bg-crisis-primary text-white rounded-lg hover:bg-crisis-secondary transition-colors"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Crisis Support
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-center mt-8">
            <Link 
              href="/wellness"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              ← Back to Wellness Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
