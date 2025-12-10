'use client';

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function NoticePopup() {
  const [notice, setNotice] = useState<{ title: string; content: string; isActive: boolean } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await fetch('/api/admin/notice-popup');
        if (response.ok) {
          const data = await response.json();
          if (data.isActive) {
            setNotice(data);
            
            const lastSeen = localStorage.getItem('noticePopupLastSeen');
            const today = new Date().toDateString();
            
            if (lastSeen !== today) {
              setTimeout(() => setIsVisible(true), 1000);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching notice popup:', error);
      }
    };

    fetchNotice();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('noticePopupLastSeen', new Date().toDateString());
  };

  if (!notice || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[300]"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="backdrop-blur-lg bg-gray-900/95 border border-cyan-500/50 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative p-6 overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all"
            >
              <FaTimes size={16} />
            </button>
            
            <h3 className="text-2xl font-bold text-cyan-400 mb-4 pr-8">
              {notice.title}
            </h3>
            
            <div className="prose prose-sm prose-invert prose-cyan max-w-none text-gray-300">
              <ReactMarkdown>
                {notice.content}
              </ReactMarkdown>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-6 rounded-lg font-bold transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
