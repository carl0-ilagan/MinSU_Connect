import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming you have firebase initialized and exported as db
import { useAuth } from './use-auth'; // Assuming you have a useAuth hook

export const useUnreadMessages = () => {
  const { user } = useAuth(); // Get the current authenticated user
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query conversations where the current user is a participant
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      snapshot.forEach((doc) => {
        const conversationData = doc.data();
        // Sum up the unread count for the current user from each conversation
        totalUnread += conversationData.unreadCount?.[user.uid] || 0;
      });
      setUnreadCount(totalUnread);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching unread messages:", err);
      setError(err);
      setLoading(false);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();

  }, [user?.uid]); // Re-run effect if user changes

  return { unreadCount, loading, error };
}; 