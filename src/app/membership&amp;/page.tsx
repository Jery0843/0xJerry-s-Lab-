'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MembershipRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    const search = window.location.search || window.location.pathname.split('&amp;').slice(1).join('&');
    router.replace('/membership?' + search);
  }, [router]);
  
  return null;
}
