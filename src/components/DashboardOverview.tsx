import React from 'react';
import { 
  DocumentItem, 
  TaskWorkflow, 
  Entity, 
  User, 
  SecurityIncident, 
  OrganizationConfig 
} from '../types';
import { 
  FolderGit2, 
  CheckSquare2, 
  ShieldAlert, 
  Network, 
  FileCheck2, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { TabType } from './Sidebar';

interface DashboardOverviewProps {
  organization: OrganizationConfig;
  documents: DocumentItem[];
  tasks: TaskWorkflow[];
  entities: Entity[];
  allUsers: User[];
  currentUser: User;
  securityIncidents: SecurityIncident[];
  onNavigate: (tab: TabType) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  organization,
  documents,
  tasks,
  entities,
  allUsers,
  currentUser,
  securityIncidents,
  onNavigate,
}) => {
  const signedDocumentsCount = documents.filter(d => d.signatures.length > 0).length;
  const pendingApprovalsCount = tasks.filter(t => t.taskType === 'APPROBATION' && t.status !== 'Termine').length;
  const activeAlertsCount = securityIncidents.filter(i => i.isAccountLocked || i.status === 'ALERTE_ENVOYEE').length;

  const finDocsCount = documents.filter(d => d.category === 'FINANCES_COMPTABILITE').length;
  const logDocsCount = documents.filter(d => d.category === 'LOGISTIQUE_COMMERCIALE').length;
  const rhDocsCount = documents.filter(d => d.category === 'RESSOURCES_HUMAINES').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-300 text-xs font-semibold mb-1">
              <span>{organization.name}</span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/30 text-white font-mono">{organization.type}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Bienvenue, {currentUser.name}
            </h1>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Habilitation active : <strong className="text-white">{currentUser.title}</strong> ({currentUser.role}). 
              {['DG', 'PDG', 'DGA'].includes(currentUser.role) 
                ? ' Supervision intégrale des workflows, documents GED, e-signatures et gouvernance multi-entités.' 
                : ' Accès restreint à votre périmètre hiérarchique et entités rattachées.'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onNavigate('documents')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition flex items-center space-x-1.5"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Consulter la GED</span>
            </button>
            <button
              onClick={() => onNavigate('workflows')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center space-x-1.5"
            >
              <CheckSquare2 className="w-4 h-4" />
              <span>Gérer les Tâches</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GED Publications */}
        <div 
          onClick={() => onNavigate('documents')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GED & Documents</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{documents.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center">
              <span className="text-emerald-600 font-bold mr-1">{signedDocumentsCount} visés</span> par e-signature
            </div>
          </div>
        </div>

        {/* Workflows Actifs */}
        <div 
          onClick={() => onNavigate('workflows')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflows & Tâches</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CheckSquare2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{tasks.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center">
              <span className="text-amber-600 font-bold mr-1">{pendingApprovalsCount} approbations</span> en attente
            </div>
          </div>
        </div>

        {/* Entités Structurelles */}
        <div 
          onClick={() => onNavigate('organization')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entités Organisées</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{entities.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Dépts, Directions, Divisions & Services
            </div>
          </div>
        </div>

        {/* Sécurité & Alertes */}
        <div 
          onClick={() => onNavigate('security')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sécurité & Alertes</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeAlertsCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{securityIncidents.length}</div>
            <div className="text-[11px] text-rose-600 font-bold mt-0.5">
              {activeAlertsCount} alerte(s) / verrouillage(s)
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Categories Breakdown & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Documents with E-Signature Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dernières Publications en Circuit GED</h2>
              <p className="text-xs text-slate-500">Documents récents soumis au circuit de visa et d'e-signature</p>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition flex items-center justify-between"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{doc.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {doc.reference}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>{doc.documentType}</span>
                      <span>·</span>
                      <span>Auteur : {doc.authorName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  {doc.signatures.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                      <FileCheck2 className="w-3 h-3 text-emerald-600" />
                      <span>Visé</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {doc.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Categorical GED Distribution & Security Snapshot */}
        <div className="space-y-6">
          
          {/* Categories Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Répartition par Typologie GED
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-semibold text-blue-950">Financier & Comptable</span>
                </div>
                <span className="font-bold text-blue-800 font-mono">{finDocsCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="font-semibold text-emerald-950">Logistique & Commercial</span>
                </div>
                <span className="font-bold text-emerald-800 font-mono">{logDocsCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="font-semibold text-purple-950">Ressources Humaines (RH)</span>
                </div>
                <span className="font-bold text-purple-800 font-mono">{rhDocsCount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Bulletins de paie confidentiels :</span>
              <strong className="text-purple-900">Restreint agent & DR</strong>
            </div>
          </div>

          {/* Quick Security Status Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Anti-Intrusion Inter-Entités</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                Actif
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Toute tentative d'accès hors hiérarchie notifie le DG et le manager. 
              Le compte est verrouillé dès la récidive.
            </p>
            <button
              onClick={() => onNavigate('security')}
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow text-center"
            >
              Ouvrir le Centre de Sécurité
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
