import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ActiveTheme = 'dark' | 'light';

export interface ThemePresetInfo {
 id: ThemeMode;
 name: string;
 tag?: string;
 description: string;
}

export const THEME_PRESETS: ThemePresetInfo[] = [
 {
 id: 'dark',
 name: 'Escuro NOC (Obsidian)',
 tag: 'Mais Adequado',
 description: 'Projetado para plantões de monitoramento 24/7, garantindo baixa fadiga visual e destaque a alarmes de fibra e telefonia.'
 },
 {
 id: 'light',
 name: 'Claro Corporativo (Daylight)',
 description: 'Ideal para escritórios e ambientes com alta luminosidade natural.'
 },
 {
 id: 'system',
 name: 'Automático (Sistema)',
 description: 'Sincroniza automaticamente com o modo claro ou escuro configurado no seu dispositivo.'
 }
];

interface ThemeContextType {
 theme: ActiveTheme;
 themeMode: ThemeMode;
 isDark: boolean;
 toggleTheme: () => void;
 setTheme: (theme: ActiveTheme) => void;
 setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ActiveTheme {
 if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
 return 'dark';
 }
 return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 // Modo configurado pelo usuário: 'dark' (mais adequado), 'light' ou 'system'
 const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
 try {
 const saved = localStorage.getItem('nap_theme');
 if (saved === 'light' || saved === 'dark' || saved === 'system') {
 return saved as ThemeMode;
 }
 // Padrão do sistema DJD Admin: Escuro NOC (Obsidian) - O Mais Adequado
 return 'dark';
 } catch {
 return 'dark';
 }
 });

 // Tema ativo efetivo aplicado no DOM ('dark' | 'light')
 const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => {
 if (themeMode === 'system') {
 return getSystemTheme();
 }
 return themeMode;
 });

 const applyThemeToDOM = (t: ActiveTheme) => {
 const root = document.documentElement;
 if (t === 'dark') {
 root.classList.add('dark');
 root.classList.remove('light');
 root.style.colorScheme = 'dark';
 } else {
 root.classList.add('light');
 root.classList.remove('dark');
 root.style.colorScheme = 'light';
 }
 };

 // Atualiza o tema ativo quando o modo é alterado
 useEffect(() => {
 let resolved: ActiveTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
 setActiveTheme(resolved);
 applyThemeToDOM(resolved);

 try {
 localStorage.setItem('nap_theme', themeMode);
 } catch (e) {
 console.warn('Falha ao salvar tema no localStorage:', e);
 }

 // Se estiver no modo sistema, escutar alterações de preferência do SO
 if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
 const mql = window.matchMedia('(prefers-color-scheme: dark)');
 const handleChange = (e: MediaQueryListEvent) => {
 const next = e.matches ? 'dark' : 'light';
 setActiveTheme(next);
 applyThemeToDOM(next);
 };

 mql.addEventListener('change', handleChange);
 return () => {
 mql.removeEventListener('change', handleChange);
 };
 }
 }, [themeMode]);

 // Alternância rápida (Dark <-> Light)
 const toggleTheme = () => {
 setThemeModeState(prev => {
 const currentEffective = prev === 'system' ? getSystemTheme() : prev;
 return currentEffective === 'dark' ? 'light' : 'dark';
 });
 };

 const setTheme = (newTheme: ActiveTheme) => {
 setThemeModeState(newTheme);
 };

 const setThemeMode = (mode: ThemeMode) => {
 setThemeModeState(mode);
 };

 return (
 <ThemeContext.Provider
 value={{
 theme: activeTheme,
 themeMode,
 isDark: activeTheme === 'dark',
 toggleTheme,
 setTheme,
 setThemeMode
 }}
 >
 {children}
 </ThemeContext.Provider>
 );
}

export function useTheme() {
 const context = useContext(ThemeContext);
 if (!context) {
 throw new Error('useTheme must be used within a ThemeProvider');
 }
 return context;
}

