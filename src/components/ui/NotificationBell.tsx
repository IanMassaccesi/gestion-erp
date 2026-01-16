'use client'
import { useState, useEffect, useRef } from "react";
import { Bell, Check } from "lucide-react";
import { getUnreadNotifications, markAsRead } from "@/actions/notifications-actions";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: any) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  async function fetchNotes() {
    const data = await getUnreadNotifications();
    setNotifications(data);
  }

  async function handleRead(id: string) {
    await markAsRead(id);
    fetchNotes();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border border-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-800 font-bold text-white text-sm">
                Notificaciones
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">Sin novedades</div>
                ) : (
                    notifications.map(note => (
                        <div key={note.id} className="p-3 border-b border-slate-800/50 hover:bg-slate-800 transition-colors flex justify-between items-start gap-2">
                            <div>
                                <p className="text-white text-sm font-bold">{note.title}</p>
                                <p className="text-slate-400 text-xs">{note.description}</p>
                                <span className="text-[10px] text-slate-600 mt-1 block">{new Date(note.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <button onClick={() => handleRead(note.id)} className="text-cyan-600 hover:text-cyan-400" title="Marcar leída">
                                <Check size={16}/>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
}