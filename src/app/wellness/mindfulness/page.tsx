'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Leaf,
  Sun,
  Moon,
  Waves,
  Mountain,
  Volume2,
  VolumeX,
  Timer,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function MindfulnessPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSession, setSelectedSession] = useState('breath-focus');
  const [duration, setDuration] = useState(10); // minutes
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const sessions = [
    {
      id: 'breath-focus',
      name: 'Breath Focus',
      description: 'Focus on your breath to center your mind',
      icon: Waves,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      instructions: [
        'Sit comfortably with your back straight',
        'Close your eyes and breathe naturally',
        'Focus on the sensation of breathing',
        'When your mind wanders, gently return to your breath'
      ]
    },
    {
      id: 'body-scan',
      name: 'Body Scan',
      description: 'Progressive relaxation through body awareness',
      icon: Mountain,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      instructions: [
        'Lie down or sit comfortably',
        'Start from the top of your head',
        'Slowly scan down through your entire body',
        'Notice any tension and consciously relax'
      ]
    },
    {
      id: 'loving-kindness',
      name: 'Loving Kindness',
      description: 'Cultivate compassion for yourself and others',
      icon: Leaf,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      instructions: [
        'Sit quietly and breathe deeply',
        'Start by sending love to yourself',
        'Extend kindness to loved ones',
        'Include neutral people, then difficult people'
      ]
    },
    {
      id: 'morning',
      name: 'Morning Awakening',
      description: 'Start your day with mindful intention',
      icon: Sun,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      instructions: [
        'Find a comfortable seated position',
        'Set an intention for your day',
        'Feel gratitude for the new day',
        'Visualize your day unfolding positively'
      ]
    },
    {
      id: 'evening',
      name: 'Evening Wind Down',
      description: 'Prepare your mind for restful sleep',
      icon: Moon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      instructions: [
        'Settle into a relaxing position',
        'Reflect on your day with kindness',
        'Release any tension or worry',
        'Set an intention for peaceful rest'
      ]
    }
  ];

  const currentSession = sessions.find(s => s.id === selectedSession) || sessions[0];
  const totalDuration = duration * 60; // Convert to seconds
  const progress = (currentTime / totalDuration) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTime < totalDuration) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            setIsComplete(true);
            return totalDuration;
          }
          return next;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, totalDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isComplete) {
      setCurrentTime(0);
      setIsComplete(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsComplete(false);
  };

  const remainingTime = totalDuration - currentTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
              <h1 className="text-3xl font-bold text-neutral-800">Mindfulness</h1>
              <p className="text-neutral-600 mt-1">Guided meditation and mindful awareness</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <Settings className="w-5 h-5 text-neutral-600" />
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Session Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Choose a Practice</h2>
            
            <div className="space-y-4">
              {sessions.map((session) => (
                <motion.button
                  key={session.id}
                  onClick={() => {
                    setSelectedSession(session.id);
                    handleReset();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    selectedSession === session.id
                      ? 'border-indigo-300 bg-indigo-50 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${session.bgColor}`}>
                      <session.icon className={`w-6 h-6 ${session.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800">{session.name}</h3>
                      <p className="text-sm text-neutral-600">{session.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Session Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            
            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 mb-6"
                >
                  <h3 className="text-lg font-semibold text-neutral-800 mb-4">Session Settings</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Duration (minutes)
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={3}>3 minutes</option>
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={20}>20 minutes</option>
                        <option value={30}>30 minutes</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Background Sounds
                      </label>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                          soundEnabled
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-neutral-300 bg-white text-neutral-600'
                        }`}
                      >
                        {soundEnabled ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                        <span>{soundEnabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              
              {/* Session Header */}
              <div className={`${currentSession.bgColor} rounded-2xl p-6 text-center mb-8`}>
                <currentSession.icon className={`w-16 h-16 ${currentSession.color} mx-auto mb-4`} />
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                  {currentSession.name}
                </h2>
                <p className="text-neutral-600">{currentSession.description}</p>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-neutral-800 mb-2">
                  {formatTime(remainingTime)}
                </div>
                <div className="text-neutral-600">remaining</div>
                
                {/* Progress Circle */}
                <div className="relative w-32 h-32 mx-auto mt-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-neutral-200"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                      className={currentSession.color}
                      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <button
                  onClick={handleReset}
                  className="p-3 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
                
                <motion.button
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-6 rounded-full text-white transition-colors ${currentSession.color.replace('text-', 'bg-')}`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </motion.button>
                
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-3 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-neutral-800 text-center mb-4">
                  Instructions
                </h3>
                {currentSession.instructions.map((instruction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-neutral-50"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${currentSession.color.replace('text-', 'bg-')}`}>
                      {index + 1}
                    </div>
                    <p className="text-neutral-700 flex-1">{instruction}</p>
                  </motion.div>
                ))}
              </div>

              {/* Completion Message */}
              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-200 text-center"
                  >
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Session Complete!
                    </h3>
                    <p className="text-green-600">
                      Well done! Take a moment to notice how you feel.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}