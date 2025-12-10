'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      
      // Handle MaxelPay malformed URL
      if (path.includes('membership') && path.includes('&')) {
        const parts = path.split('&');
        if (parts[0].endsWith('membership')) {
          const queryParams = parts.slice(1).join('&');
          router.replace('/membership?' + queryParams);
          return;
        }
      }
    }
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl">Page not found</p>
      </div>
    </div>
  );
}
