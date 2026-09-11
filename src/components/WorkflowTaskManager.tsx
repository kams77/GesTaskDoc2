import React, { useState } from 'react';
import { 
  TaskWorkflow, 
  TaskType, 
  User, 
  Entity, 
  GranularRights,
  ESignatureRecord 
} from '../types';
import { canUserViewTask } from '../utils/permissions';
import { 
  CheckSquare2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Sliders, 
  FileCheck2, 
  PenTool, 
  Send,
  Flag,
  Sparkles
} from 'lucide-react';

interface WorkflowTaskManagerProps {
  tasks: TaskWorkflow[];
  currentUser: User;
  entities: Entity[];
  allUsers: User[];
  onAddTask: (task: TaskWorkflow) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskWorkflow['status'], progress: number) => void;
  onSignTask: (taskId: string, signature: ESignatureRecord) => void;
}

export const WorkflowTaskManager: React.FC<WorkflowTaskManagerProps> = ({
  tasks,
  currentUser,
  entities,
  allUsers,
  onAddTask,
  onUpdateTaskStatus,
  onSignTask,
}) => {
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskWorkflow | null>(null);

  // Form State for Task Creation
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('APPROBATION');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskWorkflow['priority']>('Normale');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [targetEntityIds, setTargetEntityIds] = useState<string[]>([]);
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  
  // RACI Matrix assignments
  const [raciR, setRaciR] = useState<string>(''); // Responsible
  const [raciA, setRaciA] = useState<string>(''); // Accountable
  const [raciC, setRaciC] = useState<string>(''); // Consulted
  const [raciI, setRaciI] = useState<string>(''); // Informed

  // Granular rights
  const [taskRights, setTaskRights] = useState<GranularRights>({
    canView: true,
    canOpen: true,
    canEdit: true,
    canTrack: true,
    canExecute: true,
    canValidate: true,
    canSign: true,
  });

  // Filter accessible tasks for current user
  const accessibleTasks = tasks.filter((t) => canUserViewTask(currentUser, t, entities));

  const filteredTasks = accessibleTasks.filter((t) => {
    if (selectedTaskType !== 'ALL' && t.taskType !== selectedTaskType) return false;
    return true;
  });

  // Allowed target entities based on user hierarchical tier:
  // DG -> all generic entities (Dept, Dir, Div, Srv)
  // Chef Dept -> Dept + Dir, Div, Srv of Dept
  // Chef Dir -> Dir + Div, Srv of Dir
  // Chef Div -> Div + Srv of Div
  // Chef Srv -> Srv + Agents
  const getAssignableEntities = () => {
    if (['DG', 'PDG', 'DGA'].includes(currentUser.role)) {
      return entities;
    }
    if (currentUser.role === 'CHEF_DEPARTEMENT') {
      return entities.filter(e => e.id === currentUser.entityId || e.parentEntityId === currentUser.entityId);
    }
    if (currentUser.role === 'DIRECTEUR') {
      return entities.filter(e => e.id === currentUser.entityId || e.parentEntityId === currentUser.entityId);
    }
    if (currentUser.role === 'CHEF_DIVISION') {
      return entities.filter(e => e.id === currentUser.entityId || e.parentEntityId === currentUser.entityId);
    }
    if (currentUser.role === 'CHEF_SERVICE') {
      return entities.filter(e => e.id === currentUser.entityId);
    }
    return [];
  };

  const assignableEntities = getAssignableEntities();

  // Handle task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: TaskWorkflow = {
      id: `tsk-${Date.now()}`,
      code: `TSK-${taskType.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
      title: taskTitle,
      taskType: taskType,
      description: taskDesc,
      priority: taskPriority,
      status: 'A_faire',
      creatorId: currentUser.id,
      creatorRole: currentUser.role,
      creatorEntityId: currentUser.entityId,
      targetEntityIds: targetEntityIds.length > 0 ? targetEntityIds : [currentUser.entityId || entities[0]?.id],
      assignedAgentIds: assignedAgentId ? [assignedAgentId] : (raciR ? [raciR] : [currentUser.id]),
      dueDate: taskDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      progress: 0,
      rights: { ...taskRights },
      raci: {
        responsibleId: raciR || currentUser.id,
        accountableId: raciA || currentUser.id,
        consultedIds: raciC ? [raciC] : [],
        informedIds: raciI ? [raciI] : [],
      },
      signatures: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddTask(newTask);
    setShowCreateModal(false);
    setTaskTitle('');
    setTaskDesc('');
  };

  const handleSignTask = (task: TaskWorkflow) => {
    const newSignature: ESignatureRecord = {
      id: `sig-tsk-${Date.now()}`,
      signerId: currentUser.id,
      signerName: currentUser.name,
      signerRole: currentUser.role,
      signerTitle: currentUser.title,
      entityName: entities.find(e => e.id === currentUser.entityId)?.name || 'Direction',
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50"><path d="M10,25 Q50,45 80,15 T150,30" stroke="%23059669" stroke-width="2.5" fill="none"/></svg>',
      certificateHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comments: 'Validation formelle des livrables et clôture de tâche',
    };

    onSignTask(task.id, newSignature);
    onUpdateTaskStatus(task.id, 'Termine', 100);
    setSelectedTaskDetail(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Attribution de Tâches & Workflows</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Module 1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Délégation selon les 5 paliers hiérarchiques, matrice RACI et validation par signature électronique.
          </p>
        </div>

        {/* Create Task button: accessible to DG, Dept Heads, Directors, Division Heads, Service Heads */}
        {currentUser.role !== 'AGENT' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Créer & Assigner une Tâche</span>
          </button>
        )}
      </div>

      {/* Task Type Filters */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold border-b border-slate-200 pb-3">
        {[
          { id: 'ALL', label: `Toutes les Tâches (${accessibleTasks.length})` },
          { id: 'APPROBATION', label: 'Tâches d\'Approbation (DA, Congés, Frais)' },
          { id: 'PRODUCTION', label: 'Tâches de Production & Maintenance' },
          { id: 'SUIVI_CLIENT', label: 'Tâches de Suivi Client & Recouvrement' },
          { id: 'PROJET', label: 'Tâches de Projet & Jalons' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTaskType(tab.id as TaskType | 'ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              selectedTaskType === tab.id
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <CheckSquare2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Aucune tâche active</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Aucune tâche n'est assignée à votre entité ou à votre rôle ({currentUser.role}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const responsibleUser = allUsers.find(u => u.id === task.raci.responsibleId);
            const accountableUser = allUsers.find(u => u.id === task.raci.accountableId);
            const isFinished = task.status === 'Termine';

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Status & Priority Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {task.code}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === 'Urgente'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : task.priority === 'Haute'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          task.status === 'Termine'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'En_cours'
                            ? 'bg-blue-100 text-blue-800'
                            : task.status === 'En_revue'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {task.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-600">Progression globale</span>
                      <span className="font-bold text-blue-600">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          task.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* RACI Matrix Overview */}
                  <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">R · RESPONSABLE (Exécutant)</span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {responsibleUser?.name || 'Non assigné'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">A · APPROBATEUR (Décideur)</span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {accountableUser?.name || 'Non assigné'}
                      </span>
                    </div>
                  </div>

                  {/* Signatures status if signed */}
                  {task.signatures.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-[11px] text-emerald-900">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Visa & Clôture certifiés</span>
                        <div className="text-[10px] text-emerald-700">
                          Signé par {task.signatures[0].signerName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>Échéance : {task.dueDate}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedTaskDetail(task)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Détails RACI
                    </button>

                    {/* Progress action for agents or responsible */}
                    {task.status !== 'Termine' && (
                      <button
                        onClick={() => {
                          const nextProg = task.progress >= 75 ? 100 : task.progress + 25;
                          const nextStatus = nextProg === 100 ? 'En_revue' : 'En_cours';
                          onUpdateTaskStatus(task.id, nextStatus, nextProg);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
                      >
                        +25%
                      </button>
                    )}

                    {/* Validation signature for managers */}
                    {task.status === 'En_revue' && currentUser.role !== 'AGENT' && (
                      <button
                        onClick={() => handleSignTask(task)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1 shadow-sm"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Valider & Signer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL WITH RACI MATRIX */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {selectedTaskDetail.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedTaskDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-700 font-bold block mb-1">Description</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                  {selectedTaskDetail.description}
                </p>
              </div>

              {/* RACI Matrix Full Details */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2">
                <h4 className="font-bold text-blue-950 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Matrice RACI (Enrichissement de Gouvernance)</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-blue-600 font-bold text-[10px] block">R · RESPONSABLE</span>
                    <span className="font-semibold text-slate-800">
                      {allUsers.find(u => u.id === selectedTaskDetail.raci.responsibleId)?.name || 'Non défini'}
                    </span>
                    <p className="text-[10px] text-slate-400">Exécute et réalise la tâche opérationnelle.</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-blue-600 font-bold text-[10px] block">A · APPROBATEUR (Accountable)</span>
                    <span className="font-semibold text-slate-800">
                      {allUsers.find(u => u.id === selectedTaskDetail.raci.accountableId)?.name || 'Non défini'}
                    </span>
                    <p className="text-[10px] text-slate-400">Valide le résultat final et appose sa signature.</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-blue-600 font-bold text-[10px] block">C · CONSULTÉ(S)</span>
                    <span className="font-semibold text-slate-800">
                      {selectedTaskDetail.raci.consultedIds.map(id => allUsers.find(u => u.id === id)?.name).join(', ') || 'Aucun'}
                    </span>
                    <p className="text-[10px] text-slate-400">Apporte son expertise technique ou budgétaire.</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-blue-600 font-bold text-[10px] block">I · INFORMÉ(S)</span>
                    <span className="font-semibold text-slate-800">
                      {selectedTaskDetail.raci.informedIds.map(id => allUsers.find(u => u.id === id)?.name).join(', ') || 'Direction Générale'}
                    </span>
                    <p className="text-[10px] text-slate-400">Tenu au courant de l'avancement.</p>
                  </div>
                </div>
              </div>

              {/* Granular Rights */}
              <div>
                <span className="text-slate-700 font-bold block mb-1">
                  Droits d'Actions Autorisés sur cette Tâche
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-[10px]">
                  {Object.entries(selectedTaskDetail.rights).map(([k, v]) => (
                    <div
                      key={k}
                      className={`p-2 rounded-lg border font-semibold ${
                        v ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div>{k.replace('can', '')}</div>
                      <div className="mt-1 font-bold">{v ? 'OUI' : 'NON'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Créer & Assigner une Tâche en Workflow</h3>
            <p className="text-xs text-slate-500 mb-4">
              Délégation selon votre rang ({currentUser.role}) et paramétrage des droits d'action.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type de Tâche</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="APPROBATION">Tâche d'Approbation (DA, notes de frais, congés)</option>
                  <option value="PRODUCTION">Tâche de Production (Ordre de fab, maintenance)</option>
                  <option value="SUIVI_CLIENT">Tâche de Suivi Client (Relance impayé, réclamation)</option>
                  <option value="PROJET">Tâche de Projet (Jalons, enregistrement d'heures)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Intitulé de la Tâche</label>
                <input
                  type="text"
                  placeholder="Ex: Validation de la demande d'achat serveurs haute fréquence"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Priorité</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskWorkflow['priority'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date d'Échéance</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Target Entity Selection based on user hierarchy rules */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Entité Cible Associée (Règle Hiérarchique de Rattachement)
                </label>
                <select
                  value={targetEntityIds[0] || ''}
                  onChange={(e) => setTargetEntityIds([e.target.value])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  required
                >
                  <option value="">Sélectionnez l'entité sous votre tutelle...</option>
                  {assignableEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      [{ent.type}] {ent.name} ({ent.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {['DG', 'PDG', 'DGA'].includes(currentUser.role)
                    ? 'Le DG a le pouvoir de lier directement à l\'ensemble des entités de l\'entreprise.'
                    : 'Rattaché selon votre périmètre de délégation hiérarchique.'}
                </p>
              </div>

              {/* RACI Matrix Setup */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 uppercase block">
                  Affectation RACI
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      R · Responsable Exécutant
                    </label>
                    <select
                      value={raciR}
                      onChange={(e) => setRaciR(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      required
                    >
                      <option value="">Choisir l'exécutant...</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      A · Approbateur / Signataire
                    </label>
                    <select
                      value={raciA}
                      onChange={(e) => setRaciA(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      required
                    >
                      <option value="">Choisir le signataire...</option>
                      {allUsers.filter(u => u.role !== 'AGENT').map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description / Livrables Attendus
                </label>
                <textarea
                  rows={2}
                  placeholder="Instructions détaillées..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Granular Rights for Task: Voir, Ouvrir, Éditer, Suivre, Exécuter, Valider, E-Signature */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Droits Granulaires Choisis
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'canView', label: 'Voir' },
                    { key: 'canOpen', label: 'Ouvrir' },
                    { key: 'canEdit', label: 'Éditer' },
                    { key: 'canTrack', label: 'Suivre' },
                    { key: 'canExecute', label: 'Exécuter' },
                    { key: 'canValidate', label: 'Valider' },
                    { key: 'canSign', label: 'E-Signature' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskRights[key as keyof GranularRights]}
                        onChange={(e) =>
                          setTaskRights({ ...taskRights, [key]: e.target.checked })
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
                >
                  Créer la Tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
