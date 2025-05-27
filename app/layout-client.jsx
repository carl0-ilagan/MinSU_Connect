'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AuthProvider } from "@/hooks/use-auth"
import { ToastProvider } from "@/hooks/use-toast"
import { GlobalNotification } from "@/components/ui/global-notification"

// Separate component for user status check
function UserStatusCheck({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user && !pathname.startsWith('/restricted')) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.isBanned) {
              router.push(`/restricted?type=banned&reason=${userData.banReason || 'Your account has been banned.'}`);
              return;
            }
            
            if (userData.isDeactivated) {
              router.push(`/restricted?type=deactivated&reason=${userData.deactivationReason || 'Your account has been deactivated.'}`);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    };

    checkUserStatus();
  }, [user, pathname, router]);

  return children;
}

export default function RootLayoutClient({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserStatusCheck>
          <GlobalNotification />
          {children}
        </UserStatusCheck>
      </AuthProvider>
    </ToastProvider>
  );
} 