import React from 'react';
import { 
  LayoutDashboard, 
  Network, 
  FolderGit2, 
  CheckSquare2, 
  Users, 
  ShieldAlert, 
  FileCode2,
  Lock,
  Sparkles
} from 'lucide-react';
import { User } from '../types';

export type TabType = 
  | 'dashboard' 
  | 'organization' 
  | 'documents' 
  | 'workflows' 
  | 'users' 
  | 'security' 
  | 'laravel_arch';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User;
  unreadSecurityCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  unreadSecurityCount,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number; locked?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'organization',
      label: 'Organigramme & Entités',
      icon: <Network className="w-5 h-5" />,
    },
    {
      id: 'documents',
      label: 'GED & Publications',
      icon: <FolderGit2 className="w-5 h-5" />,
    },
    {
      id: 'workflows',
      label: 'Workflows & Tâches',
      icon: <CheckSquare2 className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Gestion Utilisateurs (CRUD)',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'security',
      label: 'Sécurité & Anti-Intrusion',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: unreadSecurityCount,
    },
    {
      id: 'laravel_arch',
      label: 'Architecture Laravel 11',
      icon: <FileCode2 className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col border-r border-slate-800">
      {/* User Scope Indicator Card */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          <span>Périmètre d'Autorité</span>
        </div>
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
              {currentUser.role}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {['DG', 'PDG', 'DGA'].includes(currentUser.role)
              ? 'Super Utilisateur Global : Visibilité totale sur toute l\'organisation et ses entités'
              : currentUser.role === 'CHEF_DEPARTEMENT'
              ? 'Super User Département : Département et sous-entités (Directions, Divisions, Services)'
              : currentUser.role === 'DIRECTEUR'
              ? 'Super User Direction : Direction et sous-entités (Divisions, Services)'
              : currentUser.role === 'CHEF_DIVISION'
              ? 'Super User Division : Division et ses Services'
              : currentUser.role === 'CHEF_SERVICE'
              ? 'Super User Service : Service et ses Agents'
              : currentUser.role === 'RESPONSABLE_SECURITE'
              ? 'Audit de Sécurité : Détection d\'intrusion et sanctions disciplinaires'
              : 'Agent Exécutant : Tâches et documents assignés à son service'}
          </p>

          {currentUser.isLocked && (
            <div className="mt-2 p-1.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-rose-400" />
              <span>Compte Verrouillé pour intrusion !</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}>
                  {item.icon}
                </span>
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Laravel & Enrichment Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-2 text-[11px] text-amber-400 mb-1 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Enrichissements Inclus</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Matrice RACI, E-Signature SHA-256, Confidentialité Paie stricte, Verrouillage intrusion & Convocation officielle.
        </p>
      </div>
    </aside>
  );
};
