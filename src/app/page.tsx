"use client";

import { motion } from "framer-motion";
import { 
  Heart, Shield, Users, Brain, Lock, Globe, 
  ArrowRight, Sparkles, Phone, MessageCircle 
} from "lucide-react";
import Link from "next/link";

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-primary-50/20 dark:from-neutral-950 dark:to-primary-950/20">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 pt-14 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Find Your Voice When You&apos;ve Lost Your Own
            </motion.h1>
            
            <motion.p 
              className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Astral Core provides immediate, anonymous mental health support with advanced crisis intervention, 
              peer connections, and professional resources - all with your privacy at the forefront.
            </motion.p>
            
            <motion.div 
              className="mt-10 flex items-center justify-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                href="/dashboard"
                className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors flex items-center gap-2"
              >
                Start Anonymously
                <Shield size={18} />
              </Link>
              <Link
                href="/auth/helper-signup"
                className="rounded-xl border border-primary-600 px-6 py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
              >
                Become a Helper
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Crisis Support Banner */}
        <motion.div 
          className="mt-16 mx-auto max-w-4xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-crisis-background border border-crisis-accent rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Heart className="text-crisis-primary" size={24} />
                <div>
                  <p className="font-semibold text-neutral-900">Need immediate help?</p>
                  <p className="text-sm text-neutral-600">Support is available 24/7</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-crisis-accent transition-colors">
                  <Phone size={16} />
                  <span className="font-medium">Call 988</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-crisis-accent transition-colors">
                  <MessageCircle size={16} />
                  <span className="font-medium">Crisis Chat</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 lg:px-8 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Built for Real Support
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-300">
              Every feature designed with your wellbeing and privacy in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Crisis Detection */}
            <motion.div 
              className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-crisis-background rounded-xl">
                  <Brain className="text-crisis-primary" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Advanced Crisis Detection</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                89% accuracy in identifying crisis situations with real-time intervention and immediate support resources.
              </p>
            </motion.div>

            {/* Feature 2: Anonymous First */}
            <motion.div 
              className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <Lock className="text-primary-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Radical Anonymity</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                No personal information required. End-to-end encryption. Your privacy is our foundation.
              </p>
            </motion.div>

            {/* Feature 3: Peer Support */}
            <motion.div 
              className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-wellness-calm/20 rounded-xl">
                  <Users className="text-wellness-calm" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Peer Support Network</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                Connect with trained peer supporters who understand. Real people, real support, real time.
              </p>
            </motion.div>

            {/* Feature 4: AI Augmentation */}
            <motion.div 
              className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-secondary-100 rounded-xl">
                  <Sparkles className="text-secondary-600" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Ethical AI Support</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                AI-powered insights and coping strategies, always with human oversight and your consent.
              </p>
            </motion.div>

            {/* Feature 5: Multi-language */}
            <motion.div 
              className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-wellness-growth/20 rounded-xl">
                  <Globe className="text-wellness-growth" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Global Accessibility</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                Support in 5+ languages with culturally-aware resources and offline capabilities.
              </p>
            </motion.div>

            {/* Feature 6: Professional Care */}
            <motion.div 
              className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-wellness-mindful/20 rounded-xl">
                  <Heart className="text-wellness-mindful" size={24} />
                </div>
                <h3 className="font-semibold text-lg">Professional Bridge</h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                Optional connection to licensed therapists and emergency services when you need them.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-6 lg:px-8 bg-primary-50/30 dark:bg-primary-950/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary-600">89%</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">Crisis Detection Accuracy</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">24/7</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">Always Available</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">5+</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">Languages Supported</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">100%</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">Anonymous & Secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">You Deserve Support</h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
            Whether you&apos;re in crisis, need someone to talk to, or want to help others, 
            Astral Core is here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-colors font-semibold"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-semibold"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
