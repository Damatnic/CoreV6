'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Users,
  Shield,
  Lightbulb,
  Target,
  Award,
  ArrowLeft,
  Mail,
  Globe,
  Github
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Compassionate Care',
      description: 'We believe in treating every person with kindness, empathy, and understanding on their mental health journey.'
    },
    {
      icon: Shield,
      title: 'Privacy & Safety',
      description: 'Your mental health data is sacred. We use industry-leading security to protect your privacy and personal information.'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Healing happens in community. We foster safe spaces for genuine connection and mutual support.'
    },
    {
      icon: Lightbulb,
      title: 'Evidence-Based',
      description: 'Our tools and approaches are grounded in proven psychological research and therapeutic practices.'
    }
  ];

  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Clinical Director',
      description: 'Licensed clinical psychologist with 15+ years in digital mental health',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Head of Product',
      description: 'Former Google PM passionate about accessible mental health technology',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Dr. Aisha Patel',
      role: 'Research Lead',
      description: 'PhD in Psychology, specializing in anxiety and depression treatment',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Jamie Liu',
      role: 'Community Manager',
      description: 'Mental health advocate focused on building supportive communities',
      image: '/api/placeholder/150/150'
    }
  ];

  const stats = [
    { number: '50K+', label: 'People Supported' },
    { number: '1M+', label: 'Sessions Completed' },
    { number: '98%', label: 'User Satisfaction' },
    { number: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 mb-12"
        >
          <Link 
            href="/"
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-neutral-800">About Astral Core</h1>
            <p className="text-xl text-neutral-600 mt-2">Empowering mental wellness through technology and community</p>
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white p-12 mb-16 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl leading-relaxed max-w-4xl mx-auto">
            To make mental health support accessible, personalized, and effective for everyone. 
            We combine evidence-based therapeutic approaches with cutting-edge technology to create 
            a comprehensive platform that meets you wherever you are in your mental health journey.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-neutral-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-neutral-800 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <value.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-800">{value.title}</h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl shadow-lg p-12 mb-16"
        >
          <h2 className="text-3xl font-bold text-neutral-800 mb-8 text-center">Our Story</h2>
          <div className="max-w-4xl mx-auto space-y-6 text-neutral-700 leading-relaxed">
            <p>
              Astral Core was born from a simple yet powerful realization: mental health support should be 
              as accessible as checking the weather on your phone. Our founders, a team of mental health 
              professionals, technologists, and lived experience experts, came together with a shared vision 
              of breaking down barriers to mental wellness.
            </p>
            <p>
              After witnessing firsthand the challenges people face when seeking mental health support—long 
              wait times, high costs, stigma, and lack of culturally competent care—we knew we had to act. 
              We began building a platform that would democratize access to quality mental health resources 
              while maintaining the human connection that's so crucial to healing.
            </p>
            <p>
              Today, Astral Core serves thousands of individuals worldwide, providing 24/7 access to 
              evidence-based tools, peer support communities, and professional guidance. We&apos;re not just 
              building an app; we&apos;re nurturing a movement toward a world where mental health support is 
              available, affordable, and effective for everyone.
            </p>
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-neutral-800 text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-neutral-800 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-neutral-600 text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl text-white p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Have questions, feedback, or want to learn more about our mission? 
            We&apos;d love to hear from you.
          </p>
          
          <div className="flex justify-center space-x-8">
            <a 
              href="mailto:hello@astralcore.app"
              className="flex items-center space-x-3 bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-full transition-all"
            >
              <Mail className="w-5 h-5" />
              <span>hello@astralcore.app</span>
            </a>
            
            <a 
              href="https://astralcore.app"
              className="flex items-center space-x-3 bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-full transition-all"
            >
              <Globe className="w-5 h-5" />
              <span>astralcore.app</span>
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}