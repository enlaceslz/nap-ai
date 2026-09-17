import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, Check, RefreshCw, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';

interface LogoUploaderProps {
 currentLogoUrl: string;
 onLogoChange: (newLogoUrl: string) => void;
 onFileUpload?: (file: File) => Promise<{ success: boolean; logoUrl?: string; error?: string }>;
 providerName?: string;
}

const PRESET_LOGOS = [
 {
 nome: "DJD Telecom (Ícone Azul)",
 url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=150&auto=format&fit=crop&q=80"
 },
 {
 nome: "Fibra Ultra (Tecnologia)",
 url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80"
 },
 {
 nome: "Conecta Net (Rede & Dados)",
 url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=80"
 }
];

export default function LogoUploader({ currentLogoUrl, onLogoChange, onFileUpload, providerName = "Provedor" }: LogoUploaderProps) {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [isDragging, setIsDragging] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
 const [customUrlInput, setCustomUrlInput] = useState(currentLogoUrl || '');

 const formatFileSize = (bytes: number) => {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
 };

 const processFile = async (file: File) => {
 setErrorMessage(null);
 if (!file.type.startsWith('image/')) {
 setErrorMessage('Por favor, selecione um arquivo de imagem válido (.png, .svg, .jpg, .webp).');
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 setErrorMessage('O arquivo é muito grande. O limite máximo é de 5MB.');
 return;
 }

 setUploading(true);
 setFileInfo({
 name: file.name,
 size: formatFileSize(file.size)
 });

 try {
 if (onFileUpload) {
 const result = await onFileUpload(file);
 if (result.success && result.logoUrl) {
 onLogoChange(result.logoUrl);
 setCustomUrlInput(result.logoUrl);
 } else {
 setErrorMessage(result.error || 'Falha ao processar arquivo de logotipo.');
 }
 } else {
 // Fallback local FileReader
 const reader = new FileReader();
 reader.onload = () => {
 const dataUrl = reader.result as string;
 onLogoChange(dataUrl);
 setCustomUrlInput(dataUrl);
 };
 reader.readAsDataURL(file);
 }
 } catch (err: any) {
 setErrorMessage(err.message || 'Erro ao carregar arquivo de logo.');
 } finally {
 setUploading(false);
 }
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = () => {
 setIsDragging(false);
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 processFile(e.dataTransfer.files[0]);
 }
 };

 const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files.length > 0) {
 processFile(e.target.files[0]);
 }
 };

 const handleUrlBlur = () => {
 if (customUrlInput && customUrlInput !== currentLogoUrl) {
 onLogoChange(customUrlInput);
 }
 };

 const handleRemoveLogo = () => {
 onLogoChange('');
 setCustomUrlInput('');
 setFileInfo(null);
 setErrorMessage(null);
 if (fileInputRef.current) fileInputRef.current.value = '';
 };

 return (
 <div className="space-y-4">
 {/* Upload Drag & Drop Box */}
 <div 
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
 isDragging 
 ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
 : 'border-border hover:border-blue-500/50 bg-background/60 hover:bg-background'
 }`}
 >
 <input 
 ref={fileInputRef}
 type="file" 
 accept="image/png, image/jpeg, image/svg+xml, image/webp" 
 onChange={handleFileInputChange}
 className="hidden" 
 />

 <div className="flex flex-col items-center justify-center gap-3">
 <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
 {uploading ? (
 <RefreshCw size={24} className="animate-spin text-blue-400" />
 ) : (
 <Upload size={24} />
 )}
 </div>

 <div>
 <h4 className="text-sm font-bold text-foreground mb-1">
 Buscar Arquivo de Logotipo
 </h4>
 <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
 Arraste e solte o arquivo aqui ou <span className="text-blue-400 font-semibold underline">clique para procurar</span> no seu computador.
 </p>
 <p className="text-[11px] text-muted-foreground mt-1.5">
 Formatos aceitos: <strong>PNG (recomendado c/ fundo transparente)</strong>, SVG, JPG ou WebP (até 5MB)
 </p>
 </div>
 </div>
 </div>

 {errorMessage && (
 <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
 <AlertCircle size={16} className="shrink-0" />
 <span>{errorMessage}</span>
 </div>
 )}

 {/* Pré-visualização Dupla e Controles */}
 {currentLogoUrl && (
 <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
 <Sparkles size={14} className="text-amber-400" /> Pré-visualização do Logotipo Aplicado
 </span>
 <button
 type="button"
 onClick={handleRemoveLogo}
 className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
 >
 <Trash2 size={13} /> Remover Logo
 </button>
 </div>

 {fileInfo && (
 <div className="text-[11px] text-muted-foreground flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-lg">
 <span className="font-semibold text-foreground truncate max-w-[200px]">{fileInfo.name}</span>
 <span>•</span>
 <span>{fileInfo.size}</span>
 <span className="text-emerald-400 ml-auto flex items-center gap-1">
 <Check size={12} /> Carregado
 </span>
 </div>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {/* Visualização no Fundo Escuro */}
 <div className="p-3 rounded-xl bg-background border border-border flex flex-col items-center justify-center gap-2 min-h-[90px]">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No Tema Escuro (Landing & Admin)</span>
 <div className="max-h-12 flex items-center justify-center p-1">
 <img 
 src={currentLogoUrl} 
 alt="Logo Dark Preview" 
 className="max-h-10 max-w-[180px] object-contain"
 onError={() => setErrorMessage('Erro ao carregar a imagem. Verifique o arquivo ou URL.')}
 />
 </div>
 </div>

 {/* Visualização no Fundo Claro */}
 <div className="p-3 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-2 min-h-[90px]">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No Tema Claro (Portal PWA)</span>
 <div className="max-h-12 flex items-center justify-center p-1">
 <img 
 src={currentLogoUrl} 
 alt="Logo Light Preview" 
 className="max-h-10 max-w-[180px] object-contain"
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* URL Externa & Presets Alternativos */}
 <div className="pt-2 border-t border-border space-y-2">
 <label className="block text-xs font-bold text-muted-foreground">Ou informe uma URL web de logotipo:</label>
 <div className="flex gap-2">
 <input 
 type="url" 
 value={customUrlInput}
 onChange={(e) => setCustomUrlInput(e.target.value)}
 onBlur={handleUrlBlur}
 placeholder="https://meuprovedor.com.br/logo.png"
 className="flex-1 p-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
 />
 <button
 type="button"
 onClick={() => onLogoChange(customUrlInput)}
 className="px-3 py-2 bg-white/5 hover:bg-accent text-foreground rounded-xl text-xs font-bold border border-border transition-colors"
 >
 Aplicar URL
 </button>
 </div>

 {/* Presets Rápidos */}
 <div className="flex items-center gap-2 pt-1">
 <span className="text-[11px] text-muted-foreground">Exemplos rápidos:</span>
 <div className="flex flex-wrap gap-1.5">
 {PRESET_LOGOS.map((preset, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => {
 onLogoChange(preset.url);
 setCustomUrlInput(preset.url);
 }}
 className="text-[10px] bg-background hover:bg-blue-600/20 hover:text-blue-300 text-muted-foreground border border-border px-2 py-0.5 rounded-md transition-colors"
 >
 {preset.nome}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
