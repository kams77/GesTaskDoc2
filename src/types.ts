export type OrganizationType = 'Entreprise' | 'Etablissement' | 'ONG';

export type EntityType = 'Departement' | 'Direction' | 'Division' | 'Service';

export type UserRole = 
  | 'DG' 
  | 'PDG' 
  | 'DGA' 
  | 'CHEF_DEPARTEMENT' 
  | 'DIRECTEUR' 
  | 'CHEF_DIVISION' 
  | 'CHEF_SERVICE' 
  | 'AGENT'
  | 'RESPONSABLE_SECURITE';

export type ConfidentialityLevel = 'Public' | 'Interne' | 'Confidentiel' | 'Tres_Secret';

export interface Entity {
  id: string;
  name: string;
  code: string;
  type: EntityType;
  parentEntityId?: string; // Direction connects to Departement, Division connects to Direction, Service connects to Division
  description: string;
  managerUserId?: string;
  iconName?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  matricule: string;
  role: UserRole;
  title: string;
  entityId?: string; // undefined for DG/PDG/DGA who have global access
  isLocked: boolean;
  isRevoked: boolean;
  failedIntrusionAttempts: number;
  phone?: string;
  avatar?: string;
  joinedDate: string;
}

export interface GranularRights {
  canView: boolean;      // Voir
  canOpen: boolean;      // Ouvrir
  canEdit: boolean;      // Éditer
  canTrack: boolean;     // Suivre
  canExecute: boolean;   // Exécuter
  canValidate: boolean;  // Valider
  canSign: boolean;      // E-Signature
}

export type DocumentCategory = 
  | 'FINANCES_COMPTABILITE' 
  | 'LOGISTIQUE_COMMERCIALE' 
  | 'RESSOURCES_HUMAINES';

export interface DocumentItem {
  id: string;
  reference: string;
  title: string;
  category: DocumentCategory;
  documentType: string;
  description: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  entityId: string; // Origin entity
  targetEntityIds: string[]; // Generic entities allowed
  targetAgentId?: string; // For bulletins de paie: strictly private to this agent
  confidentiality: ConfidentialityLevel;
  amount?: number;
  status: 'Brouillon' | 'En validation' | 'Valide' | 'Rejete' | 'Archive';
  createdAt: string;
  fileSize: string;
  fileFormat: string;
  permissions: {
    targetRoles: UserRole[];
    rights: GranularRights;
  };
  signatures: ESignatureRecord[];
  workflowStep: string;
  history: AuditLogEntry[];
}

export type TaskType = 
  | 'APPROBATION' 
  | 'PRODUCTION' 
  | 'SUIVI_CLIENT' 
  | 'PROJET';

export interface TaskWorkflow {
  id: string;
  code: string;
  title: string;
  taskType: TaskType;
  description: string;
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente';
  status: 'A_faire' | 'En_cours' | 'En_revue' | 'Termine' | 'Bloque';
  creatorId: string;
  creatorRole: UserRole;
  creatorEntityId?: string;
  targetEntityIds: string[];
  assignedAgentIds: string[];
  dueDate: string;
  progress: number;
  rights: GranularRights;
  raci: {
    responsibleId: string; // R - Exécutant principal
    accountableId: string; // A - Décideur / Approbateur
    consultedIds: string[]; // C - Consultés
    informedIds: string[]; // I - Informés
  };
  signatures: ESignatureRecord[];
  notes?: string;
  createdAt: string;
}

export interface ESignatureRecord {
  id: string;
  signerId: string;
  signerName: string;
  signerRole: UserRole;
  signerTitle: string;
  entityName: string;
  signatureDataUrl: string;
  certificateHash: string; // SHA-256 representation
  timestamp: string;
  comments?: string;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userEntityId?: string;
  userEntityName: string;
  attemptedEntityId: string;
  attemptedEntityName: string;
  ipAddress: string;
  attemptCount: number;
  status: 'ALERTE_ENVOYEE' | 'COMPTE_VERROUILLE' | 'CONVOCATION_GENAREE' | 'RESOLU';
  isAccountLocked: boolean;
  alertSentTo: string[]; // DG and manager of target entity
  summons?: DisciplinarySummons;
}

export interface DisciplinarySummons {
  summonsNumber: string;
  generatedDate: string;
  convokedUserId: string;
  convokedUserName: string;
  convokedUserRole: UserRole;
  convokedUserEntity: string;
  hearingDate: string;
  hearingTime: string;
  location: string;
  conveeneurs: {
    dgName: string;
    securityOfficerName: string;
    hierarchicalManagerName: string;
  };
  motif: string;
  legalNotice: string;
  status: 'Emise' | 'Accusé de réception' | 'Clôturée';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  entityName?: string;
  ip?: string;
}

export interface OrganizationConfig {
  id: string;
  name: string;
  type: OrganizationType;
  legalRegistration: string; // RCCM ou agrément
  headquarters: string;
  phone: string;
  email: string;
  hasDepartments: boolean;
  hasDirections: boolean;
  hasDivisions: boolean;
  hasServices: boolean;
  dgName: string;
  dgaName: string;
}
