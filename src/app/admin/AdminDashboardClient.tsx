'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import AdminSecurityDashboard from '@/components/AdminSecurityDashboard';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSync, FaServer, FaGraduationCap, FaTimes, FaSave, FaChartBar, FaCog, FaUser, FaShieldAlt, FaTrophy, FaDownload, FaPaperPlane, FaPoll } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface Machine {
  id: string;
  name: string;
  os: string;
  difficulty: string;
  status: string;
  dateCompleted: string | null;
  tags: string[];
  writeup: string | null;
}

interface THMRoom {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  tags: string[];
  writeup: string | null;
  roomCode: string;
  dateCompleted: string | null;
}

interface CTFWriteup {
  id: string;
  title: string;
  slug: string;
  ctfName: string;
  category: string;
  difficulty: string;
  points: number;
  status: string;
  isActive?: boolean;
  password?: string;
  accessTier?: string;
  dateCompleted: string | null;
  tags: string[];
  writeup: string | null;
  summary: string | null;
  flag?: string;
}

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<'htb' | 'thm' | 'ctf' | 'stats' | 'security' | 'popup' | 'chat' | 'support' | 'background'>('htb');
  
  // HTB State
  const [htbMachines, setHtbMachines] = useState<Machine[]>([]);
  const [showHtbModal, setShowHtbModal] = useState(false);
  const [selectedHtbMachine, setSelectedHtbMachine] = useState<Machine | null>(null);
  
  // THM State
  const [thmRooms, setThmRooms] = useState<THMRoom[]>([]);
  const [showThmModal, setShowThmModal] = useState(false);
  const [selectedThmRoom, setSelectedThmRoom] = useState<THMRoom | null>(null);
  
  // CTF State
  const [ctfWriteups, setCtfWriteups] = useState<CTFWriteup[]>([]);
  const [showCtfModal, setShowCtfModal] = useState(false);
  const [selectedCtfWriteup, setSelectedCtfWriteup] = useState<CTFWriteup | null>(null);
  
  // Stats State
  const [showHtbStatsModal, setShowHtbStatsModal] = useState(false);
  const [showThmStatsModal, setShowThmStatsModal] = useState(false);
  
  // Popup State
  const [popupData, setPopupData] = useState({
    title: '',
    imageUrl: '',
    link: '',
    isActive: false
  });
  const [popupSaving, setPopupSaving] = useState(false);
  
  // Notice Popup State
  const [noticeData, setNoticeData] = useState({
    title: '',
    content: '',
    isActive: false
  });
  const [noticeSaving, setNoticeSaving] = useState(false);
  
  // Background State
  const [activeBackground, setActiveBackground] = useState('matrix');
  const [backgroundSaving, setBackgroundSaving] = useState(false);
  
  // Chat Settings State
  const [chatSettings, setChatSettings] = useState({ sudo_chat_enabled: 1, root_chat_enabled: 1 });
  const [chatSettingsSaving, setChatSettingsSaving] = useState(false);
  
  // Chat State
  const [chatType, setChatType] = useState<'sudo' | 'root'>('sudo');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatPolls, setChatPolls] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [banEmail, setBanEmail] = useState('');
  const [banReason, setBanReason] = useState('');
  
  // Support State
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const totalUnreadTickets = tickets.reduce((sum: number, ticket: any) => {
    console.log('Admin Ticket:', ticket.subject, 'Admin Unread:', ticket.admin_unread);
    return sum + (ticket.admin_unread || 0);
  }, 0);
  console.log('Admin total unread:', totalUnreadTickets);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatData();
      const interval = setInterval(fetchChatData, 3000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'support') {
      fetchTickets();
      const interval = setInterval(fetchTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, chatType]);
  
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

  const fetchData = async () => {
    try {
      // Fetch HTB machines
      const htbResponse = await fetch('/api/admin/htb-machines-d1');
      if (htbResponse.ok) {
        const htbData = await htbResponse.json();
        setHtbMachines(Array.isArray(htbData) ? htbData : htbData.machines || []);
      }

      // Fetch THM rooms
      const thmResponse = await fetch('/api/admin/thm-rooms-d1');
      if (thmResponse.ok) {
        const thmData = await thmResponse.json();
        setThmRooms(Array.isArray(thmData) ? thmData : thmData.rooms || []);
      }

      // Fetch CTF writeups
      const ctfResponse = await fetch('/api/admin/ctf-writeups-d1');
      if (ctfResponse.ok) {
        const ctfData = await ctfResponse.json();
        setCtfWriteups(Array.isArray(ctfData) ? ctfData : ctfData.writeups || []);
      }
      
      // Fetch popup data
      const popupResponse = await fetch('/api/admin/writeup-popup');
      if (popupResponse.ok) {
        const popupData = await popupResponse.json();
        setPopupData(popupData);
      }
      
      // Fetch notice popup data
      const noticeResponse = await fetch('/api/admin/notice-popup');
      if (noticeResponse.ok) {
        const noticeData = await noticeResponse.json();
        setNoticeData(noticeData);
      }
      
      // Fetch background setting
      const bgResponse = await fetch('/api/admin/background');
      if (bgResponse.ok) {
        const bgData = await bgResponse.json();
        setActiveBackground(bgData.background || 'matrix');
      }
      
      // Fetch chat settings
      const chatResponse = await fetch('/api/admin/chat-settings');
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setChatSettings(chatData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };

  const handleHtbSubmit = async (machineData: Omit<Machine, 'id'>) => {
    try {
      const url = '/api/admin/htb-machines-d1';
      const method = selectedHtbMachine ? 'PUT' : 'POST';
      const body = selectedHtbMachine ? { ...machineData, id: selectedHtbMachine.id } : machineData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchData();
        setShowHtbModal(false);
        setSelectedHtbMachine(null);
        setError('✅ HTB machine saved successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to save machine');
      }
    } catch (error) {
      setError('❌ Failed to save HTB machine');
    }
  };

  const handleThmSubmit = async (roomData: Omit<THMRoom, 'id'>) => {
    try {
      const url = '/api/admin/thm-rooms-d1';
      const method = selectedThmRoom ? 'PUT' : 'POST';
      const body = selectedThmRoom ? { ...roomData, id: selectedThmRoom.id } : roomData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchData();
        setShowThmModal(false);
        setSelectedThmRoom(null);
        setError('✅ THM room saved successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to save room');
      }
    } catch (error) {
      setError('❌ Failed to save THM room');
    }
  };

  const handleCtfSubmit = async (writeupData: Omit<CTFWriteup, 'id'>) => {
    try {
      const url = '/api/admin/ctf-writeups-d1';
      const method = selectedCtfWriteup ? 'PUT' : 'POST';
      const body = selectedCtfWriteup ? { ...writeupData, id: selectedCtfWriteup.id } : writeupData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchData();
        setShowCtfModal(false);
        setSelectedCtfWriteup(null);
        setError('✅ CTF writeup saved successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to save writeup');
      }
    } catch (error) {
      setError('❌ Failed to save CTF writeup');
    }
  };

  const handleDelete = async (id: string, type: 'htb' | 'thm' | 'ctf') => {
    if (!confirm(`Are you sure you want to delete this ${type.toUpperCase()} item?`)) return;

    try {
      const url = type === 'htb' ? `/api/admin/htb-machines-d1?id=${id}` : 
                  type === 'thm' ? `/api/admin/thm-rooms-d1?id=${id}` :
                  `/api/admin/ctf-writeups-d1?id=${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchData();
        setError(`✅ ${type.toUpperCase()} item deleted successfully!`);
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      setError(`❌ Failed to delete ${type.toUpperCase()} item`);
    }
  };
  
  const handlePopupSave = async () => {
    try {
      setPopupSaving(true);
      const response = await fetch('/api/admin/writeup-popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(popupData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPopupData(updatedData);
        setError('✅ Popup settings saved successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to save popup');
      }
    } catch (error) {
      setError('❌ Failed to save popup settings');
    } finally {
      setPopupSaving(false);
    }
  };

  const handleNoticeSave = async () => {
    try {
      setNoticeSaving(true);
      const response = await fetch('/api/admin/notice-popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(noticeData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setNoticeData(updatedData);
        setError('✅ Notice popup saved successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to save notice');
      }
    } catch (error) {
      setError('❌ Failed to save notice popup');
    } finally {
      setNoticeSaving(false);
    }
  };
  
  const handleBackgroundChange = async (bg: string) => {
    try {
      setBackgroundSaving(true);
      const response = await fetch('/api/admin/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ background: bg }),
      });

      if (response.ok) {
        setActiveBackground(bg);
        setError('✅ Background changed successfully! Refresh to see changes.');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to change background');
      }
    } catch (error) {
      setError('❌ Failed to change background');
    } finally {
      setBackgroundSaving(false);
    }
  };
  
  const handleChatSettingsChange = async (field: 'sudo_chat_enabled' | 'root_chat_enabled', value: boolean) => {
    try {
      setChatSettingsSaving(true);
      const newSettings = { ...chatSettings, [field]: value ? 1 : 0 };
      const response = await fetch('/api/admin/chat-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setChatSettings(newSettings);
        setError('✅ Chat settings updated successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Failed to update chat settings');
      }
    } catch (error) {
      setError('❌ Failed to update chat settings');
    } finally {
      setChatSettingsSaving(false);
    }
  };
  
  const fetchChatData = async () => {
    try {
      const response = await fetch(`/api/admin-chat?type=${chatType}`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages?.results || data.messages || []);
        setChatPolls(data.polls?.results || data.polls || []);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };
  
  const sendAdminMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'message', chatType, message: newMessage }),
      });
      if (response.ok) {
        setNewMessage('');
        fetchChatData();
      }
    } catch (error) {
      setError('❌ Failed to send message');
    }
  };
  
  const deleteMessage = async (messageId: number) => {
    try {
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'adminDelete', chatType, messageId }),
      });
      if (response.ok) {
        fetchChatData();
      }
    } catch (error) {
      setError('❌ Failed to delete message');
    }
  };
  
  const banUser = async () => {
    if (!banEmail.trim()) return;
    try {
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'ban', chatType, userEmail: banEmail, reason: banReason }),
      });
      if (response.ok) {
        setBanEmail('');
        setBanReason('');
        setError('✅ User banned successfully');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError('❌ Failed to ban user');
    }
  };
  
  const unbanUser = async (email: string) => {
    try {
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'unban', chatType, userEmail: email }),
      });
      if (response.ok) {
        setError('✅ User unbanned successfully');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError('❌ Failed to unban user');
    }
  };
  
  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/support', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const ticketsList = data.tickets?.results || data.tickets || [];
        console.log('Admin fetched tickets:', ticketsList);
        setTickets(ticketsList);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
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
  
  const closeTicket = async () => {
    if (!confirm('Close this ticket?')) return;
    try {
      await fetch('/api/ticket-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId: selectedTicket.id, type: 'close' })
      });
      setSelectedTicket(null);
      fetchTickets();
      setError('✅ Ticket closed successfully');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      setError('❌ Failed to close ticket');
    }
  };

  return (
    <Layout>
      <div className="py-8 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-cyber font-bold text-cyber-green mb-2">ADMIN DASHBOARD</h1>
          <p className="text-cyber-blue">Manage HTB machines and THM rooms</p>
        </motion.div>

        {/* Error/Success Banner */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${error.includes('✅') ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-gray-400 hover:text-white">×</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-6 mb-8">
          <button
            onClick={() => setActiveTab('htb')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'htb'
                ? 'bg-cyber-green text-black border-cyber-green shadow-lg transform scale-105'
                : 'bg-black/30 text-cyber-green border-cyber-green/50 hover:bg-cyber-green/10 hover:border-cyber-green'
            }`}
          >
            <FaServer className="inline mr-3 text-lg" />
            HTB Machines ({htbMachines.length})
          </button>
          <button
            onClick={() => setActiveTab('thm')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'thm'
                ? 'bg-cyber-purple text-white border-cyber-purple shadow-lg transform scale-105'
                : 'bg-black/30 text-cyber-purple border-cyber-purple/50 hover:bg-cyber-purple/10 hover:border-cyber-purple'
            }`}
          >
            <FaGraduationCap className="inline mr-3 text-lg" />
            THM Rooms ({thmRooms.length})
          </button>
          <button
            onClick={() => setActiveTab('ctf')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'ctf'
                ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg transform scale-105'
                : 'bg-black/30 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10 hover:border-yellow-500'
            }`}
          >
            <FaTrophy className="inline mr-3 text-lg" />
            CTF Writeups ({ctfWriteups.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'stats'
                ? 'bg-cyber-blue text-white border-cyber-blue shadow-lg transform scale-105'
                : 'bg-black/30 text-cyber-blue border-cyber-blue/50 hover:bg-cyber-blue/10 hover:border-cyber-blue'
            }`}
          >
            <FaChartBar className="inline mr-3 text-lg" />
            Stats & Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'security'
                ? 'bg-red-500 text-white border-red-500 shadow-lg transform scale-105'
                : 'bg-black/30 text-red-400 border-red-500/50 hover:bg-red-500/10 hover:border-red-500'
            }`}
          >
            <FaShieldAlt className="inline mr-3 text-lg" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('popup')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'popup'
                ? 'bg-orange-500 text-white border-orange-500 shadow-lg transform scale-105'
                : 'bg-black/30 text-orange-400 border-orange-500/50 hover:bg-orange-500/10 hover:border-orange-500'
            }`}
          >
            <FaCog className="inline mr-3 text-lg" />
            Popup
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'chat'
                ? 'bg-pink-500 text-white border-pink-500 shadow-lg transform scale-105'
                : 'bg-black/30 text-pink-400 border-pink-500/50 hover:bg-pink-500/10 hover:border-pink-500'
            }`}
          >
            <FaUser className="inline mr-3 text-lg" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 relative ${
              activeTab === 'support'
                ? 'bg-blue-500 text-white border-blue-500 shadow-lg transform scale-105'
                : 'bg-black/30 text-blue-400 border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500'
            }`}
          >
            <FaCog className="inline mr-3 text-lg" />
            Support
            {totalUnreadTickets > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{totalUnreadTickets}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`px-8 py-4 rounded-xl font-bold transition-all border-2 ${
              activeTab === 'background'
                ? 'bg-purple-500 text-white border-purple-500 shadow-lg transform scale-105'
                : 'bg-black/30 text-purple-400 border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-500'
            }`}
          >
            <FaCog className="inline mr-3 text-lg" />
            Background
          </button>
        </div>

        {/* HTB Tab */}
        {activeTab === 'htb' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyber-green">HTB Machines</h2>
              <div className="flex space-x-4">
                <button
                  onClick={fetchData}
                  className="bg-cyber-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold border-2 border-cyber-blue"
                >
                  <FaSync className="inline mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowHtbModal(true)}
                  className="bg-cyber-green text-black px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-bold border-2 border-cyber-green"
                >
                  <FaPlus className="inline mr-2" />
                  Add Machine
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {htbMachines.map((machine) => (
                <div key={machine.id} className="rounded-2xl backdrop-blur-sm bg-black/40 light:bg-white/60 border border-cyber-green/30 p-6 hover:border-cyber-green transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-cyber-green mb-2">{machine.name}</h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="px-3 py-1 bg-cyber-green/20 text-cyber-green rounded-full text-sm font-semibold">{machine.os}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          machine.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          machine.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          machine.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>{machine.difficulty}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          machine.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-400' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-400'
                        }`}>{machine.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {machine.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-cyber-green/10 text-cyber-green text-sm rounded border border-cyber-green/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      <button
                        onClick={() => window.open(`/machines/htb/${machine.id}`, '_blank')}
                        className="p-3 bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-white rounded-lg transition-all border border-cyber-blue/30"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedHtbMachine(machine);
                          setShowHtbModal(true);
                        }}
                        className="p-3 bg-cyber-green/20 text-cyber-green hover:bg-cyber-green hover:text-black rounded-lg transition-all border border-cyber-green/30"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(machine.id, 'htb')}
                        className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/30"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THM Tab */}
        {activeTab === 'thm' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyber-purple">THM Rooms</h2>
              <div className="flex space-x-4">
                <button
                  onClick={fetchData}
                  className="bg-cyber-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold border-2 border-cyber-blue"
                >
                  <FaSync className="inline mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowThmModal(true)}
                  className="bg-cyber-purple text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-bold border-2 border-cyber-purple"
                >
                  <FaPlus className="inline mr-2" />
                  Add Room
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {thmRooms.map((room) => (
                <div key={room.id} className="rounded-2xl backdrop-blur-sm bg-black/40 light:bg-white/60 border border-cyber-purple/30 p-6 hover:border-cyber-purple transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-cyber-purple mb-2">{room.title}</h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="px-3 py-1 bg-cyber-purple/20 text-cyber-purple rounded-full text-sm font-semibold">THM</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          room.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          room.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{room.difficulty}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          room.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-400' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-400'
                        }`}>{room.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {room.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-cyber-purple/10 text-cyber-purple text-sm rounded border border-cyber-purple/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      <button
                        onClick={() => window.open(`/machines/thm/${room.slug}`, '_blank')}
                        className="p-3 bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-white rounded-lg transition-all border border-cyber-blue/30"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedThmRoom(room);
                          setShowThmModal(true);
                        }}
                        className="p-3 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-white rounded-lg transition-all border border-cyber-purple/30"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id, 'thm')}
                        className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/30"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTF Tab */}
        {activeTab === 'ctf' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">CTF Writeups</h2>
              <div className="flex space-x-4">
                <button
                  onClick={fetchData}
                  className="bg-cyber-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold border-2 border-cyber-blue"
                >
                  <FaSync className="inline mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowCtfModal(true)}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-bold border-2 border-yellow-500"
                >
                  <FaPlus className="inline mr-2" />
                  Add Writeup
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {ctfWriteups.map((writeup) => (
                <div key={writeup.id} className="rounded-2xl backdrop-blur-sm bg-black/40 light:bg-white/60 border border-yellow-500/30 p-6 hover:border-yellow-500 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-yellow-400 mb-2">{writeup.title}</h3>
                      <div className="text-sm text-gray-400 mb-3">{writeup.ctfName}</div>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">{writeup.category}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          writeup.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          writeup.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          writeup.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>{writeup.difficulty}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          writeup.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-400' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-400'
                        }`}>{writeup.status}</span>
                        {writeup.points > 0 && (
                          <span className="px-3 py-1 bg-cyber-purple/20 text-cyber-purple rounded-full text-sm font-semibold flex items-center">
                            <FaTrophy className="mr-1" />
                            {writeup.points}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {writeup.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded border border-yellow-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      <button
                        onClick={() => window.open(`/ctf/${writeup.slug}`, '_blank')}
                        className="p-3 bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-white rounded-lg transition-all border border-cyber-blue/30"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCtfWriteup(writeup);
                          setShowCtfModal(true);
                        }}
                        className="p-3 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-black rounded-lg transition-all border border-yellow-500/30"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(writeup.id, 'ctf')}
                        className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/30"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-cyber-blue mb-4">Stats & Settings Management</h2>
              <p className="text-gray-300 light:text-gray-600">Update HTB and THM statistics, manage system settings</p>
            </div>

            <div className="grid gap-6">
              {/* HTB Stats Update */}
              <div className="rounded-2xl backdrop-blur-sm bg-black/40 light:bg-white/60 border border-cyber-green/30 p-6">
                <h3 className="text-xl font-bold text-cyber-green mb-4">HTB Statistics Update</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowHtbStatsModal(true)}
                    className="bg-cyber-green text-black px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-bold border-2 border-cyber-green"
                  >
                    <FaChartBar className="inline mr-2" />
                    Update HTB Stats
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/htb-stats-d1', '_blank')}
                    className="bg-cyber-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold border-2 border-cyber-blue"
                  >
                    <FaEye className="inline mr-2" />
                    View HTB Stats API
                  </button>
                </div>
              </div>

              {/* THM Stats Update */}
              <div className="rounded-2xl backdrop-blur-sm bg-black/40 light:bg-white/60 border border-cyber-purple/30 p-6">
                <h3 className="text-xl font-bold text-cyber-purple mb-4">THM Statistics Update</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowThmStatsModal(true)}
                    className="bg-cyber-purple text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-bold border-2 border-cyber-purple"
                  >
                    <FaChartBar className="inline mr-2" />
                    Update THM Stats
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/thm-stats-d1', '_blank')}
                    className="bg-cyber-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold border-2 border-cyber-blue"
                  >
                    <FaEye className="inline mr-2" />
                    View THM Stats API
                  </button>
                </div>
              </div>

              {/* System Management */}
              <div className="rounded-2xl backdrop-blur-sm bg-black/40 light:bg-white/60 border border-cyber-blue/30 p-6">
                <h3 className="text-xl font-bold text-cyber-blue mb-4">System Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => window.open('/admin/simple', '_blank')}
                    className="bg-cyber-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-bold border-2 border-cyber-blue"
                  >
                    <FaCog className="inline mr-2" />
                    Simple Admin Panel
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/logs', '_blank')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-bold border-2 border-gray-600"
                  >
                    <FaEye className="inline mr-2" />
                    View System Logs
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/users', '_blank')}
                    className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-bold border-2 border-yellow-600"
                  >
                    <FaUser className="inline mr-2" />
                    Manage Users
                  </button>
                  <button
                    onClick={() => window.open('/api/admin/setup-db', '_blank')}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-bold border-2 border-red-600"
                  >
                    <FaServer className="inline mr-2" />
                    Database Setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <AdminSecurityDashboard />
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-pink-400 mb-4">Chat Settings</h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-green-500/30 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-green-400 mb-1">Sudo Chat</h3>
                      <p className="text-gray-400 text-sm">Enable/disable sudo chat for users</p>
                    </div>
                    <button
                      onClick={() => handleChatSettingsChange('sudo_chat_enabled', !chatSettings.sudo_chat_enabled)}
                      disabled={chatSettingsSaving}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        chatSettings.sudo_chat_enabled ? 'bg-green-500' : 'bg-gray-600'
                      } ${chatSettingsSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        chatSettings.sudo_chat_enabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className={`text-sm font-medium ${
                    chatSettings.sudo_chat_enabled ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {chatSettings.sudo_chat_enabled ? '✓ ENABLED' : '✗ DISABLED (Under Maintenance)'}
                  </div>
                </div>
                
                <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-red-500/30 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-red-400 mb-1">Root Chat</h3>
                      <p className="text-gray-400 text-sm">Enable/disable root chat for users</p>
                    </div>
                    <button
                      onClick={() => handleChatSettingsChange('root_chat_enabled', !chatSettings.root_chat_enabled)}
                      disabled={chatSettingsSaving}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        chatSettings.root_chat_enabled ? 'bg-green-500' : 'bg-gray-600'
                      } ${chatSettingsSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        chatSettings.root_chat_enabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className={`text-sm font-medium ${
                    chatSettings.root_chat_enabled ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {chatSettings.root_chat_enabled ? '✓ ENABLED' : '✗ DISABLED (Under Maintenance)'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-pink-400 mb-4">Community Chat Management</h2>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setChatType('sudo')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                    chatType === 'sudo'
                      ? 'bg-cyber-green text-black border-cyber-green'
                      : 'bg-black/30 text-cyber-green border-cyber-green/50'
                  }`}
                >
                  Sudo Chat
                </button>
                <button
                  onClick={() => setChatType('root')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                    chatType === 'root'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-black/30 text-red-400 border-red-500/50'
                  }`}
                >
                  Root Chat
                </button>
              </div>
            </div>

            {/* Ban User Section */}
            <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-red-500/30 p-6 mb-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">Ban User</h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="email"
                  value={banEmail}
                  onChange={(e) => setBanEmail(e.target.value)}
                  placeholder="User email"
                  className="bg-terminal-bg border border-red-500/50 p-3 rounded text-white"
                />
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="bg-terminal-bg border border-red-500/50 p-3 rounded text-white"
                />
                <button
                  onClick={banUser}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-bold"
                >
                  Ban User
                </button>
              </div>
            </div>

            {/* Admin Message Input */}
            <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-pink-500/30 p-6 mb-6">
              <h3 className="text-xl font-bold text-pink-400 mb-4">Send Admin Message (Markdown Supported)</h3>
              <div className="flex gap-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendAdminMessage();
                    }
                  }}
                  placeholder="Type admin message... (Shift+Enter for new line, supports markdown)"
                  rows={3}
                  className="flex-1 bg-terminal-bg border border-pink-500/50 p-3 rounded text-white resize-none"
                />
                <button
                  onClick={sendAdminMessage}
                  className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 font-bold"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-pink-500/30 p-6">
              <h3 className="text-xl font-bold text-pink-400 mb-4">Messages ({chatMessages.length})</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {chatMessages.map((msg: any) => {
                  const reactions = msg.reactions ? JSON.parse(msg.reactions) : [];
                  const isAdmin = msg.user_email?.includes('@admin') || msg.user_name?.includes('👑');
                  return (
                    <div key={msg.id} className="flex justify-start mb-3">
                      <div 
                        className={`min-w-[200px] max-w-[65%] p-3 rounded-2xl relative group ${
                          isAdmin 
                            ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 rounded-bl-sm'
                            : 'bg-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <span className={`font-medium text-xs block mb-1 ${
                          isAdmin ? 'text-yellow-400' : 'text-cyan-400'
                        }`}>
                          {msg.user_name}
                        </span>
                        {msg.is_deleted === 1 ? (
                          <p className="text-gray-500 text-sm mb-1 italic">Message deleted</p>
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
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {(() => {
                              const msgDate = new Date(msg.created_at + 'Z');
                              const today = new Date();
                              const isToday = msgDate.toDateString() === today.toDateString();
                              return isToday ? msgDate.toLocaleTimeString() : msgDate.toLocaleString();
                            })()}
                          </span>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="text-red-400 hover:text-red-300 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete message"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        {msg.is_deleted === 1 && msg.deleted_by && (
                          <p className="text-xs text-red-400 mt-1">Deleted by: {msg.deleted_by}</p>
                        )}
                        {reactions.filter((r: any) => r.count > 0).length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {reactions.filter((r: any) => r.count > 0).map((r: any, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-700 rounded">
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
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div>
            {!selectedTicket ? (
              <div>
                <h2 className="text-2xl font-bold text-blue-400 mb-6">Support Tickets</h2>
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="rounded-2xl backdrop-blur-sm bg-black/40 border border-blue-500/30 p-6 hover:border-blue-500 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">{ticket.subject}</h3>
                            {ticket.admin_unread > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{ticket.admin_unread}</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{ticket.user_name} ({ticket.user_email})</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === 'open' ? 'bg-green-500/20 text-green-400 border border-green-400' : 'bg-gray-500/20 text-gray-400 border border-gray-400'
                        }`}>{ticket.status}</span>
                      </div>
                      <p className="text-gray-500 text-sm">{new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedTicket(null)} className="text-blue-400 mb-4 hover:text-blue-300">← Back to Tickets</button>
                <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-blue-500/30 p-6 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-xl">{selectedTicket.subject}</h3>
                      <p className="text-gray-400 text-sm mt-1">{selectedTicket.user_name} ({selectedTicket.user_email})</p>
                      <p className="text-white mt-3">{selectedTicket.issue}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedTicket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>{selectedTicket.status}</span>
                      {selectedTicket.status === 'open' && (
                        <button onClick={closeTicket} className="bg-red-500 text-white px-4 py-1 rounded text-xs font-semibold hover:bg-red-600">Close Ticket</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-blue-500/30 p-6">
                  <h4 className="text-white font-bold mb-4">Messages</h4>
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {ticketMessages.map(msg => (
                      <div key={msg.id} className="bg-gray-900/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${
                            msg.sender_email === 'admin' ? 'text-yellow-400' : 'text-cyan-400'
                          }`}>{msg.sender_name}</span>
                          <span className="text-gray-500 text-xs">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-white">{msg.message}</p>
                        {msg.attachment_url && (
                          <a href={`/api/download-attachment?file=${encodeURIComponent(msg.attachment_url)}&name=${encodeURIComponent(msg.attachment_name || 'attachment')}`} className="flex items-center gap-2 mt-2 text-cyan-400 hover:text-cyan-300 text-sm">
                            <FaDownload /> {msg.attachment_name || 'Download Attachment'}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedTicket.status === 'open' && (
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600 disabled:opacity-50">
                        {uploadingFile ? '...' : <FaPlus />}
                      </button>
                      <input type="text" value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendTicketMessage()} placeholder="Type a message..." className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded" />
                      <button onClick={() => sendTicketMessage()} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Send</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Background Tab */}
        {activeTab === 'background' && (
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-6">Background Settings</h2>
            <p className="text-gray-300 mb-6">Choose the active background animation for your site</p>
            
            <div className="grid grid-cols-3 gap-6">
              <div onClick={() => !backgroundSaving && handleBackgroundChange('snow')} className={`cursor-pointer rounded-2xl backdrop-blur-sm bg-black/40 border p-6 transition-all ${
                activeBackground === 'snow' ? 'border-cyan-400 shadow-lg shadow-cyan-500/50' : 'border-gray-500/30 hover:border-cyan-400/50'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">❄️</div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">Snow Background</h3>
                  <p className="text-gray-400 text-sm mb-4">Falling snowflakes animation</p>
                  <p className="text-xs text-gray-500">Recommended: Nov - Jan</p>
                  {activeBackground === 'snow' && (
                    <div className="mt-4 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-semibold">ACTIVE</div>
                  )}
                </div>
              </div>
              
              <div onClick={() => !backgroundSaving && handleBackgroundChange('spring')} className={`cursor-pointer rounded-2xl backdrop-blur-sm bg-black/40 border p-6 transition-all ${
                activeBackground === 'spring' ? 'border-pink-400 shadow-lg shadow-pink-500/50' : 'border-gray-500/30 hover:border-pink-400/50'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">🌸</div>
                  <h3 className="text-xl font-bold text-pink-400 mb-2">Spring Background</h3>
                  <p className="text-gray-400 text-sm mb-4">Cherry blossom petals animation</p>
                  <p className="text-xs text-gray-500">Recommended: Feb - Jun</p>
                  {activeBackground === 'spring' && (
                    <div className="mt-4 px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm font-semibold">ACTIVE</div>
                  )}
                </div>
              </div>
              
              <div onClick={() => !backgroundSaving && handleBackgroundChange('matrix')} className={`cursor-pointer rounded-2xl backdrop-blur-sm bg-black/40 border p-6 transition-all ${
                activeBackground === 'matrix' ? 'border-green-400 shadow-lg shadow-green-500/50' : 'border-gray-500/30 hover:border-green-400/50'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">💻</div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">Matrix Background</h3>
                  <p className="text-gray-400 text-sm mb-4">Classic matrix rain animation</p>
                  <p className="text-xs text-gray-500">Recommended: Jul - Oct</p>
                  {activeBackground === 'matrix' && (
                    <div className="mt-4 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">ACTIVE</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/50">
              <p className="text-yellow-400 text-sm">💡 <strong>Note:</strong> Background changes take effect immediately. Users will see the new background on their next page load.</p>
            </div>
          </div>
        )}

        {/* Popup Tab */}
        {activeTab === 'popup' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-orange-400 mb-4">Writeup Release Popup</h2>
              <p className="text-gray-300">Manage the popup that appears when users visit the site to promote new writeup releases</p>
              
              {/* Current Status */}
              <div className={`mt-4 p-3 rounded-lg border ${
                popupData.isActive 
                  ? 'bg-green-900/20 border-green-500/50 text-green-400'
                  : 'bg-gray-900/20 border-gray-500/50 text-gray-400'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    popupData.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    Status: {popupData.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                {popupData.title && (
                  <p className="text-sm mt-1 opacity-80">Current: {popupData.title}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-orange-500/30 p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-orange-400">Popup Title</label>
                  <input
                    type="text"
                    value={popupData.title}
                    onChange={(e) => setPopupData({ ...popupData, title: e.target.value })}
                    className="w-full bg-terminal-bg border border-orange-500/50 p-3 rounded text-white"
                    placeholder="Latest Writeup: HTB Academy - SQL Injection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-orange-400">Image URL</label>
                  <input
                    type="url"
                    value={popupData.imageUrl}
                    onChange={(e) => setPopupData({ ...popupData, imageUrl: e.target.value })}
                    className="w-full bg-terminal-bg border border-orange-500/50 p-3 rounded text-white"
                    placeholder="https://example.com/writeup-image.jpg"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional: Image to display in the popup (recommended size: 400x200px)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-orange-400">Writeup Link</label>
                  <input
                    type="url"
                    value={popupData.link}
                    onChange={(e) => setPopupData({ ...popupData, link: e.target.value })}
                    className="w-full bg-terminal-bg border border-orange-500/50 p-3 rounded text-white"
                    placeholder="/machines/htb/academy or /ctf/writeup-slug"
                  />
                  <p className="text-xs text-gray-400 mt-1">Link to the writeup page (can be relative or absolute URL)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-orange-400">Popup Status</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={popupData.isActive}
                      onChange={(e) => setPopupData({ ...popupData, isActive: e.target.checked })}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <span className={`text-sm font-medium ${
                      popupData.isActive ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {popupData.isActive ? 'Popup is ACTIVE (will show to users)' : 'Popup is DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Users will see this popup once per day when active</p>
                </div>

                {popupData.imageUrl && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-orange-400">Preview</label>
                    <div className="border border-orange-500/30 rounded-lg p-4 bg-black/20">
                      <img
                        src={popupData.imageUrl}
                        alt="Popup preview"
                        className="w-full max-w-md h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-sm text-gray-300 mt-2">{popupData.title}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={handlePopupSave}
                    disabled={popupSaving || !popupData.title || !popupData.link}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-bold border-2 border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {popupSaving ? (
                      <>
                        <FaSync className="inline mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        Save Popup Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Notice Popup Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Notice Popup</h2>
              <p className="text-gray-300 mb-4">General notice popup with markdown support for announcements</p>
              
              <div className={`mb-4 p-3 rounded-lg border ${
                noticeData.isActive 
                  ? 'bg-green-900/20 border-green-500/50 text-green-400'
                  : 'bg-gray-900/20 border-gray-500/50 text-gray-400'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    noticeData.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    Status: {noticeData.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl backdrop-blur-sm bg-black/40 border border-cyan-500/30 p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyan-400">Notice Title</label>
                    <input
                      type="text"
                      value={noticeData.title}
                      onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                      className="w-full bg-terminal-bg border border-cyan-500/50 p-3 rounded text-white"
                      placeholder="Important Announcement"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyan-400">Notice Content (Markdown Supported)</label>
                    <textarea
                      value={noticeData.content}
                      onChange={(e) => setNoticeData({ ...noticeData, content: e.target.value })}
                      className="w-full bg-terminal-bg border border-cyan-500/50 p-3 rounded text-white h-40"
                      placeholder="## Welcome!\n\nThis is a **markdown** notice.\n\n- Point 1\n- Point 2"
                    />
                    <p className="text-xs text-gray-400 mt-1">Supports markdown formatting</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyan-400">Notice Status</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={noticeData.isActive}
                        onChange={(e) => setNoticeData({ ...noticeData, isActive: e.target.checked })}
                        className="h-4 w-4 accent-cyan-500"
                      />
                      <span className={`text-sm font-medium ${
                        noticeData.isActive ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {noticeData.isActive ? 'Notice is ACTIVE' : 'Notice is DISABLED'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      onClick={handleNoticeSave}
                      disabled={noticeSaving || !noticeData.title || !noticeData.content}
                      className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-bold border-2 border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {noticeSaving ? (
                        <>
                          <FaSync className="inline mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="inline mr-2" />
                          Save Notice
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTB Modal */}
        {showHtbModal && (
          <HTBMachineModal
            machine={selectedHtbMachine}
            onSave={handleHtbSubmit}
            onClose={() => {
              setShowHtbModal(false);
              setSelectedHtbMachine(null);
            }}
          />
        )}

        {/* THM Modal */}
        {showThmModal && (
          <THMRoomModal
            room={selectedThmRoom}
            onSave={handleThmSubmit}
            onClose={() => {
              setShowThmModal(false);
              setSelectedThmRoom(null);
            }}
          />
        )}

        {/* HTB Stats Modal */}
        {showHtbStatsModal && (
          <StatsModal
            type="HTB"
            onClose={() => setShowHtbStatsModal(false)}
          />
        )}

        {/* THM Stats Modal */}
        {showThmStatsModal && (
          <StatsModal
            type="THM"
            onClose={() => setShowThmStatsModal(false)}
          />
        )}

        {/* CTF Modal */}
        {showCtfModal && (
          <CTFWriteupModal
            writeup={selectedCtfWriteup}
            onSave={handleCtfSubmit}
            onClose={() => {
              setShowCtfModal(false);
              setSelectedCtfWriteup(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// CTF Writeup Modal Component
function CTFWriteupModal({
  writeup,
  onSave,
  onClose,
}: {
  writeup: CTFWriteup | null;
  onSave: (data: Omit<CTFWriteup, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: writeup?.title || '',
    slug: writeup?.slug || '',
    ctfName: writeup?.ctfName || '',
    category: writeup?.category || 'Web',
    difficulty: writeup?.difficulty || 'Easy',
    points: writeup?.points || 0,
    status: writeup?.status || 'In Progress',
    isActive: writeup?.isActive ?? false,
    password: writeup?.password || '',
    accessTier: writeup?.accessTier || 'Both',
    dateCompleted: writeup?.dateCompleted || '',
    tags: writeup?.tags || [],
    writeup: writeup?.writeup || '',
    summary: writeup?.summary || '',
    flag: writeup?.flag || '',
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    onSave({ ...formData, slug });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">
            {writeup ? 'Edit CTF Writeup' : 'Add CTF Writeup'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">CTF Name</label>
              <input
                type="text"
                value={formData.ctfName}
                onChange={(e) => setFormData({ ...formData, ctfName: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
              >
                <option value="Web">Web</option>
                <option value="Crypto">Crypto</option>
                <option value="Pwn">Pwn</option>
                <option value="Reverse">Reverse</option>
                <option value="Forensics">Forensics</option>
                <option value="Misc">Misc</option>
                <option value="OSINT">OSINT</option>
                <option value="Steganography">Steganography</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Insane">Insane</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Date Completed</label>
              <input
                type="date"
                value={formData.dateCompleted}
                onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-yellow-400">Summary (SEO)</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white h-20"
              placeholder="Short, non-spoiler overview for search engines (1-2 sentences)"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Access Tier Required</label>
              <select
                value={formData.accessTier}
                onChange={(e) => setFormData({ ...formData, accessTier: e.target.value })}
                className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
              >
                <option value="Sudo Access">Sudo Access</option>
                <option value="Root Access">Root Access</option>
                <option value="Both">Both (Sudo + Root)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Members must have this tier or higher</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-400">Writeup Status</label>
              <div className="flex items-center gap-3 p-3 bg-terminal-bg border border-yellow-500/30 rounded">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-5 w-5 cursor-pointer"
                  style={{ accentColor: '#eab308' }}
                />
                <span className={`text-sm font-bold ${
                  formData.isActive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formData.isActive ? '✓ ACTIVE' : '✗ HIDDEN'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-yellow-400">Flag</label>
            <input
              type="text"
              value={formData.flag}
              onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
              className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white font-mono"
              placeholder="flag{example_flag_here}"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-yellow-400">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white"
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="bg-yellow-500 text-black px-4 py-2 rounded">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(index)} className="text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-yellow-400">Writeup (Markdown)</label>
            <textarea
              value={formData.writeup}
              onChange={(e) => setFormData({ ...formData, writeup: e.target.value })}
              className="w-full bg-terminal-bg border border-yellow-500/50 p-3 rounded text-white h-40 font-mono"
              placeholder="# Challenge Description\n\n## Solution\n\n### Analysis\n\n### Exploitation\n\n**Flag**: `flag{example}`"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-yellow-500 text-black rounded">
              <FaSave className="inline mr-2" />
              {writeup ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Stats Modal Component
function StatsModal({
  type,
  onClose,
}: {
  type: 'HTB' | 'THM';
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchCurrentStats();
  }, []);

  const fetchCurrentStats = async () => {
    try {
      const endpoint = type === 'HTB' ? '/api/admin/htb-stats-d1' : '/api/admin/thm-stats-d1';
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentStats(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching current stats:', error);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const endpoint = type === 'HTB' ? '/api/admin/htb-stats-d1' : '/api/admin/thm-stats-d1';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ ${type} stats updated successfully!`);
        setCurrentStats(data);
      } else {
        setError(`❌ Failed to update ${type} stats: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setError(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${type === 'HTB' ? 'text-cyber-green' : 'text-cyber-purple'}`}>
            Update {type} Statistics
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          {type === 'HTB' && formData && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-green">Machines Pwned</label>
                <input
                  type="number"
                  value={formData.machines_pwned || formData.machinesPwned || 0}
                  onChange={(e) => setFormData({...formData, machines_pwned: parseInt(e.target.value) || 0})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-green">Global Ranking</label>
                <input
                  type="number"
                  value={formData.global_ranking || formData.globalRanking || 0}
                  onChange={(e) => setFormData({...formData, global_ranking: parseInt(e.target.value) || 0})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-green">Final Score</label>
                <input
                  type="number"
                  value={formData.final_score || formData.finalScore || 0}
                  onChange={(e) => setFormData({...formData, final_score: parseInt(e.target.value) || 0})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-green">HTB Rank</label>
                <input
                  type="text"
                  value={formData.htb_rank || formData.htbRank || ''}
                  onChange={(e) => setFormData({...formData, htb_rank: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
                />
              </div>
            </div>
          )}

          {type === 'THM' && formData && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-purple">THM Rank</label>
                <input
                  type="text"
                  value={formData.thm_rank || ''}
                  onChange={(e) => setFormData({...formData, thm_rank: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-purple">Global Ranking</label>
                <input
                  type="number"
                  value={formData.global_ranking || 0}
                  onChange={(e) => setFormData({...formData, global_ranking: parseInt(e.target.value) || 0})}
                  className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-purple">Rooms Completed</label>
                <input
                  type="number"
                  value={formData.rooms_completed || 0}
                  onChange={(e) => setFormData({...formData, rooms_completed: parseInt(e.target.value) || 0})}
                  className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-cyber-purple">Total Points</label>
                <input
                  type="number"
                  value={formData.total_points || 0}
                  onChange={(e) => setFormData({...formData, total_points: parseInt(e.target.value) || 0})}
                  className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={loading}
            className={`w-full ${type === 'HTB' ? 'bg-cyber-green text-black' : 'bg-cyber-purple text-white'} px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50`}
          >
            {loading ? (
              <>
                <FaSync className="inline mr-2 animate-spin" />
                <span className={type === 'HTB' ? 'text-black' : 'text-white'}>Updating {type} Stats...</span>
              </>
            ) : (
              <>
                <FaSave className="inline mr-2" />
                <span className={type === 'HTB' ? 'text-black' : 'text-white'}>Save {type} Statistics</span>
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}

          {result && (
            <div className="bg-green-900/20 border border-green-500/50 text-green-400 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// HTB Machine Modal Component
function HTBMachineModal({
  machine,
  onSave,
  onClose,
}: {
  machine: Machine | null;
  onSave: (data: Omit<Machine, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: machine?.name || '',
    os: machine?.os || 'Linux',
    difficulty: machine?.difficulty || 'Easy',
    status: machine?.status || 'In Progress',
    isActive: (machine as any)?.isActive ?? true,
    accessTier: (machine as any)?.accessTier || (machine as any)?.access_tier || 'Both',
    summary: (machine as any)?.summary || '',
    dateCompleted: machine?.dateCompleted || '',
    tags: machine?.tags || [],
    writeup: machine?.writeup || '',
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      id: machine?.id || formData.name.toLowerCase().replace(/\s+/g, '-'),
      dateCompleted: formData.status === 'Completed' ? formData.dateCompleted : null,
      summary: formData.summary || null,
    };
    onSave(submitData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyber-green">
            {machine ? 'Edit HTB Machine' : 'Add HTB Machine'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">OS</label>
              <select
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
              >
                <option value="Linux">Linux</option>
                <option value="Windows">Windows</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Insane">Insane</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">Access Tier Required</label>
              <select
                value={formData.accessTier}
                onChange={(e) => setFormData({ ...formData, accessTier: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
              >
                <option value="Sudo Access">Sudo Access</option>
                <option value="Root Access">Root Access</option>
                <option value="Both">Both (Sudo + Root)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Members must have this tier or higher</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">Writeup Status</label>
              <div className="flex items-center gap-3 p-3 bg-terminal-bg border border-cyber-green/30 rounded">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-5 w-5 cursor-pointer"
                  style={{ accentColor: '#00ff41' }}
                />
                <span className={`text-sm font-bold ${
                  formData.isActive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formData.isActive ? '✓ ACTIVE' : '✗ HIDDEN'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-green">Summary (SEO)</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white h-20"
              placeholder="Short, non-spoiler overview for search engines (1-2 sentences)"
              maxLength={500}
            />
          </div>

          {formData.status === 'Completed' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-green">Date Completed</label>
              <input
                type="date"
                value={formData.dateCompleted}
                onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-green">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white"
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="bg-cyber-green text-black px-4 py-2 rounded">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="bg-cyber-green/20 text-cyber-green px-2 py-1 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(index)} className="text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-green">Writeup (Markdown)</label>
            <textarea
              value={formData.writeup}
              onChange={(e) => setFormData({ ...formData, writeup: e.target.value })}
              className="w-full bg-terminal-bg border border-cyber-green/50 p-3 rounded text-white h-40 font-mono"
              placeholder="# Enumeration\n\n## Exploitation\n\n## Privilege Escalation..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-cyber-green text-black rounded">
              <FaSave className="inline mr-2" />
              {machine ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// THM Room Modal Component
function THMRoomModal({
  room,
  onSave,
  onClose,
}: {
  room: THMRoom | null;
  onSave: (data: Omit<THMRoom, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: room?.title || '',
    slug: room?.slug || '',
    difficulty: room?.difficulty || 'Easy',
    status: room?.status || 'In Progress',
    roomCode: room?.roomCode || '',
    dateCompleted: room?.dateCompleted || '',
    tags: room?.tags || [],
    writeup: room?.writeup || '',
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    onSave({ ...formData, slug });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyber-purple">
            {room ? 'Edit THM Room' : 'Add THM Room'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-purple">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-purple">Room Code</label>
              <input
                type="text"
                value={formData.roomCode}
                onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-purple">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-cyber-purple">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-purple">Date Completed</label>
            <input
              type="date"
              value={formData.dateCompleted}
              onChange={(e) => setFormData({ ...formData, dateCompleted: e.target.value })}
              className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-purple">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white"
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="bg-cyber-purple text-white px-4 py-2 rounded">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="bg-cyber-purple/20 text-cyber-purple px-2 py-1 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(index)} className="text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-purple">Writeup</label>
            <textarea
              value={formData.writeup}
              onChange={(e) => setFormData({ ...formData, writeup: e.target.value })}
              className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white h-32"
              placeholder="Writeup content (Markdown supported)"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-cyber-purple text-white rounded">
              <FaSave className="inline mr-2" />
              {room ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
