'use client';
import React, { useState } from 'react';
import { Wrench, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function UnderDevelopment() {
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

export function SectionUnderDevelopment() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full border border-gray-100"
      >
        <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-900" />

        <h2 className="text-2xl font-bold mb-3 text-gray-900">
          Section Under Development
        </h2>

        <p className="text-gray-700">
          This section is currently being built and will be available soon.
        </p>
      </motion.div>
    </div>
  );
}

// Hook to show action under development overlay
export function useActionUnderDevelopment() {
  const [isOpen, setIsOpen] = useState(false);

  const showUnderDevelopment = () => setIsOpen(true);
  const hideUnderDevelopment = () => setIsOpen(false);

  const ActionUnderDevelopmentOverlay = () => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={hideUnderDevelopment}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white shadow-xl rounded-2xl p-8 max-w-sm w-full mx-4 border border-gray-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={hideUnderDevelopment}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <Wrench className="w-10 h-10 mx-auto mb-4 text-gray-900" />

            <h3 className="text-xl font-bold mb-2 text-gray-900 text-center">
              Action Under Development
            </h3>

            <p className="text-gray-700 text-center text-sm">
              This action is currently being built and will be available soon.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { showUnderDevelopment, ActionUnderDevelopmentOverlay };
}