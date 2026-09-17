import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check, Sparkles, ChevronDown } from 'lucide-react';
import { useTheme, THEME_PRESETS, ThemeMode } from '../contexts/ThemeContext';

interface ThemeToggleProps {
 className?: string;
 showLabel?: boolean;
 direction?: 'up' | 'down';
 align?: 'left' | 'right';
}

export default function ThemeToggle({
 className = '',
 showLabel = false,
 direction = 'down',
 align = 'right'
}: ThemeToggleProps) {
 const { theme, themeMode, setThemeMode, isDark } = useTheme();
 const [isOpen, setIsOpen] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 // Fecha o menu ao clicar fora
 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 }
 if (isOpen) {
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }
 }, [isOpen]);

 const handleSelectMode = (mode: ThemeMode) => {
 setThemeMode(mode);
 setIsOpen(false);
 };

 const getActiveIcon = () => {
 if (themeMode === 'system') {
 return <Laptop size={15} className="text-muted-foreground transition-transform duration-200" />;
 }
 if (isDark) {
 return <Moon size={15} className="text-blue-400 transition-transform duration-200 hover:-rotate-12" />;
 }
 return <Sun size={15} className="text-amber-500 transition-transform duration-200 hover:rotate-45" />;
 };

 return (
 <div className="relative inline-block" ref={containerRef}>
 <button
 type="button"
 id="theme-toggle-btn"
 onClick={() => setIsOpen(prev => !prev)}
 className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer text-xs font-semibold select-none ${
 isDark
 ? 'bg-card hover:bg-muted text-card-foreground border border-border shadow-xs'
 : 'bg-card hover:bg-slate-100 text-muted-foreground border border-border shadow-xs'
 } ${className}`}
 title={`Tema atual: ${themeMode === 'system' ? 'Sistema (' + (isDark ? 'Escuro' : 'Claro') + ')' : isDark ? 'Escuro NOC' : 'Claro Corporativo'}`}
 aria-label="Selecionar tema visual do sistema"
 aria-expanded={isOpen}
 >
 <div className="flex items-center justify-center w-4 h-4">
 {getActiveIcon()}
 </div>

 {showLabel && (
 <span className="hidden sm:inline font-medium">
 {themeMode === 'system' ? 'Automático' : isDark ? 'Escuro NOC' : 'Claro'}
 </span>
 )}

 <ChevronDown
 size={13}
 className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
 />
 </button>

 {/* Menu Popover de Seleção de Tema */}
 {isOpen && (
 <div
 id="theme-selector-popover"
 className={`absolute ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'left' ? 'left-0' : 'right-0'} w-72 rounded-2xl bg-card border border-border shadow-2xl p-2.5 z-50 animate-in fade-in-50 zoom-in-95 text-left`}
 >
 <div className="px-2.5 py-2 border-b border-border mb-1 flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
 Tema da Plataforma
 </span>
 <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
 <Sparkles size={11} /> Ergonomia ISP
 </span>
 </div>

 <div className="space-y-1">
 {THEME_PRESETS.map(preset => {
 const isSelected = themeMode === preset.id;
 return (
 <button
 key={preset.id}
 type="button"
 id={`theme-option-${preset.id}`}
 onClick={() => handleSelectMode(preset.id)}
 className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex flex-col gap-0.5 cursor-pointer ${
 isSelected
 ? 'bg-muted border border-white/15 text-foreground shadow-xs'
 : 'hover:bg-accent border border-transparent text-muted-foreground'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 font-semibold">
 {preset.id === 'dark' && <Moon size={14} className="text-blue-400" />}
 {preset.id === 'light' && <Sun size={14} className="text-amber-400" />}
 {preset.id === 'system' && <Laptop size={14} className="text-muted-foreground" />}
 <span className={isSelected ? 'text-foreground' : 'text-card-foreground'}>
 {preset.name}
 </span>
 </div>

 <div className="flex items-center gap-1.5">
 {preset.tag && (
 <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
 {preset.tag}
 </span>
 )}
 {isSelected && <Check size={14} className="text-emerald-400 font-bold" />}
 </div>
 </div>

 <p className="text-[10px] text-muted-foreground leading-snug pl-5">
 {preset.description}
 </p>
 </button>
 );
 })}
 </div>

 <div className="mt-2 pt-2 border-t border-border px-2.5 py-1 bg-white/5 rounded-xl flex items-center justify-between text-[11px] text-muted-foreground">
 <span>Modo Efetivo:</span>
 <span className="font-semibold text-card-foreground flex items-center gap-1">
 <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-amber-400'}`} />
 {isDark ? 'Escuro (NOC Ativo)' : 'Claro (Daylight Ativo)'}
 </span>
 </div>
 </div>
 )}
 </div>
 );
}

