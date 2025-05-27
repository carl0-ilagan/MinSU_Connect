'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, AlertTriangle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function RestrictedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RestrictedContent />
    </Suspense>
  );
}

function RestrictedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const type = searchParams.get('type');
    const reason = searchParams.get('reason');
    setType(type);
    setReason(reason);
  }, [searchParams]);

  const handleBackToLogin = async () => {
    try {
      // Sign out the user
      await signOut(auth);
      // Clear any stored state
      localStorage.removeItem('user');
      sessionStorage.clear();
      // Redirect to login with a clean state
      router.push('/login?redirect=home');
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback to simple redirect if signout fails
      router.push('/login?redirect=home');
    }
  };

  const getContent = () => {
    switch (type) {
      case 'banned':
        return {
          icon: <Lock className="h-16 w-16 text-red-500" />,
          title: "Access Denied",
          description: "Your account has been banned from accessing the platform.",
          color: "text-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconAnimation: {
            y: [0, -5, 0],
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.1, 1],
            transition: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }
          }
        };
      case 'deactivated':
        return {
          icon: <Lock className="h-16 w-16 text-amber-500" />,
          title: "Access Denied",
          description: "Your account has been temporarily deactivated.",
          color: "text-amber-500",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          iconAnimation: {
            y: [0, -5, 0],
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.1, 1],
            transition: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }
          }
        };
      default:
        return {
          icon: <Lock className="h-16 w-16 text-slate-500" />,
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          color: "text-slate-500",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          iconAnimation: {
            y: [0, -5, 0],
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.1, 1],
            transition: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }
          }
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={`max-w-md w-full p-8 rounded-2xl shadow-lg ${content.bgColor} border ${content.borderColor}`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <motion.div
            animate={content.iconAnimation}
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
            transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
            }}
          >
            {content.icon}
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255, 0, 0, 0)",
                  "0 0 0 10px rgba(255, 0, 0, 0.1)",
                  "0 0 0 0 rgba(255, 0, 0, 0)"
                ]
              }}
              transition={{
                duration: 2,
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
              className={`text-2xl font-bold ${content.color}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {content.title}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {reason || content.description}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full"
                onClick={handleBackToLogin}
            >
                Back to Login
            </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
} 