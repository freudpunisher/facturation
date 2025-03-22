// components/LoadingProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingModal from './LoadingModal';

type LoadingContextType = {
  setLoading: (loading: boolean) => void;
  loading: boolean;
};

const LoadingContext = createContext<LoadingContextType>({
  setLoading: () => {},
  loading: false
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState('');

  useEffect(() => {
    if (prevPathname !== pathname && prevPathname !== '') {
      setLoading(true);
      
      // Add a small delay to ensure loading state is visible
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timeout);
    }
    setPrevPathname(pathname);
  }, [pathname, searchParams, prevPathname]);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && <LoadingModal />}
      {children}
    </LoadingContext.Provider>
  );
}