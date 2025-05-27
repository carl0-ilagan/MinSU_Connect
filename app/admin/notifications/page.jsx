'use client';

import { motion } from 'framer-motion';
import { Bell, Construction } from 'lucide-react';

export default function AdminNotificationsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-white border border-gray-200"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, -8, 8, -8, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="relative"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <Bell className="h-16 w-16 text-blue-500" />
              </motion.div>
              <motion.div
                animate={{
                  rotate: [0, -360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Construction className="h-16 w-16 text-amber-500" />
              </motion.div>
            </div>
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0)",
                  "0 0 0 15px rgba(59, 130, 246, 0.1)",
                  "0 0 0 0 rgba(59, 130, 246, 0)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.h1 
              className="text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Under Development
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              The notifications system is currently under development. Please check back later.
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
} 