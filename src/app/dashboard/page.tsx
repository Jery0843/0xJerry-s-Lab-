'use client';

import { useState, useEffect, useRef } from 'react';
import { FaUser, FaCrown, FaSignOutAlt, FaComments, FaBook, FaCog, FaEnvelope, FaMapMarkerAlt, FaNetworkWired, FaPaperPlane, FaSmile, FaPoll, FaThumbtack, FaTrash, FaLifeRing, FaTimes, FaPlus, FaDownload } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface UserProfile {
  name: string;
  email: string;
  country: string;
  ip: string;
}

interface Membership {
  platform: string;
  tier_name: string;
  status: string;
  subscribed_at: string;
}

type ActiveSection = 'profile' | 'membership' | 'activity' | 'rootchat' | 'writeups' | 'support';

interface ChatMessage {
  id: number;
  user_name: string;
  user_email: string;
  message: string;
  created_at: string;
  reactions?: string;
  is_pinned?: number;
  is_deleted?: number;
  deleted_by?: string;
}

interface Poll {
  id: number;
  user_name: string;
  question: string;
  options: string;
  votes?: string;
  created_at: string;
}

const UserDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');

  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const hasSession = cookies.some(c => c.trim().startsWith('user_session='));
      if (!hasSession) {
        window.location.replace('/?login=true');
        return false;
      }
      return true;
    };

    if (!checkAuth()) return;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setMembership(data.membership);
        } else {
          window.location.replace('/?login=true');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        window.location.replace('/?login=true');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/user/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [writeups, setWriteups] = useState<any[]>([]);
  const [writeupsLoading, setWriteupsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollChatType, setPollChatType] = useState<'sudo' | 'root'>('sudo');
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [chatContainerRef, setChatContainerRef] = useState<HTMLDivElement | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [rootMessages, setRootMessages] = useState<ChatMessage[]>([]);
  const [rootPolls, setRootPolls] = useState<Poll[]>([]);
  const [rootChatLoading, setRootChatLoading] = useState(false);
  const [rootPinnedMessages, setRootPinnedMessages] = useState<ChatMessage[]>([]);
  const [rootHoveredMessage, setRootHoveredMessage] = useState<number | null>(null);
  const [rootNewMessage, setRootNewMessage] = useState('');
  const [sendingRootMessage, setSendingRootMessage] = useState(false);
  const [hasScrolledOnceRoot, setHasScrolledOnceRoot] = useState(false);
  const [rootChatContainerRef, setRootChatContainerRef] = useState<HTMLDivElement | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ name: '', subject: '', issue: '' });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatMaintenance, setChatMaintenance] = useState({ sudo: false, root: false });
  const sudoFileInputRef = useRef<HTMLInputElement>(null);
  const rootFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSudoFile, setUploadingSudoFile] = useState(false);
  const [uploadingRootFile, setUploadingRootFile] = useState(false);
  const [sudoUploadProgress, setSudoUploadProgress] = useState(0);
  const [rootUploadProgress, setRootUploadProgress] = useState(0);
  const [showSudoMenu, setShowSudoMenu] = useState(false);
  const [showRootMenu, setShowRootMenu] = useState(false);

  useEffect(() => {
    if (chatContainerRef && !hasScrolledOnce && messages.length > 0) {
      chatContainerRef.scrollTop = chatContainerRef.scrollHeight;
      setHasScrolledOnce(true);
    }
  }, [messages, chatContainerRef, hasScrolledOnce]);

  const handleDownload = (url: string, filename: string) => {
    const downloadUrl = `/api/user/download-writeup?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sections = [
    { id: 'profile' as ActiveSection, name: 'Profile', icon: FaUser },
    { id: 'membership' as ActiveSection, name: 'Membership', icon: FaCrown },
    { id: 'activity' as ActiveSection, name: 'Sudo Chat', icon: FaComments },
    { id: 'rootchat' as ActiveSection, name: 'Root Chat', icon: FaComments },
    { id: 'writeups' as ActiveSection, name: 'Downloads', icon: FaBook },
    { id: 'support' as ActiveSection, name: 'Support', icon: FaLifeRing }
  ];

  const totalUnreadTickets = tickets.reduce((sum, ticket) => {
    console.log('Ticket:', ticket.subject, 'User Unread:', ticket.user_unread);
    return sum + (ticket.user_unread || 0);
  }, 0);
  console.log('Total unread tickets:', totalUnreadTickets);

  useEffect(() => {
    if (activeSection === 'writeups' && membership?.tier_name === 'Sudo Access') {
      fetchWriteups();
    }
    if (activeSection === 'activity' && membership?.tier_name === 'Sudo Access') {
      fetchChat();
      connectSSE();
      return () => sseRef.current?.close();
    }
    if (activeSection === 'rootchat' && membership?.tier_name === 'Root Access') {
      fetchRootChat();
      connectRootSSE();
      return () => sseRootRef.current?.close();
    }
    if (activeSection === 'support') {
      fetchTickets();
      const interval = setInterval(fetchTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSection, membership]);

  useEffect(() => {
    // Always fetch tickets for notification badge
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket.id);
      const interval = setInterval(() => fetchTicketMessages(selectedTicket.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (rootChatContainerRef && !hasScrolledOnceRoot && rootMessages.length > 0) {
      rootChatContainerRef.scrollTop = rootChatContainerRef.scrollHeight;
      setHasScrolledOnceRoot(true);
    }
  }, [rootMessages, rootChatContainerRef, hasScrolledOnceRoot]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setShowSudoMenu(false);
        setShowRootMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWriteups = async () => {
    setWriteupsLoading(true);
    try {
      const response = await fetch('/api/user/downloadable-writeups', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWriteups(data.writeups);
      }
    } catch (error) {
      console.error('Error fetching writeups:', error);
    } finally {
      setWriteupsLoading(false);
    }
  };

  const sseRef = useRef<EventSource | null>(null);

  const fetchChat = async () => {
    setChatLoading(true);
    try {
      const response = await fetch('/api/sudo-chat', { credentials: 'include' });
      if (response.status === 503) {
        setChatMaintenance(prev => ({ ...prev, sudo: true }));
        return;
      }
      if (response.ok) {
        setChatMaintenance(prev => ({ ...prev, sudo: false }));
        const data = await response.json();
        setMessages(data.messages);
        setPolls(data.polls);
        setPinnedMessages(data.messages.filter((m: ChatMessage) => m.is_pinned === 1));
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const connectSSE = () => {
    const sse = new EventSource('/api/chat-stream?type=sudo');
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update' && data.messages?.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter((m: any) => !existingIds.has(m.id)).map((m: any) => ({
            ...m,
            created_at: m.created_at || new Date().toISOString()
          }));
          return [...prev, ...newMsgs];
        });
      }
    };
    
    sse.onerror = () => {
      sse.close();
      setTimeout(connectSSE, 3000);
    };
    
    sseRef.current = sse;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const response = await fetch('/api/sudo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'message', message: newMessage })
      });
      if (response.status === 403) {
        const data = await response.json();
        alert(data.error || 'You are banned from chat');
        return;
      }
      if (response.ok) {
        setNewMessage('');
        const textarea = document.querySelector('textarea[placeholder*="Shift+Enter"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = '42px';
          textarea.value = '';
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleReaction = async (messageId: number, emoji: string, hasReacted: boolean) => {
    try {
      await fetch('/api/sudo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: hasReacted ? 'unreact' : 'reaction', messageId, reaction: emoji })
      });
      fetchChat();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const createPoll = async () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    try {
      const endpoint = pollChatType === 'sudo' ? '/api/sudo-chat' : '/api/root-chat';
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          type: 'poll', 
          poll: { question: pollQuestion, options: pollOptions.filter(o => o.trim()) }
        })
      });
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      if (pollChatType === 'sudo') {
        fetchChat();
      } else {
        fetchRootChat();
      }
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  };

  const votePoll = async (pollId: number, optionIndex: number) => {
    try {
      await fetch('/api/sudo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'vote', poll: { pollId, optionIndex } })
      });
      fetchChat();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const togglePin = async (messageId: number, isPinned: boolean) => {
    try {
      await fetch('/api/sudo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'pin', messageId, pin: !isPinned })
      });
      fetchChat();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch('/api/sudo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'delete', messageId })
      });
      fetchChat();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const sseRootRef = useRef<EventSource | null>(null);

  const fetchRootChat = async () => {
    setRootChatLoading(true);
    try {
      const response = await fetch('/api/root-chat', { credentials: 'include' });
      if (response.status === 503) {
        setChatMaintenance(prev => ({ ...prev, root: true }));
        return;
      }
      if (response.ok) {
        setChatMaintenance(prev => ({ ...prev, root: false }));
        const data = await response.json();
        setRootMessages(data.messages);
        setRootPolls(data.polls);
        setRootPinnedMessages(data.messages.filter((m: ChatMessage) => m.is_pinned === 1));
      }
    } catch (error) {
      console.error('Error fetching root chat:', error);
    } finally {
      setRootChatLoading(false);
    }
  };

  const connectRootSSE = () => {
    const sse = new EventSource('/api/chat-stream?type=root');
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update' && data.messages?.length > 0) {
        setRootMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter((m: any) => !existingIds.has(m.id)).map((m: any) => ({
            ...m,
            created_at: m.created_at || new Date().toISOString()
          }));
          return [...prev, ...newMsgs];
        });
      }
    };
    
    sse.onerror = () => {
      sse.close();
      setTimeout(connectRootSSE, 3000);
    };
    
    sseRootRef.current = sse;
  };

  const sendRootMessage = async () => {
    if (!rootNewMessage.trim() || sendingRootMessage) return;
    setSendingRootMessage(true);
    try {
      const response = await fetch('/api/root-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'message', message: rootNewMessage })
      });
      if (response.status === 403) {
        const data = await response.json();
        alert(data.error || 'You are banned from chat');
        return;
      }
      if (response.ok) {
        setRootNewMessage('');
        const textareas = document.querySelectorAll('textarea[placeholder*="Shift+Enter"]');
        const textarea = textareas[textareas.length - 1] as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = '42px';
          textarea.value = '';
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingRootMessage(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/support', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const ticketsList = data.tickets?.results || data.tickets || [];
        console.log('Fetched tickets:', ticketsList);
        setTickets(ticketsList);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const submitTicket = async () => {
    if (!ticketForm.name || !ticketForm.subject || !ticketForm.issue) return;
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ticketForm)
      });
      setShowTicketForm(false);
      setTicketForm({ name: '', subject: '', issue: '' });
      fetchTickets();
    } catch (error) {
      console.error('Error submitting ticket:', error);
    }
  };

  const fetchTicketMessages = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/ticket-messages?ticketId=${ticketId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTicketMessages(data.messages?.results || data.messages || []);
        // Reset unread count for this ticket
        await fetch('/api/ticket-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ticketId, type: 'markRead' })
        });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendTicketMessage = async (attachmentUrl?: string, attachmentName?: string) => {
    if (!newTicketMessage.trim() && !attachmentUrl) return;
    try {
      await fetch('/api/ticket-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          ticketId: selectedTicket.id, 
          message: newTicketMessage || '📎 Attachment',
          attachmentUrl,
          attachmentName
        })
      });
      setNewTicketMessage('');
      fetchTicketMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert('File size must be under 20MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-attachment', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const { url, name } = await response.json();
        await sendTicketMessage(url, name);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSudoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert('File size must be under 20MB');
      if (sudoFileInputRef.current) sudoFileInputRef.current.value = '';
      return;
    }
    
    setUploadingSudoFile(true);
    setSudoUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setSudoUploadProgress(progress);
        }
      });
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', '/api/upload-attachment');
      xhr.send(formData);
      
      const result: any = await uploadPromise;
      const { url, name } = result;
      const proxyUrl = `/api/download-attachment?file=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
      const fileMessage = `📎 [${name}](${proxyUrl})`;
      await fetch('/api/sudo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'message', message: fileMessage })
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingSudoFile(false);
      setSudoUploadProgress(0);
      if (sudoFileInputRef.current) sudoFileInputRef.current.value = '';
    }
  };

  const handleRootFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert('File size must be under 20MB');
      if (rootFileInputRef.current) rootFileInputRef.current.value = '';
      return;
    }
    
    setUploadingRootFile(true);
    setRootUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setRootUploadProgress(progress);
        }
      });
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', '/api/upload-attachment');
      xhr.send(formData);
      
      const result: any = await uploadPromise;
      const { url, name } = result;
      const proxyUrl = `/api/download-attachment?file=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
      const fileMessage = `📎 [${name}](${proxyUrl})`;
      await fetch('/api/root-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'message', message: fileMessage })
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingRootFile(false);
      setRootUploadProgress(0);
      if (rootFileInputRef.current) rootFileInputRef.current.value = '';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-cyan-400 pl-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-cyan-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <FaUser className="text-cyan-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Full Name</span>
                </div>
                <p className="text-white text-lg font-medium">{profile?.name}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-cyan-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <FaEnvelope className="text-cyan-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Email</span>
                </div>
                <p className="text-white text-lg font-medium break-all">{profile?.email}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-cyan-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <FaMapMarkerAlt className="text-cyan-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Country</span>
                </div>
                <p className="text-white text-lg font-medium">{profile?.country}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-cyan-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <FaNetworkWired className="text-cyan-400" />
                  </div>
                  <span className="text-gray-400 text-sm">IP Address</span>
                </div>
                <p className="text-white text-lg font-mono">{profile?.ip}</p>
              </div>
            </div>
          </div>
        );
      case 'membership':
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-purple-400 pl-4">Membership Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-purple-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FaCrown className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Platform</span>
                </div>
                <p className="text-white text-lg font-medium">{membership?.platform}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-purple-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FaCrown className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Tier</span>
                </div>
                <p className="text-white text-lg font-medium">{membership?.tier_name}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-purple-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <FaCrown className="text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Status</span>
                </div>
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                  {membership?.status}
                </span>
              </div>
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-purple-400 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FaCrown className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Subscribed</span>
                </div>
                <p className="text-white text-lg font-medium">{membership?.subscribed_at}</p>
              </div>
            </div>
          </div>
        );
      case 'activity':
        if (membership?.tier_name !== 'Sudo Access') {
          return (
            <div className="flex items-center justify-center h-96 animate-fadeIn">
              <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                <p className="text-gray-400">Community Chat is only available for Sudo Access tier members.</p>
              </div>
            </div>
          );
        }
        if (chatMaintenance.sudo) {
          return (
            <div className="flex items-center justify-center h-96 animate-fadeIn">
              <div className="text-center">
                <div className="text-6xl mb-4">🛠️</div>
                <h3 className="text-xl font-bold text-white mb-2">Under Maintenance</h3>
                <p className="text-gray-400">Sudo Chat is currently under maintenance. Please check back later.</p>
              </div>
            </div>
          );
        }
        return (
          <div className="animate-fadeIn flex flex-col chat-container" style={{height: 'calc(100vh - 120px)'}} onWheel={(e) => e.stopPropagation()}>
            <div className="flex items-center px-12 py-2 chat-header">
              <h2 className="text-xs font-medium text-gray-500 tracking-widest">SUDO CHAT</h2>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div 
                ref={(el) => setChatContainerRef(el)}
                className="flex-1 overflow-y-auto chat-message-container"
              >
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-cyan-400 text-xl animate-pulse">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👋</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Welcome to Sudo Community Chat!</h3>
                      <p className="text-gray-400">Start the conversation by sending a message below.</p>
                    </div>
                  </div>
                ) : null}
                {pinnedMessages.length > 0 && (
                  <div className="pinned-messages">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-2">
                      <FaThumbtack className="animate-pulse" /> Pinned Messages
                    </div>
                    {pinnedMessages.map((msg) => (
                      <div key={msg.id} className="text-sm text-gray-300 mb-1">
                        <span className="text-cyan-400 font-medium">{msg.user_name}:</span> {msg.message}
                      </div>
                    ))}
                  </div>
                )}
                {polls.map((poll) => {
                  const options = JSON.parse(poll.options);
                  const votes = poll.votes ? JSON.parse(poll.votes) : [];
                  const voteCounts = options.map((_: any, idx: number) => 
                    votes.filter((v: any) => v.option_index === idx).length
                  );
                  const totalVotes = voteCounts.reduce((a: number, b: number) => a + b, 0);
                  const userVote = votes.find((v: any) => v.user_email === profile?.email);
                  
                  return (
                    <div key={poll.id} className="poll-container chat-message">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-purple-400 font-semibold text-sm flex items-center gap-2">
                          <FaPoll /> {poll.user_name}
                        </span>
                        <span className="text-gray-400 text-xs">{new Date(poll.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-white font-semibold mb-3 text-base">{poll.question}</p>
                      <div className="space-y-2">
                        {options.map((option: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => votePoll(poll.id, idx)}
                            disabled={!!userVote}
                            className={`poll-option w-full text-left ${
                              userVote?.option_index === idx ? 'poll-option-voted' : ''
                            } ${userVote ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{option}</span>
                              <span className="text-xs">
                                {voteCounts[idx]} ({totalVotes > 0 ? Math.round((voteCounts[idx] / totalVotes) * 100) : 0}%)
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {messages.map((msg) => {
                  const reactions = msg.reactions ? JSON.parse(msg.reactions) : [];
                  const isOwnMessage = msg.user_email === profile?.email;
                  const isAdmin = msg.user_email?.includes('@admin') || msg.user_name?.includes('👑');
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} chat-message`}>
                      <div 
                        className={`message-bubble min-w-[200px] max-w-[65%] relative group ${
                          isAdmin
                            ? 'message-bubble-admin'
                            : isOwnMessage ? 'message-bubble-own' : 'message-bubble-other'
                        }`}
                        onMouseEnter={() => setHoveredMessage(msg.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        {!isOwnMessage && (
                          <div className={`message-username ${
                            isAdmin ? 'text-yellow-400' : 'text-cyan-400'
                          }`}>{msg.user_name}</div>
                        )}
                        {msg.is_deleted === 1 ? (
                          <p className="text-gray-500 text-sm mb-1 italic">{msg.deleted_by && msg.deleted_by !== msg.user_email ? 'Admin deleted this message' : 'Message deleted'}</p>
                        ) : (
                          <div className="text-white text-sm mb-1 chat-markdown">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              components={{
                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />
                              }}
                            >{msg.message}</ReactMarkdown>
                          </div>
                        )}
                        <span className={`text-xs block ${
                          isOwnMessage ? 'text-cyan-200' : 'text-gray-400'
                        }`}>
                          {(() => {
                            const msgDate = new Date(msg.created_at + 'Z');
                            const today = new Date();
                            const isToday = msgDate.toDateString() === today.toDateString();
                            return isToday ? msgDate.toLocaleTimeString() : msgDate.toLocaleString();
                          })()}
                        </span>
                        
                        {hoveredMessage === msg.id && msg.is_deleted !== 1 && (
                          <div className="message-actions">
                            <button
                              onClick={() => togglePin(msg.id, msg.is_pinned === 1)}
                              className={`message-action-btn ${
                                msg.is_pinned === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              }`}
                              title={msg.is_pinned === 1 ? 'Unpin' : 'Pin'}
                            >
                              <FaThumbtack />
                            </button>
                            {isOwnMessage && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="message-action-btn bg-red-700 hover:bg-red-600 text-white"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                            {['👍', '❤️', '😂', '🔥'].map(emoji => {
                              const reactionData = reactions.find((r: any) => r.emoji === emoji);
                              const hasReacted = reactionData?.users?.includes(profile?.email);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji, hasReacted)}
                                  className={`message-action-btn ${
                                    hasReacted ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        
                        {reactions.filter((r: any) => r.count > 0).length > 0 && (
                          <div className="message-reactions">
                            {reactions.filter((r: any) => r.count > 0).map((r: any, idx: number) => (
                              <span key={idx} className="reaction-badge">
                                {r.emoji} {r.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="chat-input-container">
                {uploadingSudoFile && (
                  <div className="upload-progress">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-cyan-400 font-medium">Uploading file...</span>
                      <span className="text-xs text-cyan-400 font-semibold">{sudoUploadProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${sudoUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="file" ref={sudoFileInputRef} onChange={handleSudoFileUpload} className="hidden" />
                  <div className="relative menu-container">
                    <button
                      onClick={() => setShowSudoMenu(!showSudoMenu)}
                      disabled={uploadingSudoFile}
                      className="chat-btn chat-btn-secondary h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingSudoFile ? '...' : <FaPlus />}
                    </button>
                    {showSudoMenu && (
                      <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                        <button
                          onClick={() => { sudoFileInputRef.current?.click(); setShowSudoMenu(false); }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <FaPlus /> Upload File
                        </button>
                        <button
                          onClick={() => { setPollChatType('sudo'); setShowPollModal(true); setShowSudoMenu(false); }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <FaPoll /> Create Poll
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 chat-input resize-none overflow-hidden"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '42px';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage}
                    className="chat-btn chat-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? '...' : <FaPaperPlane />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'rootchat':
        if (membership?.tier_name !== 'Root Access') {
          return (
            <div className="flex items-center justify-center h-96 animate-fadeIn">
              <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                <p className="text-gray-400">Root Chat is only available for Root Access tier members.</p>
              </div>
            </div>
          );
        }
        if (chatMaintenance.root) {
          return (
            <div className="flex items-center justify-center h-96 animate-fadeIn">
              <div className="text-center">
                <div className="text-6xl mb-4">🛠️</div>
                <h3 className="text-xl font-bold text-white mb-2">Under Maintenance</h3>
                <p className="text-gray-400">Root Chat is currently under maintenance. Please check back later.</p>
              </div>
            </div>
          );
        }
        return (
          <div className="animate-fadeIn flex flex-col chat-container" style={{height: 'calc(100vh - 120px)'}} onWheel={(e) => e.stopPropagation()}>
            <div className="flex items-center px-12 py-2 chat-header">
              <h2 className="text-xs font-medium text-gray-500 tracking-widest">ROOT CHAT</h2>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div 
                ref={(el) => setRootChatContainerRef(el)}
                className="flex-1 overflow-y-auto chat-message-container"
              >
                {rootChatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-cyan-400 text-xl animate-pulse">Loading messages...</div>
                  </div>
                ) : rootMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👋</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Welcome to Root Community Chat!</h3>
                      <p className="text-gray-400">Start the conversation by sending a message below.</p>
                    </div>
                  </div>
                ) : null}
                {rootPinnedMessages.length > 0 && (
                  <div className="pinned-messages">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-2">
                      <FaThumbtack className="animate-pulse" /> Pinned Messages
                    </div>
                    {rootPinnedMessages.map((msg) => (
                      <div key={msg.id} className="text-sm text-gray-300 mb-1">
                        <span className="text-cyan-400 font-medium">{msg.user_name}:</span> {msg.message}
                      </div>
                    ))}
                  </div>
                )}
                {rootPolls.map((poll) => {
                  const options = JSON.parse(poll.options);
                  const votes = poll.votes ? JSON.parse(poll.votes) : [];
                  const voteCounts = options.map((_: any, idx: number) => 
                    votes.filter((v: any) => v.option_index === idx).length
                  );
                  const totalVotes = voteCounts.reduce((a: number, b: number) => a + b, 0);
                  const userVote = votes.find((v: any) => v.user_email === profile?.email);
                  
                  return (
                    <div key={poll.id} className="poll-container chat-message">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-purple-400 font-semibold text-sm flex items-center gap-2">
                          <FaPoll /> {poll.user_name}
                        </span>
                        <span className="text-gray-400 text-xs">{new Date(poll.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-white font-semibold mb-3 text-base">{poll.question}</p>
                      <div className="space-y-2">
                        {options.map((option: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={async () => {
                              try {
                                await fetch('/api/root-chat', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ type: 'vote', poll: { pollId: poll.id, optionIndex: idx } })
                                });
                                fetchRootChat();
                              } catch (error) {
                                console.error('Error voting:', error);
                              }
                            }}
                            disabled={!!userVote}
                            className={`poll-option w-full text-left ${
                              userVote?.option_index === idx ? 'poll-option-voted' : ''
                            } ${userVote ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{option}</span>
                              <span className="text-xs">
                                {voteCounts[idx]} ({totalVotes > 0 ? Math.round((voteCounts[idx] / totalVotes) * 100) : 0}%)
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {rootMessages.map((msg) => {
                  const reactions = msg.reactions ? JSON.parse(msg.reactions) : [];
                  const isOwnMessage = msg.user_email === profile?.email;
                  const isAdmin = msg.user_email?.includes('@admin') || msg.user_name?.includes('👑');
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} chat-message`}>
                      <div 
                        className={`message-bubble min-w-[200px] max-w-[65%] relative group ${
                          isAdmin
                            ? 'message-bubble-admin'
                            : isOwnMessage ? 'message-bubble-own' : 'message-bubble-other'
                        }`}
                        onMouseEnter={() => setRootHoveredMessage(msg.id)}
                        onMouseLeave={() => setRootHoveredMessage(null)}
                      >
                        {!isOwnMessage && (
                          <div className={`message-username ${
                            isAdmin ? 'text-yellow-400' : 'text-cyan-400'
                          }`}>{msg.user_name}</div>
                        )}
                        {msg.is_deleted === 1 ? (
                          <p className="text-gray-500 text-sm mb-1 italic">{msg.deleted_by && msg.deleted_by !== msg.user_email ? 'Admin deleted this message' : 'Message deleted'}</p>
                        ) : (
                          <div className="text-white text-sm mb-1 chat-markdown">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              components={{
                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />
                              }}
                            >{msg.message}</ReactMarkdown>
                          </div>
                        )}
                        <span className={`text-xs block ${
                          isOwnMessage ? 'text-cyan-200' : 'text-gray-400'
                        }`}>
                          {(() => {
                            const msgDate = new Date(msg.created_at + 'Z');
                            const today = new Date();
                            const isToday = msgDate.toDateString() === today.toDateString();
                            return isToday ? msgDate.toLocaleTimeString() : msgDate.toLocaleString();
                          })()}
                        </span>
                        {rootHoveredMessage === msg.id && msg.is_deleted !== 1 && (
                          <div className="message-actions">
                            <button
                              onClick={async () => {
                                try {
                                  await fetch('/api/root-chat', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ type: 'pin', messageId: msg.id, pin: msg.is_pinned !== 1 })
                                  });
                                  fetchRootChat();
                                } catch (error) {
                                  console.error('Error toggling pin:', error);
                                }
                              }}
                              className={`message-action-btn ${
                                msg.is_pinned === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              }`}
                              title={msg.is_pinned === 1 ? 'Unpin' : 'Pin'}
                            >
                              <FaThumbtack />
                            </button>
                            {isOwnMessage && (
                              <button
                                onClick={async () => {
                                  if (!confirm('Delete this message?')) return;
                                  try {
                                    await fetch('/api/root-chat', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ type: 'delete', messageId: msg.id })
                                    });
                                    fetchRootChat();
                                  } catch (error) {
                                    console.error('Error deleting message:', error);
                                  }
                                }}
                                className="message-action-btn bg-red-700 hover:bg-red-600 text-white"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                            {['👍', '❤️', '😂', '🔥'].map(emoji => {
                              const reactionData = reactions.find((r: any) => r.emoji === emoji);
                              const hasReacted = reactionData?.users?.includes(profile?.email);
                              return (
                                <button
                                  key={emoji}
                                  onClick={async () => {
                                    try {
                                      await fetch('/api/root-chat', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ type: hasReacted ? 'unreact' : 'reaction', messageId: msg.id, reaction: emoji })
                                      });
                                      fetchRootChat();
                                    } catch (error) {
                                      console.error('Error toggling reaction:', error);
                                    }
                                  }}
                                  className={`message-action-btn ${
                                    hasReacted ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {reactions.filter((r: any) => r.count > 0).length > 0 && (
                          <div className="message-reactions">
                            {reactions.filter((r: any) => r.count > 0).map((r: any, idx: number) => (
                              <span key={idx} className="reaction-badge">
                                {r.emoji} {r.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="chat-input-container">
                {uploadingRootFile && (
                  <div className="upload-progress">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-cyan-400 font-medium">Uploading file...</span>
                      <span className="text-xs text-cyan-400 font-semibold">{rootUploadProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${rootUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="file" ref={rootFileInputRef} onChange={handleRootFileUpload} className="hidden" />
                  <div className="relative menu-container">
                    <button
                      onClick={() => setShowRootMenu(!showRootMenu)}
                      disabled={uploadingRootFile}
                      className="chat-btn chat-btn-secondary h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingRootFile ? '...' : <FaPlus />}
                    </button>
                    {showRootMenu && (
                      <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                        <button
                          onClick={() => { rootFileInputRef.current?.click(); setShowRootMenu(false); }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <FaPlus /> Upload File
                        </button>
                        <button
                          onClick={() => { setPollChatType('root'); setShowPollModal(true); setShowRootMenu(false); }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <FaPoll /> Create Poll
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={rootNewMessage}
                    onChange={(e) => setRootNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendRootMessage();
                      }
                    }}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 chat-input resize-none overflow-hidden"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '42px';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendRootMessage}
                    disabled={sendingRootMessage}
                    className="chat-btn chat-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingRootMessage ? '...' : <FaPaperPlane />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'writeups':
        if (membership?.tier_name !== 'Sudo Access') {
          return (
            <div className="flex items-center justify-center h-96 animate-fadeIn">
              <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                <p className="text-gray-400">This section is only available for Sudo Access tier members.</p>
              </div>
            </div>
          );
        }
        return (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-8">Downloads</h2>
            {writeupsLoading ? (
              <div className="text-center py-12">
                <div className="text-cyan-400 text-xl animate-pulse">Loading writeups...</div>
              </div>
            ) : writeups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400">No downloadable writeups available yet.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {writeups.map((writeup) => (
                  <button
                    key={writeup.id}
                    onClick={() => handleDownload(writeup.downloadLink, `${writeup.name.replace(/[^a-z0-9]/gi, '-')}.md`)}
                    className="bg-gray-900 border border-gray-700 p-6 rounded-xl hover:border-green-400 transition-all duration-300 flex flex-col group cursor-pointer text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{writeup.type}</div>
                        <div className="text-white font-medium group-hover:text-green-400 transition-colors">{writeup.name}</div>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(writeup.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'support':
        if (!selectedTicket) {
          return (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
                <button onClick={() => setShowTicketForm(true)} className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600">
                  Open a Ticket
                </button>
              </div>
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="bg-gray-900 border border-gray-700 p-4 rounded-xl hover:border-cyan-400 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold">{ticket.subject}</h3>
                        {ticket.user_unread > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{ticket.user_unread}</span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>{ticket.status}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{new Date(ticket.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              {showTicketForm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                  <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Open a Ticket</h3>
                      <button onClick={() => setShowTicketForm(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
                    </div>
                    <input type="text" value={ticketForm.name} onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})} placeholder="Name" className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded mb-3" required />
                    <input type="email" value={profile?.email || ''} disabled className="w-full bg-gray-800 border border-gray-700 text-gray-500 px-4 py-2 rounded mb-3" />
                    <input type="text" value={ticketForm.subject} onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})} placeholder="Subject" className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded mb-3" required />
                    <textarea value={ticketForm.issue} onChange={(e) => setTicketForm({...ticketForm, issue: e.target.value})} placeholder="Describe your issue" className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded mb-3 h-32" required />
                    <div className="flex gap-2">
                      <button onClick={() => setShowTicketForm(false)} className="flex-1 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
                      <button onClick={submitTicket} className="flex-1 bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600">Submit</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="animate-fadeIn flex flex-col" style={{height: 'calc(100vh - 120px)'}}>
            <div className="p-4 bg-gray-900 border-b border-gray-700">
              <button onClick={() => setSelectedTicket(null)} className="text-cyan-400 mb-2 hover:text-cyan-300">← Back to Tickets</button>
              <h3 className="text-white font-bold text-lg">{selectedTicket.subject}</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedTicket.issue}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                selectedTicket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>{selectedTicket.status}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
              {ticketMessages.map(msg => (
                <div key={msg.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${
                      msg.sender_email === 'admin' ? 'text-yellow-400' : 'text-cyan-400'
                    }`}>{msg.sender_name}</span>
                    <span className="text-gray-500 text-xs">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-white bg-gray-800 p-3 rounded-lg">
                    <p>{msg.message}</p>
                    {msg.attachment_url && (
                      <a href={`/api/download-attachment?file=${encodeURIComponent(msg.attachment_url)}&name=${encodeURIComponent(msg.attachment_name || 'attachment')}`} className="flex items-center gap-2 mt-2 text-cyan-400 hover:text-cyan-300 text-sm">
                        <FaDownload /> {msg.attachment_name || 'Download Attachment'}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedTicket.status === 'open' && (
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-50">
                    {uploadingFile ? '...' : <FaPlus />}
                  </button>
                  <input type="text" value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendTicketMessage()} placeholder="Type a message..." className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded" />
                  <button onClick={() => sendTicketMessage()} className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600"><FaPaperPlane /></button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-96 animate-fadeIn">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-bold text-white mb-2">{sections.find(s => s.id === activeSection)?.name}</h3>
              <p className="text-gray-400">Coming soon...</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
        </div>
        <nav className="flex-1 p-4">
          {sections.map((section) => {
            if ((section.id === 'writeups' || section.id === 'activity') && membership?.tier_name !== 'Sudo Access') {
              return null;
            }
            if (section.id === 'rootchat' && membership?.tier_name !== 'Root Access') {
              return null;
            }
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="text-lg" />
                <span className="font-medium">{section.name}</span>
                {section.id === 'support' && totalUnreadTickets > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{totalUnreadTickets}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <FaSignOutAlt />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {renderContent()}
      </div>

      {/* Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Create Poll</h3>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Poll question"
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg mb-3"
            />
            {pollOptions.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...pollOptions];
                  newOpts[idx] = e.target.value;
                  setPollOptions(newOpts);
                }}
                placeholder={`Option ${idx + 1}`}
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg mb-2"
              />
            ))}
            <button
              onClick={() => setPollOptions([...pollOptions, ''])}
              className="text-cyan-400 text-sm mb-4"
            >
              + Add Option
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPollModal(false)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={createPoll}
                className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
