import React, { useState } from 'react';
import { 
  Entity, 
  EntityType, 
  OrganizationConfig, 
  OrganizationType, 
  User 
} from '../types';
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  Sliders, 
  Users, 
  Check, 
  Trash2,
  Edit2
} from 'lucide-react';

interface OrganizationHierarchyProps {
  organization: OrganizationConfig;
  onUpdateOrg: (org: OrganizationConfig) => void;
  entities: Entity[];
  onAddEntity: (entity: Entity) => void;
  onDeleteEntity: (entityId: string) => void;
  users: User[];
  currentUser: User;
}

export const OrganizationHierarchy: React.FC<OrganizationHierarchyProps> = ({
  organization,
  onUpdateOrg,
  entities,
  onAddEntity,
  onDeleteEntity,
  users,
  currentUser,
}) => {
  const [activeView, setActiveView] = useState<'chart' | 'config'>('chart');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal state
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityCode, setNewEntityCode] = useState('');
  const [newEntityType, setNewEntityType] = useState<EntityType>('Departement');
  const [newEntityParentId, setNewEntityParentId] = useState<string>('');
  const [newEntityDesc, setNewEntityDesc] = useState('');

  // Org form state
  const [orgType, setOrgType] = useState<OrganizationType>(organization.type);
  const [orgName, setOrgName] = useState(organization.name);
  const [orgLegal, setOrgLegal] = useState(organization.legalRegistration);
  const [orgHQ, setOrgHQ] = useState(organization.headquarters);
  const [hasDepts, setHasDepts] = useState(organization.hasDepartments);
  const [hasDirs, setHasDirs] = useState(organization.hasDirections);
  const [hasDivs, setHasDivs] = useState(organization.hasDivisions);
  const [hasServs, setHasServs] = useState(organization.hasServices);

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleSaveOrgConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrg({
      ...organization,
      name: orgName,
      type: orgType,
      legalRegistration: orgLegal,
      headquarters: orgHQ,
      hasDepartments: hasDepts,
      hasDirections: hasDirs,
      hasDivisions: hasDivs,
      hasServices: hasServs,
    });
    setActiveView('chart');
  };

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim() || !newEntityCode.trim()) return;

    const newEnt: Entity = {
      id: `ent-${Date.now()}`,
      name: newEntityName,
      code: newEntityCode.toUpperCase(),
      type: newEntityType,
      parentEntityId: newEntityParentId || undefined,
      description: newEntityDesc,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddEntity(newEnt);
    setShowAddModal(false);
    setNewEntityName('');
    setNewEntityCode('');
    setNewEntityDesc('');
  };

  // Group entities hierarchically
  const departments = entities.filter((e) => e.type === 'Departement');
  
  // Directions can be under a department, or root if organization has no departments
  const getDirections = (deptId?: string) =>
    entities.filter((e) => e.type === 'Direction' && (!deptId || e.parentEntityId === deptId));

  const getDivisions = (dirId: string) =>
    entities.filter((e) => e.type === 'Division' && e.parentEntityId === dirId);

  const getServices = (divId: string) =>
    entities.filter((e) => e.type === 'Service' && e.parentEntityId === divId);

  const getManagerForEntity = (entityId: string) => {
    return users.find((u) => u.entityId === entityId && u.role !== 'AGENT');
  };

  const getAgentsForService = (serviceId: string) => {
    return users.filter((u) => u.entityId === serviceId && u.role === 'AGENT');
  };

  // Can the current user add an entity? DG and Dept heads have rights
  const canManageEntities = ['DG', 'PDG', 'DGA', 'CHEF_DEPARTEMENT'].includes(currentUser.role);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              {organization.type}
            </span>
            <h1 className="text-xl font-bold text-slate-900">{organization.name}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gouvernance institutionnelle & hiérarchisation configurable selon la politique de l'organisation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveView('chart')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeView === 'chart'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Organigramme Dynamique
            </button>
            <button
              onClick={() => setActiveView('config')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeView === 'config'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paramétrage des Niveaux
            </button>
          </div>

          {canManageEntities && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Entité</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Levels Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border ${hasDepts ? 'bg-purple-50/70 border-purple-200 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Niveau 1 · Départements</span>
            {hasDepts ? <Check className="w-4 h-4 text-purple-600" /> : <span className="text-[10px]">Désactivé</span>}
          </div>
          <div className="text-lg font-extrabold mt-1">
            {entities.filter(e => e.type === 'Departement').length} entité(s)
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${hasDirs ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Niveau 2 · Directions</span>
            {hasDirs ? <Check className="w-4 h-4 text-blue-600" /> : <span className="text-[10px]">Désactivé</span>}
          </div>
          <div className="text-lg font-extrabold mt-1">
            {entities.filter(e => e.type === 'Direction').length} entité(s)
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${hasDivs ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Niveau 3 · Divisions</span>
            {hasDivs ? <Check className="w-4 h-4 text-cyan-600" /> : <span className="text-[10px]">Désactivé</span>}
          </div>
          <div className="text-lg font-extrabold mt-1">
            {entities.filter(e => e.type === 'Division').length} entité(s)
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${hasServs ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Niveau 4 · Services</span>
            {hasServs ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-[10px]">Désactivé</span>}
          </div>
          <div className="text-lg font-extrabold mt-1">
            {entities.filter(e => e.type === 'Service').length} entité(s)
          </div>
        </div>
      </div>

      {/* VIEW 1: ORGANIGRAMME DYNAMIQUE */}
      {activeView === 'chart' && (
        <div className="space-y-6">
          
          {/* Top Apex Node: Direction Générale (DG / PDG / DGA) */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Haute Direction Stratégique · Super Utilisateur Global</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">Direction Générale (DG / PDG / DGA)</h2>
                <p className="text-xs text-amber-100 max-w-2xl mt-1">
                  Pouvoir d'attribution direct aux entités génériques (Département, Direction, Division, Service). 
                  Supervision totale sur tous les documents et flux de l'organisation.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {users.filter(u => ['DG', 'PDG', 'DGA'].includes(u.role)).map(u => (
                  <div key={u.id} className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                    <span className="font-bold">{u.name}</span>
                    <span className="text-amber-200 ml-1.5 text-[11px]">({u.title})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tree Structure */}
          <div className="space-y-4">
            {departments.map((dept) => {
              const deptCollapsed = collapsedNodes[dept.id];
              const deptManager = getManagerForEntity(dept.id);
              const deptDirections = getDirections(dept.id);

              return (
                <div key={dept.id} className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
                  
                  {/* Department Header */}
                  <div 
                    onClick={() => toggleCollapse(dept.id)}
                    className="p-4 bg-purple-50/50 hover:bg-purple-100/50 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center space-x-3">
                      <button className="p-1 rounded-md text-purple-700 hover:bg-purple-200/60">
                        {deptCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                        DEP
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
                            {dept.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{dept.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {deptManager ? (
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-bold text-slate-800">{deptManager.name}</div>
                          <div className="text-[10px] text-purple-700 font-semibold">{deptManager.title}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chef non assigné</span>
                      )}

                      {canManageEntities && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Supprimer le département ${dept.name} ?`)) {
                              onDeleteEntity(dept.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Directions under Department */}
                  {!deptCollapsed && (
                    <div className="p-4 pl-8 space-y-4 border-t border-purple-100 bg-slate-50/40">
                      {deptDirections.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          Aucune direction rattachée à ce département.
                        </p>
                      ) : (
                        deptDirections.map((dir) => {
                          const dirCollapsed = collapsedNodes[dir.id];
                          const dirManager = getManagerForEntity(dir.id);
                          const dirDivisions = getDivisions(dir.id);

                          return (
                            <div key={dir.id} className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
                              
                              {/* Direction Header */}
                              <div
                                onClick={() => toggleCollapse(dir.id)}
                                className="p-3 bg-blue-50/40 hover:bg-blue-100/40 cursor-pointer flex items-center justify-between transition"
                              >
                                <div className="flex items-center space-x-3">
                                  <button className="p-0.5 text-blue-700">
                                    {dirCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                                    DIR
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-slate-800 text-xs sm:text-sm">{dir.name}</span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                                        {dir.code}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">{dir.description}</p>
                                  </div>
                                </div>

                                <div className="text-right hidden sm:block">
                                  {dirManager && (
                                    <>
                                      <div className="text-xs font-bold text-slate-800">{dirManager.name}</div>
                                      <div className="text-[10px] text-blue-700">{dirManager.title}</div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Divisions under Direction */}
                              {!dirCollapsed && (
                                <div className="p-3 pl-8 space-y-3 border-t border-blue-100 bg-slate-50/60">
                                  {dirDivisions.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-1">
                                      Aucune division rattachée à cette direction.
                                    </p>
                                  ) : (
                                    dirDivisions.map((div) => {
                                      const divCollapsed = collapsedNodes[div.id];
                                      const divManager = getManagerForEntity(div.id);
                                      const divServices = getServices(div.id);

                                      return (
                                        <div key={div.id} className="bg-white rounded-lg border border-cyan-200 overflow-hidden">
                                          
                                          {/* Division Header */}
                                          <div
                                            onClick={() => toggleCollapse(div.id)}
                                            className="p-2.5 bg-cyan-50/40 hover:bg-cyan-100/40 cursor-pointer flex items-center justify-between transition"
                                          >
                                            <div className="flex items-center space-x-2.5">
                                              <button className="p-0.5 text-cyan-700">
                                                {divCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                              </button>
                                              <div className="w-6 h-6 rounded bg-cyan-600 text-white font-bold flex items-center justify-center text-[10px]">
                                                DIV
                                              </div>
                                              <div>
                                                <div className="flex items-center space-x-1.5">
                                                  <span className="font-semibold text-slate-800 text-xs">{div.name}</span>
                                                  <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-100 text-cyan-800 rounded">
                                                    {div.code}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {divManager && (
                                              <span className="text-[11px] font-medium text-slate-600 hidden sm:inline">
                                                Chef : <strong>{divManager.name}</strong>
                                              </span>
                                            )}
                                          </div>

                                          {/* Services under Division */}
                                          {!divCollapsed && (
                                            <div className="p-3 pl-8 space-y-2.5 border-t border-cyan-100 bg-white">
                                              {divServices.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">Aucun service rattaché.</p>
                                              ) : (
                                                divServices.map((srv) => {
                                                  const srvManager = getManagerForEntity(srv.id);
                                                  const agents = getAgentsForService(srv.id);

                                                  return (
                                                    <div key={srv.id} className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/20">
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                          <div className="w-5 h-5 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">
                                                            SRV
                                                          </div>
                                                          <span className="text-xs font-bold text-slate-800">{srv.name}</span>
                                                          <span className="text-[9px] font-mono px-1 bg-emerald-100 text-emerald-800 rounded">
                                                            {srv.code}
                                                          </span>
                                                        </div>

                                                        {srvManager && (
                                                          <span className="text-[11px] text-emerald-800 font-semibold">
                                                            Chef Service : {srvManager.name}
                                                          </span>
                                                        )}
                                                      </div>

                                                      {/* Agents in Service */}
                                                      <div className="mt-2 pl-7 flex items-center flex-wrap gap-1.5">
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                                          Agents exécutants :
                                                        </span>
                                                        {agents.length === 0 ? (
                                                          <span className="text-[11px] text-slate-400 italic">Aucun agent affecté</span>
                                                        ) : (
                                                          agents.map((agt) => (
                                                            <span
                                                              key={agt.id}
                                                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                                                            >
                                                              <Users className="w-3 h-3 mr-1 text-slate-400" />
                                                              {agt.name}
                                                            </span>
                                                          ))
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: PARAMÉTRAGE DES NIVEAUX ET POLITIQUES */}
      {activeView === 'config' && (
        <form onSubmit={handleSaveOrgConfig} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Paramétrage Institutionnel de l'Organisation</h2>
            <p className="text-xs text-slate-500">
              Adaptez les niveaux hiérarchiques et la forme juridique (Entreprise, Établissement public, ONG).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type d'Organisation</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="Entreprise">Entreprise (Société Commerciale / Groupe)</option>
                <option value="Etablissement">Établissement (Public / Institutionnel)</option>
                <option value="ONG">ONG (Organisation Non Gouvernementale / Asbl)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dénomination Sociale</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Immatriculation / Agrément</label>
              <input
                type="text"
                value={orgLegal}
                onChange={(e) => setOrgLegal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Siège Social</label>
              <input
                type="text"
                value={orgHQ}
                onChange={(e) => setOrgHQ(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Hierarchy Toggles: "Une Entreprise peut avoir ou ne pas avoir..." */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Configuration de la Hiérarchisation (selon la politique de l'Organisation)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Activez ou désactivez les paliers structurels selon l'organigramme officiel en vigueur :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasDepts}
                  onChange={(e) => setHasDepts(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Départements</span>
                  <span className="text-[11px] text-slate-500">
                    Grandes divisions fonctionnelles (Finance, RH, Opérations).
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasDirs}
                  onChange={(e) => setHasDirs(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Directions</span>
                  <span className="text-[11px] text-slate-500">
                    Directions métiers sous les départements ou rattachées directement au DG.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasDivs}
                  onChange={(e) => setHasDivs(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Divisions</span>
                  <span className="text-[11px] text-slate-500">
                    Pôles d'expertise et de coordination sous les directions.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={hasServs}
                  onChange={(e) => setHasServs(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Services</span>
                  <span className="text-[11px] text-slate-500">
                    Unités opérationnelles accueillant directement les agents exécutants.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setActiveView('chart')}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
            >
              Enregistrer la Configuration
            </button>
          </div>
        </form>
      )}

      {/* MODAL: AJOUT D'UNE NOUVELLE ENTITÉ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Créer une Entité Structurelle</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ajout selon la politique d'organisation et rattachement hiérarchique.
            </p>

            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type d'Entité</label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value as EntityType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Departement">Département</option>
                    <option value="Direction">Direction</option>
                    <option value="Division">Division</option>
                    <option value="Service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Code Entité</label>
                  <input
                    type="text"
                    placeholder="Ex: DIR-COM, SRV-LOG"
                    value={newEntityCode}
                    onChange={(e) => setNewEntityCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nom Complet de l'Entité</label>
                <input
                  type="text"
                  placeholder="Ex: Direction des Systèmes d'Information"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              {/* Parent selector if not department */}
              {newEntityType !== 'Departement' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Entité Parente (Rattachement)</label>
                  <select
                    value={newEntityParentId}
                    onChange={(e) => setNewEntityParentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  >
                    <option value="">Sélectionnez l'entité parente...</option>
                    {newEntityType === 'Direction' &&
                      entities.filter(e => e.type === 'Departement').map(e => (
                        <option key={e.id} value={e.id}>[Département] {e.name} ({e.code})</option>
                      ))}
                    {newEntityType === 'Division' &&
                      entities.filter(e => e.type === 'Direction').map(e => (
                        <option key={e.id} value={e.id}>[Direction] {e.name} ({e.code})</option>
                      ))}
                    {newEntityType === 'Service' &&
                      entities.filter(e => e.type === 'Division').map(e => (
                        <option key={e.id} value={e.id}>[Division] {e.name} ({e.code})</option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Missions & Description</label>
                <textarea
                  rows={2}
                  value={newEntityDesc}
                  onChange={(e) => setNewEntityDesc(e.target.value)}
                  placeholder="Attributions de l'entité..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
                >
                  Créer l'Entité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
