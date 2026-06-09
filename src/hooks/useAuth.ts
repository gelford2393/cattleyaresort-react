import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { auth, firestore } from '../lib/firebase';

function useFirebaseUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return user;
}

export function useAuth() {
  const user = useFirebaseUser();
  const authLoading = user === undefined;

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['userRole', user?.uid ?? null],
    queryFn: async () => {
      if (!user) return null;
      const snap = await getDoc(doc(firestore, 'users', user.uid));
      return snap.exists() ? (snap.data()?.role as string) : null;
    },
    enabled: !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isAdmin: role === 'admin',
    loading: authLoading || roleLoading,
  };
}
