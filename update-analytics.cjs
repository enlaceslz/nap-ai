const fs = require('fs');
let code = fs.readFileSync('src/pages/Analytics.tsx', 'utf8');

const startTag = '{/* Top KPIs */}';
const endTag = '{/* Live Operators & Embedded Asterisk Webphone */}';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `{/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="MRR Mensal" 
            value="R$ 135.4K" 
            trend="+8.2%" 
            trendUp={true}
            icon={<DollarSign className="text-emerald-400" size={24} />} 
          />
          <MetricCard 
            title="Inadimplência (5+ dias)" 
            value="4.2%" 
            trend="-1.5%" 
            trendUp={true}
            icon={<AlertCircle className="text-red-400" size={24} />} 
          />
          <MetricCard 
            title="Receita Recuperada (PIX IA)" 
            value="R$ 8.9K" 
            trend="+24%" 
            trendUp={true}
            icon={<CheckCircle2 className="text-blue-400" size={24} />} 
          />
          <MetricCard 
            title="Taxa de Retenção IA" 
            value="78.5%" 
            trend="+5.4%" 
            trendUp={true}
            icon={<Bot className="text-indigo-400" size={24} />} 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Financial Chart */}
          <div className="lg:col-span-2 bg-[#101726] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white font-outfit mb-6 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400" />
              MRR & Recuperação Automática (PIX)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataReceita} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => \`R\$\${val/1000}k\`} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => \`R\$\${val/1000}k\`} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="mrr" name="MRR (Faturamento)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                  <Bar yAxisId="right" dataKey="recuperado" name="Recuperado (Cobranca IA)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart */}
          <div className="bg-[#101726] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white font-outfit mb-6">Tempo Médio de Resposta (s)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTMR} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1e293b', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                  />
                  <Bar dataKey="tmr" name="TMR" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Volume de Atendimentos Area */}
        <div className="bg-[#101726] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">Volume de Resolução: Humano vs IA</h3>
              <p className="text-xs text-slate-500 mt-1">Comparativo de tickets encerrados sem intervenção humana na última semana.</p>
            </div>
            <button className="text-xs bg-[#0b0f19] border border-white/5 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              Exportar CSV
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataResolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHumano" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ia" name="NAP IA Integrada" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIa)" />
                <Area type="monotone" dataKey="humano" name="Operador Humano" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumano)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        `;

  code = code.substring(0, startIndex) + newSection + code.substring(endIndex);
  fs.writeFileSync('src/pages/Analytics.tsx', code);
  console.log("Success");
} else {
  console.log("Tags not found");
}
