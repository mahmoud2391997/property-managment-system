'use client';
import React from 'react';
import { Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnderDevelopment() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl rounded-2xl p-12 max-w-lg w-full border border-gray-100"
      >
        <Wrench className="w-16 h-16 mx-auto mb-6 text-gray-900" />

        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Page Under Development
        </h1>

        <p className="text-gray-700 text-lg">
          This page is currently being built and will be available soon.
        </p>
        <p className="text-gray-700 text-lg mt-2">
          Thank you for your patience.
        </p>
      </motion.div>
    </div>
  );
}