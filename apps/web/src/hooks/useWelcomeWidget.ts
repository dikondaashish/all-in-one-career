import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id?: string;
  uid?: string;
  email?: string;
  name?: string;
  firstName?: string;
  createdAt?: string;
  atsScans?: number;
  portfolios?: number;
  emails?: number;
  referrals?: number;
  trackerEvents?: number;
}

export const useWelcomeWidget = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkWelcomeStatus = () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const userId = user.uid || (user as { id?: string }).id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Check if user has dismissed welcome
      const dismissedKey = `welcome-dismissed-${userId}`;
      const dismissed = localStorage.getItem(dismissedKey);
      if (dismissed === 'true') {
        setShouldShow(false);
        setIsLoading(false);
        return;
      }

      // Check if this is a new session (not shown in this session)
      const sessionKey = `welcome-shown-session-${Date.now().toString().slice(0, -6)}`; // Hour-based session
      const shownThisSession = sessionStorage.getItem(sessionKey);
      if (shownThisSession === 'true') {
        setShouldShow(false);
        setIsLoading(false);
        return;
      }

      // Show for new users (created within last 30 days) or users with low activity
      let shouldShowWidget = false;

      // Check if user is new (created recently)
      const creationTime = user.metadata?.creationTime || (user as { createdAt?: string }).createdAt;
      if (creationTime) {
        const createdAt = new Date(creationTime);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCreation <= 30) {
          shouldShowWidget = true;
        }
      }

      // Check for low activity (show if user has minimal engagement)
      const userStats = user as User;
      const totalActivity = (userStats.atsScans || 0) + 
                           (userStats.portfolios || 0) + 
                           (userStats.emails || 0) + 
                           (userStats.referrals || 0) + 
                           (userStats.trackerEvents || 0);

      if (totalActivity < 5) {
        shouldShowWidget = true;
      }

      // For existing users without creation time, show if they seem to need guidance
      if (!creationTime && totalActivity === 0) {
        shouldShowWidget = true;
      }

      setShouldShow(shouldShowWidget);
      setIsLoading(false);

      // Mark as shown in this session
      if (shouldShowWidget) {
        sessionStorage.setItem(sessionKey, 'true');
      }
    };

    // Delay check to ensure user data is loaded
    const timer = setTimeout(checkWelcomeStatus, 500);
    
    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    setShouldShow(false);
    if (user && (user.uid || (user as { id?: string }).id)) {
      const userId = user.uid || (user as { id?: string }).id;
      localStorage.setItem(`welcome-dismissed-${userId}`, 'true');
    }
  };

  const forceShow = () => {
    setShouldShow(true);
  };

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    const userWithName = user as { name?: string };
    if (userWithName?.name) return userWithName.name.split(' ')[0];
    const userWithFirstName = user as { firstName?: string };
    if (userWithFirstName?.firstName) return userWithFirstName.firstName;
    if (user?.email) return user.email.split('@')[0];
    return null;
  };

  return { 
    shouldShow, 
    dismiss, 
    forceShow,
    isLoading,
    userName: getUserDisplayName()
  };
};
