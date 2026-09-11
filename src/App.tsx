import React, { useState } from 'react';
import { 
  initialOrganization, 
  initialEntities, 
  initialUsers, 
  initialDocuments, 
  initialTasks, 
  initialSecurityIncidents 
} from './data/initialData';
import { 
  OrganizationConfig, 
  Entity, 
  User, 
  DocumentItem, 
  TaskWorkflow, 
  SecurityIncident, 
  ESignatureRecord,
  DisciplinarySummons 
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { OrganizationHierarchy } from './components/OrganizationHierarchy';
import { DocumentManager } from './components/DocumentManager';
import { WorkflowTaskManager } from './components/WorkflowTaskManager';
import { UserManagement } from './components/UserManagement';
import { SecurityCenter } from './components/SecurityCenter';
import { LaravelArchitectureModal } from './components/LaravelArchitectureModal';
import { canUserAccessEntity } from './utils/permissions';
import { Sparkles, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function App() {
  // Core Application State
  const [organization, setOrganization] = useState<OrganizationConfig>(initialOrganization);
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [tasks, setTasks] = useState<TaskWorkflow[]>(initialTasks);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>(initialSecurityIncidents);
  
  // Current active impersonated user (Default: Alexandre de Souza, DG)
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Modals
  const [showLaravelCode, setShowLaravelCode] = useState(false);
  const [showEnrichmentDetails, setShowEnrichmentDetails] = useState(true);

  // Switch User handler
  const handleSwitchUser = (selectedUser: User) => {
    // Keep user state in sync if updated
    const freshUser = users.find(u => u.id === selectedUser.id) || selectedUser;
    setCurrentUser(freshUser);
  };

  // Add Document
  const handleAddDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  // Sign Document
  const handleSignDocument = (docId: string, signature: ESignatureRecord) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            signatures: [signature, ...doc.signatures],
            status: 'Valide',
            workflowStep: `Visé et Scellé électroniquement par ${signature.signerName} (${signature.signerRole})`,
            history: [
              {
                id: `hist-${Date.now()}`,
                timestamp: signature.timestamp,
                userId: signature.signerId,
                userName: signature.signerName,
                userRole: signature.signerRole,
                action: 'E-Signature & Certification SHA-256',
                details: signature.comments || 'Signature électronique enregistrée.',
              },
              ...doc.history,
            ],
          };
        }
        return doc;
      })
    );
  };

  // Add Task
  const handleAddTask = (newTask: TaskWorkflow) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // Update Task Status & Progress
  const handleUpdateTaskStatus = (taskId: string, status: TaskWorkflow['status'], progress: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status, progress } : t))
    );
  };

  // Sign & Complete Task
  const handleSignTask = (taskId: string, signature: ESignatureRecord) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            signatures: [signature, ...t.signatures],
            status: 'Termine',
            progress: 100,
          };
        }
        return t;
      })
    );
  };

  // Add Entity
  const handleAddEntity = (newEntity: Entity) => {
    setEntities((prev) => [...prev, newEntity]);
  };

  // Delete Entity
  const handleDeleteEntity = (entityId: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  // Add User
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  // Toggle User Revocation
  const handleToggleRevoke = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isRevoked: !u.isRevoked } : u))
    );
  };

  // Toggle User Lock
  const handleToggleLock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isLocked: !u.isLocked,
            failedIntrusionAttempts: !u.isLocked ? u.failedIntrusionAttempts : 0,
          };
        }
        return u;
      })
    );
  };

  // Intrusion Simulation Engine
  const handleSimulateIntrusion = (agentId: string, targetEntityId: string) => {
    const agent = users.find((u) => u.id === agentId);
    const targetEntity = entities.find((e) => e.id === targetEntityId);
    if (!agent || !targetEntity) return;

    const sourceEntity = entities.find((e) => e.id === agent.entityId);
    const targetManager = users.find((u) => u.entityId === targetEntity.id && u.role !== 'AGENT');

    const nextAttempts = agent.failedIntrusionAttempts + 1;
    const shouldLock = nextAttempts >= 2; // Lock upon insistence

    // Update user attempt count & lock state
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === agent.id) {
          return {
            ...u,
            failedIntrusionAttempts: nextAttempts,
            isLocked: shouldLock ? true : u.isLocked,
          };
        }
        return u;
      })
    );

    // If current user is the one being locked, update active user object
    if (currentUser.id === agent.id) {
      setCurrentUser((prev) => ({
        ...prev,
        failedIntrusionAttempts: nextAttempts,
        isLocked: shouldLock ? true : prev.isLocked,
      }));
    }

    // Generate summons if locked
    let summons: DisciplinarySummons | undefined = undefined;
    if (shouldLock) {
      const hearingDateObj = new Date(Date.now() + 2 * 86400000);
      summons = {
        summonsNumber: `CONV-DISC-${Date.now().toString().slice(-4)}`,
        generatedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        convokedUserId: agent.id,
        convokedUserName: agent.name,
        convokedUserRole: agent.role,
        convokedUserEntity: sourceEntity?.name || 'Unité non définie',
        hearingDate: hearingDateObj.toISOString().split('T')[0],
        hearingTime: '10:00 GMT',
        location: 'Salle du Conseil & Sécurité - Tour Horizon, 14e étage',
        conveeneurs: {
          dgName: organization.dgName,
          securityOfficerName: 'Cdt. Robert Valéry (Responsable Sécurité)',
          hierarchicalManagerName: `${sourceEntity?.name || 'Direction'} & Chef Hiérarchique`,
        },
        motif: `Tentatives persistantes (${nextAttempts}x) et non autorisées d'accès aux registres et documents de l'entité [${targetEntity.name}].`,
        legalNotice: 'Article L-44 du Règlement Intérieur : Présence impérative sous peine de révocation immédiate.',
        status: 'Emise',
      };
    }

    // Create Incident Record
    const newIncident: SecurityIncident = {
      id: `sec-inc-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: agent.id,
      userName: agent.name,
      userRole: agent.role,
      userEntityId: agent.entityId,
      userEntityName: sourceEntity ? `${sourceEntity.name} (${sourceEntity.code})` : 'Direction',
      attemptedEntityId: targetEntity.id,
      attemptedEntityName: `${targetEntity.name} (${targetEntity.code})`,
      ipAddress: `192.168.10.${Math.floor(Math.random() * 150 + 20)}`,
      attemptCount: nextAttempts,
      status: shouldLock ? 'COMPTE_VERROUILLE' : 'ALERTE_ENVOYEE',
      isAccountLocked: shouldLock,
      alertSentTo: [
        `${organization.dgName} (Direction Générale)`,
        targetManager ? `${targetManager.name} (${targetManager.title})` : `Responsable ${targetEntity.code}`,
        ...(shouldLock ? ['Cdt. Robert Valéry (Responsable Sécurité)'] : []),
      ],
      summons,
    };

    setSecurityIncidents((prev) => [newIncident, ...prev]);
  };

  const unreadSecurityCount = securityIncidents.filter(
    (i) => i.status === 'ALERTE_ENVOYEE' || i.status === 'COMPTE_VERROUILLE'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        organization={organization}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        securityIncidents={securityIncidents}
        onOpenSecurity={() => setCurrentTab('security')}
        onOpenOrgConfig={() => setCurrentTab('organization')}
        onOpenLaravelCode={() => setShowLaravelCode(true)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          currentUser={currentUser}
          unreadSecurityCount={unreadSecurityCount}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 overflow-y-auto pb-12">
          
          {/* Enrichment Highlight Banner (As requested: "ET AJOUTE MOI CERTAINS PROPRIETES OU ELEMENTS MANQUANTE SUR MA NARRATION") */}
          {showEnrichmentDetails && (
            <div className="max-w-7xl mx-auto px-6 pt-5">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-indigo-950 font-bold block mb-1">
                        Éléments d'enrichissement & Propriétés ajoutées à votre narration :
                      </strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-indigo-900 mt-1">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Matrice RACI</strong> (Responsable, Approbateur, Consulté, Informé)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Signature Électronique</strong> certifiée avec empreinte SHA-256</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Stricte confidentialité</strong> Bulletins de Paie (Seul agent + DR + Paie)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Détection d'Intrusion & Verrouillage</strong> automatique après récidive</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Convocation formelle</strong> devant DG, Sécurité & Hiérarchie</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span><strong>Architecture & Code Laravel 11</strong> complets prêts à déployer</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowEnrichmentDetails(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-xs font-bold"
                    title="Masquer le récapitulatif"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab View */}
          {currentTab === 'dashboard' && (
            <DashboardOverview
              organization={organization}
              documents={documents}
              tasks={tasks}
              entities={entities}
              allUsers={users}
              currentUser={currentUser}
              securityIncidents={securityIncidents}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'organization' && (
            <OrganizationHierarchy
              organization={organization}
              onUpdateOrg={setOrganization}
              entities={entities}
              onAddEntity={handleAddEntity}
              onDeleteEntity={handleDeleteEntity}
              users={users}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentManager
              documents={documents}
              currentUser={currentUser}
              entities={entities}
              allUsers={users}
              onAddDocument={handleAddDocument}
              onSignDocument={handleSignDocument}
            />
          )}

          {currentTab === 'workflows' && (
            <WorkflowTaskManager
              tasks={tasks}
              currentUser={currentUser}
              entities={entities}
              allUsers={users}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onSignTask={handleSignTask}
            />
          )}

          {currentTab === 'users' && (
            <UserManagement
              allUsers={users}
              currentUser={currentUser}
              entities={entities}
              onAddUser={handleAddUser}
              onToggleRevoke={handleToggleRevoke}
              onToggleLock={handleToggleLock}
            />
          )}

          {currentTab === 'security' && (
            <SecurityCenter
              organization={organization}
              incidents={securityIncidents}
              allUsers={users}
              entities={entities}
              currentUser={currentUser}
              onSimulateIntrusion={handleSimulateIntrusion}
              onUnlockAccount={handleToggleLock}
            />
          )}

          {currentTab === 'laravel_arch' && (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-1">Architecture & Code Laravel 11 Backend</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Cliquez ci-dessous pour ouvrir l'explorateur de code Laravel 11 complet.
                </p>
                <button
                  onClick={() => setShowLaravelCode(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow"
                >
                  Ouvrir le Générateur de Code Laravel 11
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Laravel Architecture Code Modal */}
      {showLaravelCode && (
        <LaravelArchitectureModal onClose={() => setShowLaravelCode(false)} />
      )}

    </div>
  );
}
