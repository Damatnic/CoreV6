/* eslint-disable react/no-unescaped-entities */
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  Heart, 
  Shield,
  AlertTriangle,
  Clock,
  Users,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function CrisisPage() {
  const emergencyContacts = [
    {
      name: "988 Suicide & Crisis Lifeline",
      number: "988",
      description: "24/7 free and confidential support",
      link: "tel:988"
    },
    {
      name: "Crisis Text Line", 
      number: "Text HOME to 741741",
      description: "Free 24/7 crisis support via text",
      link: "sms:741741&body=HOME"
    },
    {
      name: "Emergency Services",
      number: "911", 
      description: "For immediate life-threatening emergencies",
      link: "tel:911"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-crisis-background via-red-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Emergency Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-crisis-primary text-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 mr-4" />
              <h1 className="text-2xl font-bold">Crisis Support & Resources</h1>
            </div>
            <p className="text-crisis-accent">
              If you're in immediate danger or having thoughts of suicide, please reach out for help right now. You are not alone.
            </p>
          </motion.div>

          {/* Immediate Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 mb-8"
          >
            <h2 className="text-3xl font-bold text-neutral-800 mb-6 text-center">
              Immediate Help Available
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {emergencyContacts.map((contact, index) => (
                <motion.a
                  key={contact.name}
                  href={contact.link}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="block bg-gradient-to-br from-crisis-primary to-crisis-secondary text-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Phone className="w-8 h-8" />
                    <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{contact.name}</h3>
                  <p className="text-2xl font-bold mb-2 text-crisis-accent">{contact.number}</p>
                  <p className="text-sm opacity-90">{contact.description}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* AI Crisis Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 mb-8"
          >
            <div className="text-center">
              <Shield className="w-16 h-16 text-primary-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-neutral-800 mb-4">
                AI Crisis Support Chat
              </h2>
              <p className="text-neutral-600 mb-6">
                Our AI assistant is specially trained in crisis intervention and can provide immediate support while connecting you with human resources.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/therapy?crisis=true"
                  className="flex items-center justify-center px-8 py-4 bg-crisis-primary text-white rounded-xl font-semibold hover:bg-crisis-secondary transition-all duration-200 group"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Start Crisis Chat
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  href="/community"
                  className="flex items-center justify-center px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all duration-200"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Peer Support
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Warning Signs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 mb-8"
          >
            <h3 className="text-xl font-bold text-neutral-800 mb-4">
              Warning Signs to Watch For
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Thoughts of suicide or self-harm</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Feeling hopeless or trapped</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Severe mood changes</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Withdrawal from activities and people</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Substance abuse</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Giving away possessions</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Extreme anxiety or agitation</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-crisis-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-700">Talking about being a burden</span>
                </li>
              </ul>
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
