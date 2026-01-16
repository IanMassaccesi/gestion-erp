'use client'

import { useState, useEffect } from "react";
import { getPreferences, updatePreferences } from "@/actions/notifications-actions";
import { Settings, Bell, Archive, Server, Save } from "lucide-react";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    notifyOrders: true,
    notifyStock: true,
    notifySystem: false
  });

  useEffect(() => {
    async function load() {
        const data = await getPreferences();
        if (data) setPrefs({
            notifyOrders: data.notifyOrders,
            notifyStock: data.notifyStock,
            notifySystem: data.notifySystem
        });
        setLoading(false);
    }
    load();
  }, []);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    await updatePreferences(prefs);
    setLoading(false);
    alert("Preferencias guardadas");
  };

  if (loading && !prefs) return <div className="p-10 text-white">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-200">
      
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-900/50">
            <Settings className="text-cyan-400" size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold font-heading text-white">Configuración</h1>
            <p className="text-slate-400">Personaliza tu experiencia</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Bell size={20} className="text-cyan-500"/> Notificaciones
            </h2>
            <p className="text-xs text-slate-500 mt-1">Elige qué alertas quieres recibir en la campana.</p>
        </div>

        <div className="divide-y divide-slate-800">
            <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                    <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400"><Archive size={24}/></div>
                    <div>
                        <p className="font-bold text-white">Nuevos Pedidos</p>
                        <p className="text-sm text-slate-500">Recibir alerta cuando se crea un pedido.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('notifyOrders')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${prefs.notifyOrders ? 'bg-cyan-600' : 'bg-slate-700'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${prefs.notifyOrders ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                    <div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-400"><Archive size={24}/></div>
                    <div>
                        <p className="font-bold text-white">Stock Bajo</p>
                        <p className="text-sm text-slate-500">Alertar cuando un producto llega al mínimo.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('notifyStock')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${prefs.notifyStock ? 'bg-cyan-600' : 'bg-slate-700'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${prefs.notifyStock ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                    <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400"><Server size={24}/></div>
                    <div>
                        <p className="font-bold text-white">Sistema</p>
                        <p className="text-sm text-slate-500">Errores, backups y mensajes de mantenimiento.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('notifySystem')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${prefs.notifySystem ? 'bg-cyan-600' : 'bg-slate-700'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${prefs.notifySystem ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>

        <div className="p-6 bg-slate-950/50 flex justify-end">
            <button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                <Save size={18}/> Guardar Cambios
            </button>
        </div>
      </div>
    </div>
  );
}