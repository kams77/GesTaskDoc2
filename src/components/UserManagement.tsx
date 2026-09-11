import React, { useState } from 'react';
import { User, UserRole, Entity } from '../types';
import { getCreatableRoles, getDescendantEntityIds } from '../utils/permissions';
import { 
  Users, 
  UserPlus, 
  Lock, 
  Unlock, 
  UserX, 
  UserCheck, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Building 
} from 'lucide-react';

interface UserManagementProps {
  allUsers: User[];
  currentUser: User;
  entities: Entity[];
  onAddUser: (user: User) => void;
  onToggleRevoke: (userId: string) => void;
  onToggleLock: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  allUsers,
  currentUser,
  entities,
  onAddUser,
  onToggleRevoke,
  onToggleLock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [matricule, setMatricule] = useState('');
  const [role, setRole] = useState<UserRole>('AGENT');
  const [title, setTitle] = useState('');
  const [entityId, setEntityId] = useState('');
  const [phone, setPhone] = useState('');

  const permissionInfo = getCreatableRoles(currentUser);

  // Get list of entities where current user is authorized to create/manage users
  const getManageableEntities = () => {
    if (['DG', 'PDG', 'DGA'].includes(currentUser.role)) {
      return entities;
    }
    if (!currentUser.entityId) return [];

    const descendantIds = getDescendantEntityIds(currentUser.entityId, entities);
    return entities.filter(e => descendantIds.includes(e.id));
  };

  const manageableEntities = getManageableEntities();

  // Roles available for creation depending on current user role
  const getAvailableRolesToCreate = (): UserRole[] => {
    if (['DG', 'PDG', 'DGA'].includes(currentUser.role)) {
      return ['DG', 'PDG', 'DGA', 'CHEF_DEPARTEMENT', 'DIRECTEUR', 'CHEF_DIVISION', 'CHEF_SERVICE', 'AGENT', 'RESPONSABLE_SECURITE'];
    }
    if (currentUser.role === 'CHEF_DEPARTEMENT') {
      return ['DIRECTEUR', 'CHEF_DIVISION', 'CHEF_SERVICE', 'AGENT'];
    }
    if (currentUser.role === 'DIRECTEUR') {
      return ['CHEF_DIVISION', 'CHEF_SERVICE', 'AGENT'];
    }
    if (currentUser.role === 'CHEF_DIVISION') {
      return ['CHEF_SERVICE', 'AGENT'];
    }
    if (currentUser.role === 'CHEF_SERVICE') {
      return ['AGENT'];
    }
    return [];
  };

  const availableRoles = getAvailableRolesToCreate();

  // Check if current user has rights to edit/revoke a specific user
  const canManageTargetUser = (targetUser: User): boolean => {
    if (targetUser.id === currentUser.id) return false; // Cannot revoke self
    if (['DG', 'PDG', 'DGA'].includes(currentUser.role)) return true; // DG can revoke anyone
    if (currentUser.role === 'AGENT') return false;

    if (!currentUser.entityId || !targetUser.entityId) return false;
    const descendantIds = getDescendantEntityIds(currentUser.entityId, entities);
    return descendantIds.includes(targetUser.entityId);
  };

  const filteredUsers = allUsers.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.matricule.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const generatedMatricule = matricule.trim() || `MAT-${role.substring(0, 3)}-${Date.now().toString().slice(-4)}`;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      matricule: generatedMatricule,
      role,
      title: title || `${role} - ${entities.find(e => e.id === entityId)?.name || 'Direction'}`,
      entityId: entityId || undefined,
      isLocked: false,
      isRevoked: false,
      failedIntrusionAttempts: 0,
      phone: phone || '+225 00 00 00 00',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setName('');
    setEmail('');
    setMatricule('');
    setTitle('');
    setPhone('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Hierarchy Rights Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Gestion des Agents & Habilitations CRUD</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              Contrainte Hiérarchique
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Création, révocation et habilitations déléguées selon le rang hiérarchique du gestionnaire.
          </p>
        </div>

        {permissionInfo.allowed && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enrôler un Nouvel Agent</span>
          </button>
        )}
      </div>

      {/* Scope Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-start space-x-3 shadow-md border border-slate-800">
        <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-amber-300 block mb-0.5">
            Votre Pouvoir CRUD Actuel ({currentUser.role}) :
          </span>
          <p className="text-slate-300 leading-relaxed">
            {permissionInfo.description}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher nom, matricule, rôle, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total : <strong>{filteredUsers.length}</strong> utilisateur(s)
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Agent / Collaborateur</th>
                <th className="px-4 py-3">Matricule & Rôle</th>
                <th className="px-4 py-3">Entité Rattachée</th>
                <th className="px-4 py-3">Statut Compte</th>
                <th className="px-4 py-3 text-right">Actions Autorité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const entity = entities.find(e => e.id === user.entityId);
                const canManage = canManageTargetUser(user);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* User Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Matricule */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] font-bold text-slate-700">{user.matricule}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-4 py-3">
                      {entity ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">{entity.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">[{entity.code}] {entity.type}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          Omniprésent (Direction Générale)
                        </span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-3">
                      {user.isRevoked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <UserX className="w-3 h-3 mr-1" /> Révoqué
                        </span>
                      ) : user.isLocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          <Lock className="w-3 h-3 mr-1" /> Verrouillé (Intrusion)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <UserCheck className="w-3 h-3 mr-1" /> Actif
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <div className="flex items-center justify-end space-x-2">
                          {/* Unlock if locked */}
                          {user.isLocked && (
                            <button
                              onClick={() => onToggleLock(user.id)}
                              className="px-2 py-1 rounded bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 flex items-center"
                              title="Déverrouiller le compte"
                            >
                              <Unlock className="w-3 h-3 mr-1" /> Débloquer
                            </button>
                          )}

                          {/* Revoke / Reactivate */}
                          <button
                            onClick={() => onToggleRevoke(user.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                              user.isRevoked
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {user.isRevoked ? 'Réactiver' : 'Révoquer'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Hors périmètre</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENROLL USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Enrôler un Nouvel Agent / Responsable</h3>
            <p className="text-xs text-slate-500 mb-4">
              Création selon les limites de votre mandat ({currentUser.role}).
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nom et Prénom</label>
                <input
                  type="text"
                  placeholder="Ex: Jean Kouassi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Adresse Email Pro</label>
                  <input
                    type="email"
                    placeholder="j.kouassi@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+225 07 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Rôle Hiérarchique</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Matricule (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Auto-généré si vide"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Entity Assignment */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Affectation à une Entité
                </label>
                <select
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  required={role !== 'DG' && role !== 'DGA'}
                >
                  <option value="">Sélectionnez l'entité sous votre tutelle...</option>
                  {manageableEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      [{ent.type}] {ent.name} ({ent.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Titre du Poste</label>
                <input
                  type="text"
                  placeholder="Ex: Agent Comptable Fournisseurs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  Créer l'Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
