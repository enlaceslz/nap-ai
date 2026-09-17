import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

function CustomerRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/customer360/${id || ""}`} replace />;
}
import { AuthProvider } from "./contexts/AuthContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/Login";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";

import Inbox from "./pages/Inbox";
import Kanban from "./pages/Kanban";
import SuperAdmin from "./pages/SuperAdmin";
import Helpers from "./pages/Helpers";
import CRM from "./pages/CRM";
import Customer360 from "./pages/customers/Customer360";
import Analytics from "./pages/Analytics";
import Operadores from "./pages/Operadores";
import Campanhas from "./pages/Campanhas";
import Automacoes from "./pages/Automacoes";
import GenieACSDashboard from "./pages/GenieACSDashboard";
import PortalLayout from "./components/PortalLayout";
import PortalDashboard from "./pages/PortalDashboard";
import PortalFaturas from "./pages/PortalFaturas";
import PortalSuporte from "./pages/PortalSuporte";
import PortalConta from "./pages/PortalConta";
import PortalLogin from "./pages/PortalLogin";
import ConsultaSGP from "./pages/ConsultaSGP";
import MapaRede from "./pages/MapaRede";
import GisDashboard from "./pages/GisDashboard";
import Telefonia from "./pages/Telefonia";
import NocMonitoramento from "./pages/NocMonitoramento";
import EstoqueFrota from "./pages/EstoqueFrota";
import UsuariosHierarquia from "./pages/UsuariosHierarquia";
import TecnicoCampo from "./pages/TecnicoCampo";
import Auditoria from "./pages/Auditoria";
import SetupWizard from "./pages/SetupWizard";
import OltManagement from "./pages/OltManagement";
import ErpIntegracoes from "./pages/ErpIntegracoes";
import HelpDeskDashboard from "./pages/admin/helpdesk/HelpDeskDashboard";
import IpamDashboard from "./pages/admin/ipam/IpamDashboard";
import HistoricoConversas from "./pages/admin/relatorios/HistoricoConversas";
import NapSaasLanding from "./pages/NapSaasLanding";

export default function App() {
 return (
 <ThemeProvider>
 <AuthProvider>
 <ConfigProvider>
 <BrowserRouter>
 <Routes>
 <Route path="/" element={<ErrorBoundary fallbackTitle="Falha na Vitrine da Landing Page"><LandingPage /></ErrorBoundary>} />
 <Route path="/landingpage" element={<ErrorBoundary fallbackTitle="Falha na Vitrine da Landing Page"><LandingPage /></ErrorBoundary>} />
 <Route path="/nap" element={<ErrorBoundary fallbackTitle="Erro na Landing Page SaaS"><NapSaasLanding /></ErrorBoundary>} />
 <Route path="/landing" element={<ErrorBoundary fallbackTitle="Falha na Vitrine da Landing Page"><LandingPage /></ErrorBoundary>} />
 <Route path="/setup" element={<SetupWizard />} />
 <Route path="/login" element={<Login />} />

 {/* Operador / Admin Routes */}
 <Route element={<ProtectedRoute />}>
 <Route path="/admin" element={<Layout />}>
 <Route
 element={
 <ProtectedRoute
 allowedRoles={[
 "operador",
 "tecnico_noc",
 "tecnico_campo",
 ]}
 />
 }
 >
 <Route index element={<Inbox />} />
 </Route>

 <Route
 path="dashboard"
 element={<ProtectedRoute allowedRoles={["tecnico_noc"]} />}
 >
 <Route index element={<Analytics />} />
 </Route>

 <Route
 path="suporte"
 element={
 <ProtectedRoute
 allowedRoles={[
 "operador",
 "tecnico_noc",
 "tecnico_campo",
 ]}
 />
 }
 >
 <Route index element={<Kanban type="Suporte" />} />
 </Route>

 <Route
 path="cobranca"
 element={<ProtectedRoute allowedRoles={["operador"]} />}
 >
 <Route index element={<Kanban type="Cobranca" />} />
 </Route>

 <Route
 path="vendas"
 element={<ProtectedRoute allowedRoles={["operador"]} />}
 >
 <Route index element={<Kanban type="Vendas" />} />
 </Route>

 <Route
 path="crm"
 element={
 <ProtectedRoute
 allowedRoles={["operador", "tecnico_noc"]}
 />
 }
 >
 <Route index element={<CRM />} />
 </Route>

 <Route
 path="customer360"
 element={
 <ProtectedRoute
 allowedRoles={[
 "operador",
 "tecnico_noc",
 "tecnico_campo",
 ]}
 />
 }
 >
 <Route index element={<Customer360 />} />
 <Route path=":id" element={<Customer360 />} />
 </Route>

 <Route
 path="sgp"
 element={
 <ProtectedRoute
 allowedRoles={[
 "operador",
 "tecnico_noc",
 "tecnico_campo",
 ]}
 />
 }
 >
 <Route index element={<ConsultaSGP />} />
 </Route>

 <Route
 path="genieacs"
 element={<ProtectedRoute allowedRoles={["tecnico_noc"]} />}
 >
 <Route index element={<GenieACSDashboard />} />
 </Route>

 <Route
 path="infra"
 element={<ProtectedRoute allowedRoles={["tecnico_noc"]} />}
 >
 <Route index element={<NocMonitoramento />} />
 </Route>

 <Route
 path="olts"
 element={<ProtectedRoute allowedRoles={["tecnico_noc", "tecnico_campo", "operador"]} />}
 >
 <Route index element={<OltManagement />} />
 </Route>

 <Route
 path="erp-integracoes"
 element={<ProtectedRoute allowedRoles={[]} />}
 >
 <Route index element={<ErpIntegracoes />} />
 </Route>

 <Route
 path="telefonia"
 element={<ProtectedRoute allowedRoles={["tecnico_noc", "operador"]} />}
 >
 <Route index element={<Telefonia />} />
 </Route>
 <Route
 path="estoque"
 element={<ProtectedRoute allowedRoles={["tecnico_noc", "tecnico_campo", "operador"]} />}
 >
 <Route index element={<EstoqueFrota />} />
 </Route>
 <Route
 path="mapa-rede"
 element={<ProtectedRoute allowedRoles={["tecnico_noc", "tecnico_campo"]} />}
 >
 <Route index element={<MapaRede />} />
 </Route>
 <Route path="gis" element={<ProtectedRoute allowedRoles={["tecnico_noc", "tecnico_campo"]} />}>
 <Route index element={<GisDashboard />} />
 </Route>

 <Route
 path="campanhas"
 element={<ProtectedRoute allowedRoles={["operador"]} />}
 >
 <Route index element={<Campanhas />} />
 </Route>

 <Route
 path="operadores"
 element={<ProtectedRoute allowedRoles={[]} />}
 >
 <Route index element={<Operadores />} />
 </Route>

 <Route
 path="usuarios"
 element={<ProtectedRoute allowedRoles={[]} />}
 >
 <Route index element={<UsuariosHierarquia />} />
 </Route>

 <Route
 path="campo"
 element={<ProtectedRoute allowedRoles={["tecnico_campo"]} />}
 >
 <Route index element={<TecnicoCampo />} />
 </Route>

 <Route
 path="automacoes"
 element={<ProtectedRoute allowedRoles={[]} />}
 >
 <Route index element={<Automacoes />} />
 </Route>

 <Route
 path="auditoria"
 element={<ProtectedRoute allowedRoles={[]} />}
 >
 <Route index element={<Auditoria />} />
 </Route>
 <Route path="historico" element={<HistoricoConversas />} />

 <Route
 path="configuracoes"
 element={<ProtectedRoute allowedRoles={[]} />}
 >
 <Route index element={<SuperAdmin />} />
 </Route>

 <Route path="landingpage" element={<Navigate to="/admin/configuracoes?tab=landingpage" replace />} />
 <Route path="landing" element={<Navigate to="/admin/configuracoes?tab=landingpage" replace />} />

 <Route path="helpdesk" element={<HelpDeskDashboard />} />
 <Route path="ipam" element={<IpamDashboard />} />

 <Route path="ajuda" element={<Helpers />} />
 </Route>
 </Route>

 {/* Cliente PWA Routes */}
 <Route path="/portal/login" element={<PortalLogin />} />
 <Route path="/portal" element={<PortalLayout />}>
 <Route index element={<PortalDashboard />} />
 <Route path="faturas" element={<PortalFaturas />} />
 <Route path="suporte" element={<PortalSuporte />} />
 <Route path="conta" element={<PortalConta />} />
 </Route>

 <Route path="/customer/:id" element={<CustomerRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </BrowserRouter>
 </ConfigProvider>
 </AuthProvider>
 </ThemeProvider>
 );
}
