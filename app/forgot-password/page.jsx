'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState('email'); // 'email' or 'id'
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where(searchType === 'email' ? 'email' : 'idNumber', '==', searchValue)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('No account found with the provided information');
        setUserData(null);
      } else {
        const userDoc = querySnapshot.docs[0];
        setUserData({
          id: userDoc.id,
          ...userDoc.data()
        });
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error('An error occurred while searching for your account');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userData?.email) {
      toast.error('No email address found for this account');
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, userData.email);
      toast.success('Password reset email sent! Please check your inbox');
      router.push('/login');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email. Please try again later');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground">
              Search for your account to reset your password
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={searchType === 'email' ? 'default' : 'outline'}
                onClick={() => setSearchType('email')}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Search by Email
              </Button>
              <Button
                variant={searchType === 'id' ? 'default' : 'outline'}
                onClick={() => setSearchType('id')}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                Search by ID
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                type={searchType === 'email' ? 'email' : 'text'}
                placeholder={searchType === 'email' ? 'Enter your email' : 'Enter your ID number'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="shrink-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {userData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {userData.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt={userData.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{userData.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{userData.email}</p>
                </div>
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isResetting}
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isResetting ? 'Sending Reset Email...' : 'Reset Password'}
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
} 