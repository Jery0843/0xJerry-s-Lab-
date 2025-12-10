'use client';

import Link from 'next/link';
import { FaLock, FaUserShield } from 'react-icons/fa';

interface WriteupAccessDeniedProps {
  title: string;
  type: 'htb' | 'ctf';
  requiredTier: string;
  userTier?: string | null;
  isLoggedIn: boolean;
}

const WriteupAccessDenied = ({ title, type, requiredTier, userTier, isLoggedIn }: WriteupAccessDeniedProps) => {
  const getAccessMessage = () => {
    if (!isLoggedIn) {
      return 'You need to be logged in with an active membership to access this writeup.';
    }
    
    if (!userTier) {
      return 'Your account does not have an active membership tier.';
    }
    
    const displayTier = requiredTier === 'Both' ? 'Sudo Access or Root Access' : requiredTier;
    return `This writeup requires "${displayTier}" access, but you have "${userTier}" access.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="rounded-2xl backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <FaLock className="text-red-400 text-2xl" />
          </div>
          <h1 className="text-2xl font-cyber font-bold text-red-400 mb-2">
            ACCESS DENIED
          </h1>
          <p className="text-gray-400 mb-2">
            <span className="text-cyber-green">{title}</span>
          </p>
          <p className="text-sm text-gray-500">
            {type === 'htb' ? 'HackTheBox Machine' : 'CTF Challenge'}
          </p>
        </div>

        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <FaUserShield className="text-yellow-400 text-xl mt-1" />
            <div>
              <p className="text-yellow-400 text-sm font-semibold mb-1">
                Membership Required
              </p>
              <p className="text-gray-300 text-sm">
                {getAccessMessage()}
              </p>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-black/30 rounded border border-yellow-500/30">
            <p className="text-xs text-gray-400 mb-1">Required Access:</p>
            <p className="text-yellow-400 font-semibold">
              {requiredTier === 'Both' ? 'Sudo Access or Root Access' : requiredTier}
            </p>
          </div>
          

        </div>

        <div className="space-y-3">
          {!isLoggedIn ? (
            <>
              <Link 
                href="/membership" 
                className="block w-full bg-cyber-green text-white py-3 px-4 rounded font-bold hover:bg-cyber-blue transition-colors text-center"
              >
                Get Membership
              </Link>
              <p className="text-center text-sm text-gray-400">
                Already a member? Login with your email to access writeups.
              </p>
            </>
          ) : (
            <>
              <Link 
                href="/membership" 
                className="block w-full bg-cyber-purple text-white py-3 px-4 rounded font-bold hover:bg-cyber-blue transition-colors text-center"
              >
                Upgrade Membership
              </Link>
              <p className="text-center text-sm text-gray-400">
                Contact support if you believe this is an error.
              </p>
            </>
          )}
          
          <Link 
            href={type === 'htb' ? '/machines/htb' : '/ctf'}
            className="block w-full bg-transparent border border-cyber-green text-cyber-green py-3 px-4 rounded font-bold hover:bg-cyber-green hover:text-white transition-colors text-center"
          >
            ← Back to {type === 'htb' ? 'HTB Machines' : 'CTF Challenges'}
          </Link>
        </div>


      </div>
    </div>
  );
};

export default WriteupAccessDenied;
