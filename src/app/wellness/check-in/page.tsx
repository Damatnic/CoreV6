'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  ArrowLeft,
  Calendar,
  Clock,
  Activity,
  Brain,
  Moon,
  Coffee,
  Utensils,
  Users,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WellnessCheckInPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({
    mood: null as number | null,
    energy: null as number | null,
    stress: null as number | null,
    sleep: null as number | null,
    socialConnection: null as number | null,
    physicalActivity: null as number | null,
    nutrition: null as number | null,
    notes: ''
  });

  const questions = [
    {
      id: 'mood',
      title: 'How is your mood today?',
      subtitle: 'Rate how you&apos;re feeling emotionally',
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      scale: { low: 'Very Low', high: 'Excellent' }
    },
    {
      id: 'energy',
      title: 'What&apos;s your energy level?',
      subtitle: 'How energetic and motivated do you feel?',
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      scale: { low: 'Drained', high: 'Energized' }
    },
    {
      id: 'stress',
      title: 'How stressed are you feeling?',
      subtitle: 'Rate your current stress levels',
      icon: Brain,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      scale: { low: 'Very Calm', high: 'Very Stressed' }
    },
    {
      id: 'sleep',
      title: 'How well did you sleep?',
      subtitle: 'Rate the quality of your last night&apos;s sleep',
      icon: Moon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      scale: { low: 'Poor Sleep', high: 'Great Sleep' }
    },
    {
      id: 'socialConnection',
      title: 'Social connection today?',
      subtitle: 'How connected do you feel to others?',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      scale: { low: 'Isolated', high: 'Well Connected' }
    },
    {
      id: 'physicalActivity',
      title: 'Physical activity level?',
      subtitle: 'How active have you been today?',
      icon: Coffee,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      scale: { low: 'Sedentary', high: 'Very Active' }
    }
  ];

  const currentQuestion = questions[currentStep] || questions[0];
  const isComplete = currentStep >= questions.length;

  const handleRating = (rating: number) => {
    setResponses({
      ...responses,
      [currentQuestion!.id]: rating
    });
    
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setCurrentStep(questions.length); // Move to summary
      }
    }, 800);
  };

  const handleSubmit = () => {
    // In a real app, this would save to backend
    console.log('Check-in submitted:', responses);
    router.push('/wellness?checkin=success');
  };

  const getOverallWellness = () => {
    const values = [
      responses.mood,
      responses.energy,
      10 - (responses.stress || 5), // Invert stress
      responses.sleep,
      responses.socialConnection,
      responses.physicalActivity
    ].filter(v => v !== null) as number[];
    
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Check-in Complete!</h2>
            <p className="text-neutral-600">Thank you for taking time to check in with yourself</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
            <div className="text-4xl font-bold text-green-600 mb-2">{getOverallWellness()}/10</div>
            <div className="text-sm text-neutral-600">Overall Wellness Score</div>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+5% from last week</span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSubmit}
              className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Save Check-in
            </button>
            
            <button
              onClick={() => router.push('/wellness/analytics')}
              className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-xl hover:bg-neutral-200 transition-colors"
            >
              View Analytics
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <h1 className="text-3xl font-bold text-neutral-800">Daily Check-in</h1>
              <p className="text-neutral-600 mt-1">How are you doing today?</p>
            </div>
          </div>

          <div className="text-sm text-neutral-500">
            {currentStep + 1} of {questions.length}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-2 mb-12">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
          />
        </div>

        {/* Question Card */}
        <div className="flex items-center justify-center">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full"
          >
            <div className={`${currentQuestion.bgColor} rounded-2xl p-6 text-center mb-8`}>
              <currentQuestion.icon className={`w-12 h-12 ${currentQuestion.color} mx-auto mb-4`} />
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                {currentQuestion.title}
              </h2>
              <p className="text-neutral-600">
                {currentQuestion.subtitle}
              </p>
            </div>

            {/* Rating Scale */}
            <div className="space-y-4">
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 10 }).map((_, index) => {
                  const rating = index + 1;
                  const isSelected = responses[currentQuestion.id as keyof typeof responses] === rating;
                  
                  return (
                    <motion.button
                      key={rating}
                      onClick={() => handleRating(rating)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`aspect-square rounded-full font-bold transition-all ${
                        isSelected
                          ? `${currentQuestion.color.replace('text-', 'bg-')} text-white shadow-lg`
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {rating}
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-sm text-neutral-500">
                <span>{currentQuestion.scale.low}</span>
                <span>{currentQuestion.scale.high}</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={() => setCurrentStep(Math.min(questions.length - 1, currentStep + 1))}
                disabled={!responses[currentQuestion.id as keyof typeof responses]}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Date and Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center mt-8 space-x-4 text-sm text-neutral-500"
        >
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}