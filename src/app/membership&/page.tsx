'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MembershipRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    const path = window.location.pathname;
    const queryPart = path.substring('/membership&'.length);
    router.replace('/membership?' + queryPart);
  }, [router]);
  
  return null;
}
