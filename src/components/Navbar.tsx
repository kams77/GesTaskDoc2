import React from 'react';
import { User, OrganizationConfig, SecurityIncident } from '../types';
import { 
  Building2, 
  ShieldAlert, 
  ChevronDown, 
  UserCheck, 
  Lock, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';

interface NavbarProps {
  organization: OrganizationConfig;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  securityIncidents: SecurityIncident[];
  onOpenSecurity: () => void;
  onOpenOrgConfig: () => void;
  onOpenLaravelCode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  organization,
  currentUser,
  allUsers,
  onSwitchUser,
  securityIncidents,
  onOpenSecurity,
  onOpenOrgConfig,
  onOpenLaravelCode,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const activeAlerts = securityIncidents.filter(
    (inc) => inc.status === 'ALERTE_ENVOYEE' || inc.status === 'COMPTE_VERROUILLE'
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DG':
      case 'PDG':
      case 'DGA':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'CHEF_DEPARTEMENT':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'DIRECTEUR':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'CHEF_DIVISION':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'CHEF_SERVICE':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'RESPONSABLE_SECURITE':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Org Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  {organization.name.length > 34 ? `${organization.name.substring(0, 34)}...` : organization.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {organization.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                Système GED & Workflow Hiérarchique · Ref. {organization.legalRegistration.substring(0, 24)}
              </p>
            </div>
          </div>

          {/* Quick Actions & Security Center Badge */}
          <div className="flex items-center space-x-3">
            
            {/* Laravel 11 Blueprint Export Button */}
            <button
              onClick={onOpenLaravelCode}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition text-xs font-medium"
              title="Voir l'architecture et code source Laravel 11"
            >
              <FileCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Code Source Laravel</span>
            </button>

            {/* Org config trigger */}
            <button
              onClick={onOpenOrgConfig}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition text-xs font-medium"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Paramètres Hiérarchie</span>
            </button>

            {/* Security Alerts Button with Badge */}
            <button
              onClick={onOpenSecurity}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                activeAlerts.length > 0
                  ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${activeAlerts.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Sécurité & Alertes</span>
              {activeAlerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-xs font-bold">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {/* Active User Switcher / Impersonator */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.title.length > 28 ? `${currentUser.title.substring(0, 26)}...` : currentUser.title}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-900">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Testeur de Rôles & Authentification
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Basculez instantanément d'utilisateur pour tester les scopes et permissions hiérarchiques.
                      </p>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {allUsers.map((u) => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 flex items-start space-x-3 transition hover:bg-slate-50 ${
                              isCurrent ? 'bg-blue-50/70' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-xs text-slate-700 mt-0.5">
                              {u.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                                  {u.name}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getRoleBadgeColor(u.role)}`}>
                                  {u.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{u.title}</p>
                              {u.isLocked && (
                                <span className="inline-flex items-center text-[10px] text-rose-600 font-semibold mt-0.5">
                                  <Lock className="w-2.5 h-2.5 mr-1" /> Compte Verrouillé (Intrusion)
                                </span>
                              )}
                            </div>
                            {isCurrent && (
                              <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Rôle actif : <strong className="text-slate-900">{currentUser.role}</strong></span>
                      {currentUser.isLocked ? (
                        <span className="text-rose-600 font-bold flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Verrouillé
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Actif</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
