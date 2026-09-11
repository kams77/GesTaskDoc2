import { Entity, User, DocumentItem, TaskWorkflow } from '../types';

/**
 * Returns all descendant entity IDs of a given entity (recursive)
 */
export function getDescendantEntityIds(entityId: string, allEntities: Entity[]): string[] {
  const result: string[] = [entityId];
  const children = allEntities.filter(e => e.parentEntityId === entityId);
  for (const child of children) {
    result.push(...getDescendantEntityIds(child.id, allEntities));
  }
  return result;
}

/**
 * Returns all ancestor entity IDs of a given entity (up to top)
 */
export function getAncestorEntityIds(entityId: string, allEntities: Entity[]): string[] {
  const result: string[] = [];
  let current = allEntities.find(e => e.id === entityId);
  while (current && current.parentEntityId) {
    result.push(current.parentEntityId);
    current = allEntities.find(e => e.id === current?.parentEntityId);
  }
  return result;
}

/**
 * Checks if a user has access to a specific entity based on hierarchical authority
 */
export function canUserAccessEntity(user: User, targetEntityId: string, allEntities: Entity[]): boolean {
  // DG, PDG, DGA, Responsable Sécurité have global access
  if (['DG', 'PDG', 'DGA', 'RESPONSABLE_SECURITE'].includes(user.role) || !user.entityId) {
    return true;
  }

  // Exact same entity
  if (user.entityId === targetEntityId) {
    return true;
  }

  // Sub-entities check: Chef de Dept, Directeur, Chef Division can access their children
  const userDescendantIds = getDescendantEntityIds(user.entityId, allEntities);
  if (userDescendantIds.includes(targetEntityId)) {
    return true;
  }

  return false;
}

/**
 * Filter documents accessible to the active user
 */
export function canUserViewDocument(user: User, doc: DocumentItem, allEntities: Entity[]): boolean {
  // Strict Confidentiality Rule for Bulletins de Paie
  if (doc.documentType === 'Bulletins de paie' || doc.category === 'RESSOURCES_HUMAINES' && doc.targetAgentId) {
    // Only the target agent, the DR (Dept RH or Dir RH), DG, or Service Paie can view
    if (user.id === doc.targetAgentId) return true;
    if (['DG', 'PDG', 'DGA'].includes(user.role)) return true;
    if (user.entityId === 'srv-paie' || user.entityId === 'div-admin-pers' || user.entityId === 'dir-rh' || user.entityId === 'dept-rh') {
      return true;
    }
    return false;
  }

  // DG / PDG / DGA see EVERYTHING
  if (['DG', 'PDG', 'DGA'].includes(user.role) || !user.entityId) {
    return true;
  }

  // If user is author
  if (doc.authorId === user.id) {
    return true;
  }

  // Check if document target entities overlap with user's accessible scope
  const accessibleEntityIds = getDescendantEntityIds(user.entityId, allEntities);
  
  // Also if document is assigned to user's entity or parent
  const isDocumentInScope = doc.targetEntityIds.some(targetId => 
    accessibleEntityIds.includes(targetId) || targetId === user.entityId
  ) || accessibleEntityIds.includes(doc.entityId);

  return isDocumentInScope;
}

/**
 * Filter tasks accessible to the active user
 */
export function canUserViewTask(user: User, task: TaskWorkflow, allEntities: Entity[]): boolean {
  // DG sees all
  if (['DG', 'PDG', 'DGA'].includes(user.role) || !user.entityId) {
    return true;
  }

  if (task.creatorId === user.id) return true;
  if (task.assignedAgentIds.includes(user.id)) return true;
  if (task.raci.responsibleId === user.id || task.raci.accountableId === user.id) return true;
  if (task.raci.consultedIds.includes(user.id) || task.raci.informedIds.includes(user.id)) return true;

  const accessibleEntityIds = getDescendantEntityIds(user.entityId, allEntities);
  const isInTargetEntities = task.targetEntityIds.some(id => accessibleEntityIds.includes(id) || id === user.entityId);

  return isInTargetEntities;
}

/**
 * Check which roles a user is authorized to create/manage in CRUD
 */
export function getCreatableRoles(user: User): { allowed: boolean; description: string } {
  if (['DG', 'PDG', 'DGA'].includes(user.role)) {
    return {
      allowed: true,
      description: 'Pouvoir Absolu : Création, modification et révocation de tout type d\'agent et responsable dans toute l\'organisation.',
    };
  }
  if (user.role === 'CHEF_DEPARTEMENT') {
    return {
      allowed: true,
      description: 'Gestion CRUD des agents et responsables des Directions, Divisions et Services de son Département.',
    };
  }
  if (user.role === 'DIRECTEUR') {
    return {
      allowed: true,
      description: 'Gestion CRUD des agents et responsables des Divisions et Services de sa Direction.',
    };
  }
  if (user.role === 'CHEF_DIVISION') {
    return {
      allowed: true,
      description: 'Gestion CRUD des agents et responsables des Services de sa Division.',
    };
  }
  if (user.role === 'CHEF_SERVICE') {
    return {
      allowed: true,
      description: 'Gestion CRUD des agents exécutants de son Service uniquement.',
    };
  }
  return {
    allowed: false,
    description: 'Agent Exécutant : Aucun droit de création d\'utilisateurs.',
  };
}

/**
 * Format currency in West African / Central African FCFA (or EUR)
 */
export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount);
}
