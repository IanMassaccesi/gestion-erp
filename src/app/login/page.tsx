'use client'
import { login } from "@/actions/auth-actions";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Zap } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px]"></div>

      <div className="bg-brand-card/50 backdrop-blur-xl p-8 md:p-12 rounded-2xl border border-brand-border shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-brand-dark border border-brand-primary/30 rounded-full shadow-neon mb-4 text-brand-primary">
            <Zap size={32} />
          </div>
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Todo<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Kiosco</span></h1>
          <p className="text-brand-muted mt-2">Acceso al Sistema</p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-text ml-1">Email</label>
            <div className="relative group">
              <span className="absolute left-3 top-3.5 text-brand-muted group-focus-within:text-brand-primary transition-colors"><Mail size={20} /></span>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-brand-input border border-brand-border rounded-xl text-white placeholder-gray-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                placeholder="usuario@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-text ml-1">Contraseña</label>
            <div className="relative group">
              <span className="absolute left-3 top-3.5 text-brand-muted group-focus-within:text-brand-primary transition-colors"><Lock size={20} /></span>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-brand-input border border-brand-border rounded-xl text-white placeholder-gray-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-primary to-blue-600 hover:to-blue-500 text-brand-dark font-bold py-3.5 rounded-xl shadow-neon transition-all flex justify-center items-center gap-2 group active:scale-95"
          >
            {loading ? "Iniciando..." : <>Ingresar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}