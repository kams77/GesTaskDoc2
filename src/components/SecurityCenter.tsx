import React, { useState } from 'react';
import { 
  SecurityIncident, 
  User, 
  Entity, 
  DisciplinarySummons,
  OrganizationConfig 
} from '../types';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Bell, 
  Radio, 
  FileWarning, 
  Printer, 
  ExternalLink,
  Flame,
  Send
} from 'lucide-react';

interface SecurityCenterProps {
  organization: OrganizationConfig;
  incidents: SecurityIncident[];
  allUsers: User[];
  entities: Entity[];
  currentUser: User;
  onSimulateIntrusion: (agentId: string, targetEntityId: string) => void;
  onUnlockAccount: (userId: string) => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({
  organization,
  incidents,
  allUsers,
  entities,
  currentUser,
  onSimulateIntrusion,
  onUnlockAccount,
}) => {
  const [selectedSummons, setSelectedSummons] = useState<DisciplinarySummons | null>(null);
  
  // Intrusion simulator state
  const [simAgentId, setSimAgentId] = useState(allUsers.find(u => u.role === 'AGENT')?.id || '');
  const [simTargetEntityId, setSimTargetEntityId] = useState(entities[0]?.id || '');
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);

  const handleRunSimulation = () => {
    if (!simAgentId || !simTargetEntityId) return;

    onSimulateIntrusion(simAgentId, simTargetEntityId);
    setSimulationFeedback('Tentative enregistrée ! Vérifiez le déclenchement de l\'alerte ci-dessous.');
    setTimeout(() => setSimulationFeedback(null), 4000);
  };

  const activeLockedUsers = allUsers.filter(u => u.isLocked);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Centre de Sécurité & Détection d'Intrusion</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
              Bouclier Actif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Surveillance en temps réel des accès inter-entités, alertes instantanées au DG et convocations disciplinaires.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-semibold flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>IDS/IPS Protocol : Actif</span>
          </div>
        </div>
      </div>

      {/* Real-time Intrusion Detection Rule Explainer */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 rounded-2xl p-5 text-white border border-rose-900/60 shadow-lg">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-rose-200 uppercase tracking-wider">
              Politique de Sécurité Intégrée · Article d'Intégrité Inter-Entités
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              « Lorsqu'un collaborateur d'une entité tente d'accéder sans habilitation à une entité externe 
              (Département, Direction, Division ou Service) : 
              <strong> une alerte de sécurité est immédiatement transmise au DG et au responsable de l'entité visée. </strong> 
              En cas d'insistance sans invitation formelle, <strong>le compte est automatiquement verrouillé</strong> et l'agent 
              est formellement <strong>convoqué devant le Responsable de Sécurité, le Directeur Général et sa hiérarchie directe</strong>. »
            </p>
          </div>
        </div>
      </div>

      {/* INTRUSION SIMULATOR BENCH */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Banc de Test : Simulation d'Intrusion Non Autorisée</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Permet d'éprouver le protocole d'alerte et le verrouillage automatique
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              1. Collaborateur Initiateur
            </label>
            <select
              value={simAgentId}
              onChange={(e) => setSimAgentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              {allUsers.map((u) => {
                const ent = entities.find(e => e.id === u.entityId);
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role} - {ent ? ent.code : 'DG'}) {u.isLocked ? '[Verrouillé]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              2. Entité Cible (Interdite)
            </label>
            <select
              value={simTargetEntityId}
              onChange={(e) => setSimTargetEntityId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.type}] {e.name} ({e.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Forcer la Tentative d'Intrusion</span>
            </button>
          </div>
        </div>

        {simulationFeedback && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{simulationFeedback}</span>
          </div>
        )}
      </div>

      {/* Active Locked Accounts Section */}
      {activeLockedUsers.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-900">
              <Lock className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold">Comptes Verrouillés pour Violation de Sécurité ({activeLockedUsers.length})</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeLockedUsers.map((u) => {
              const ent = entities.find(e => e.id === u.entityId);
              return (
                <div key={u.id} className="bg-white p-3 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.title} · {ent?.code || 'Direction'}</div>
                    <span className="inline-block mt-1 text-[10px] text-rose-600 font-bold">
                      {u.failedIntrusionAttempts} tentative(s) d'intrusion
                    </span>
                  </div>

                  <button
                    onClick={() => onUnlockAccount(u.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 flex items-center space-x-1"
                    title="Déverrouiller après audition disciplinaire"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Débloquer</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incidents & Alerts Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Registre d'Audit & Journal des Tentatives d'Accès
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {incidents.length} incident(s) journalisé(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Horodatage & IP</th>
                <th className="px-4 py-3">Agent & Entité d'Origine</th>
                <th className="px-4 py-3">Entité Visée (Cible)</th>
                <th className="px-4 py-3">Récidive / Statut</th>
                <th className="px-4 py-3">Notification Destinataires</th>
                <th className="px-4 py-3 text-right">Sanction & Convocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3">
                    <div className="font-mono text-slate-800 font-semibold">{inc.timestamp}</div>
                    <div className="text-[10px] text-slate-400 font-mono">IP: {inc.ipAddress}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{inc.userName}</div>
                    <div className="text-[10px] text-slate-500">{inc.userEntityName}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {inc.attemptedEntityName}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-700">
                      {inc.attemptCount} {inc.attemptCount > 1 ? 'tentatives (Insistance)' : 'tentative'}
                    </div>
                    {inc.isAccountLocked ? (
                      <span className="inline-flex items-center text-[10px] text-rose-600 font-bold">
                        <Lock className="w-2.5 h-2.5 mr-1" /> Compte Verrouillé
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Alerte 1er niveau
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-[10px] text-slate-600 space-y-0.5">
                      {inc.alertSentTo.map((dst, idx) => (
                        <div key={idx} className="flex items-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{dst}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {inc.summons ? (
                      <button
                        onClick={() => setSelectedSummons(inc.summons!)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 shadow-xs flex items-center space-x-1 ml-auto"
                      >
                        <FileWarning className="w-3 h-3" />
                        <span>Voir Convocation</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sous observation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISCIPLINARY SUMMONS MODAL / OFFICIAL LETTERHEAD */}
      {selectedSummons && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 max-h-[95vh] overflow-y-auto print:p-0">
            
            {/* Formal Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                    {organization.name}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Direction Générale · Département Sécurité des Systèmes d'Information
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Ref. Régistre : {selectedSummons.summonsNumber}
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-900 text-xs font-extrabold uppercase tracking-wider border border-rose-300">
                    Convocation Disciplinaire
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Fait le {selectedSummons.generatedDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Destinataire Convoqué :
                </span>
                <div className="text-sm font-extrabold text-slate-900">{selectedSummons.convokedUserName}</div>
                <div className="text-slate-600 font-medium">
                  Rôle : {selectedSummons.convokedUserRole} · Unité : {selectedSummons.convokedUserEntity}
                </div>
              </div>

              <div>
                <strong className="block text-slate-900 text-xs uppercase tracking-wider mb-1">
                  Objet : Convocation formelle suite à tentative d'accès non autorisé répétée (Intrusion Inter-Entités)
                </strong>
                <p>
                  Monsieur / Madame,
                </p>
                <p className="mt-1">
                  Les systèmes de détection et de gouvernance ont relevé des tentatives persistantes d'accès non autorisé 
                  à des ressources et documents strictement restreints relevant d'une autre entité de notre organisation, 
                  sans habilitation ni invitation préalable.
                </p>
              </div>

              <div className="bg-rose-50 border-l-4 border-rose-600 p-3 text-rose-950">
                <span className="font-bold block text-[11px]">Motif de l'audition disciplinaire :</span>
                <p className="mt-0.5">{selectedSummons.motif}</p>
              </div>

              {/* Hearing Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Date & Heure d'Audition</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedSummons.hearingDate} à {selectedSummons.hearingTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Lieu</span>
                  <span className="font-bold text-slate-900">
                    {selectedSummons.location}
                  </span>
                </div>
              </div>

              {/* Convocateurs */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Composition de la Commission Disciplinaire :
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>1. Directeur Général :</strong> {selectedSummons.conveeneurs.dgName}</li>
                  <li><strong>2. Responsable Sécurité :</strong> {selectedSummons.conveeneurs.securityOfficerName}</li>
                  <li><strong>3. Responsable Hiérarchique de l'entité :</strong> {selectedSummons.conveeneurs.hierarchicalManagerName}</li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 italic border-t border-slate-200 pt-3">
                {selectedSummons.legalNotice}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedSummons(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer / Exporter la Convocation</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
