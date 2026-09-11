import React, { useState } from 'react';
import { 
  DocumentItem, 
  DocumentCategory, 
  User, 
  Entity, 
  ConfidentialityLevel, 
  GranularRights,
  ESignatureRecord 
} from '../types';
import { canUserViewDocument, formatCurrency } from '../utils/permissions';
import { 
  FolderGit2, 
  FileText, 
  Plus, 
  Search, 
  ShieldCheck, 
  Lock, 
  Eye, 
  FileCheck2, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  PenTool, 
  Filter,
  UserCheck,
  Building,
  KeyRound,
  FileSignature
} from 'lucide-react';

interface DocumentManagerProps {
  documents: DocumentItem[];
  currentUser: User;
  entities: Entity[];
  allUsers: User[];
  onAddDocument: (doc: DocumentItem) => void;
  onSignDocument: (docId: string, signature: ESignatureRecord) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  currentUser,
  entities,
  allUsers,
  onAddDocument,
  onSignDocument,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentItem | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState<DocumentItem | null>(null);
  const [signaturePadComment, setSignaturePadComment] = useState('');

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('FINANCES_COMPTABILITE');
  const [newType, setNewType] = useState('Factures clients');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState<number | undefined>(undefined);
  const [newConfidentiality, setNewConfidentiality] = useState<ConfidentialityLevel>('Interne');
  const [newTargetEntityIds, setNewTargetEntityIds] = useState<string[]>([]);
  const [newTargetAgentId, setNewTargetAgentId] = useState<string>('');
  const [rights, setRights] = useState<GranularRights>({
    canView: true,
    canOpen: true,
    canEdit: false,
    canTrack: true,
    canExecute: false,
    canValidate: true,
    canSign: true,
  });

  // Document types dictionary based on user specification
  const documentTypeMap: Record<DocumentCategory, { section: string; types: string[] }[]> = {
    FINANCES_COMPTABILITE: [
      { section: 'Factures', types: ['Factures clients', 'Factures fournisseurs', 'Avoirs'] },
      { section: 'Rapports financiers', types: ['Bilans comptables', 'Comptes de résultat', 'Budgets'] },
      { section: 'Pièces justificatives', types: ['Reçus fiscaux', 'Notes de frais', 'Relevés bancaires'] },
    ],
    LOGISTIQUE_COMMERCIALE: [
      { section: 'Documents de vente', types: ['Devis', 'Bons de commande clients', 'Contrats commerciaux'] },
      { section: 'Documents logistiques', types: ['Bons de livraison', 'Bons de réception', 'Ordres de préparation de commande'] },
      { section: 'Gestion des stocks', types: ['Fiches articles', 'Inventaires physiques', 'Alertes de rupture de stock'] },
      { section: 'Achats', types: ['Demandes d\'achat', 'Bons de commande fournisseurs'] },
    ],
    RESSOURCES_HUMAINES: [
      { section: 'Dossiers collaborateurs', types: ['Contrats de travail', 'Avenants', 'Fiches de poste'] },
      { section: 'Paie et temps', types: ['Bulletins de paie', 'Feuilles de temps (timesheets)', 'Soldes de congés'] },
      { section: 'Évaluations', types: ['Comptes rendus d\'entretiens annuels', 'Plans de formation'] },
    ],
  };

  // Filter accessible documents for current user
  const accessibleDocuments = documents.filter((doc) =>
    canUserViewDocument(currentUser, doc, entities)
  );

  const filteredDocuments = accessibleDocuments.filter((doc) => {
    if (selectedCategory !== 'ALL' && doc.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.reference.toLowerCase().includes(q) ||
        doc.documentType.toLowerCase().includes(q) ||
        doc.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Check if current user can sign the document
  const canUserSign = (doc: DocumentItem) => {
    if (doc.status === 'Valide' && doc.signatures.some(s => s.signerId === currentUser.id)) {
      return false; // Already signed by this user
    }
    // High hierarchy or author or target validator
    if (['DG', 'PDG', 'DGA'].includes(currentUser.role)) return true;
    if (currentUser.role === 'CHEF_DEPARTEMENT') return true;
    if (currentUser.role === 'DIRECTEUR') return true;
    if (currentUser.role === 'CHEF_SERVICE' && doc.entityId === currentUser.entityId) return true;
    return false;
  };

  const handleExecuteSignature = (doc: DocumentItem) => {
    const newSignature: ESignatureRecord = {
      id: `sig-${Date.now()}`,
      signerId: currentUser.id,
      signerName: currentUser.name,
      signerRole: currentUser.role,
      signerTitle: currentUser.title,
      entityName: entities.find(e => e.id === currentUser.entityId)?.name || 'Direction Générale',
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50"><path d="M10,35 Q40,5 80,35 T150,20" stroke="%231e40af" stroke-width="2.5" fill="none"/></svg>',
      certificateHash: Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comments: signaturePadComment || 'Visa d\'approbation numérique certifié',
    };

    onSignDocument(doc.id, newSignature);
    setShowSignatureModal(null);
    setSignaturePadComment('');
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const generatedRef = newRef.trim() || `DOC-${newCategory.substring(0, 3)}-${Date.now().toString().slice(-4)}`;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      reference: generatedRef,
      title: newTitle,
      category: newCategory,
      documentType: newType,
      description: newDesc,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      entityId: currentUser.entityId || entities[0]?.id || 'dept-fin',
      targetEntityIds: newTargetEntityIds.length > 0 ? newTargetEntityIds : [currentUser.entityId || 'dept-fin'],
      targetAgentId: newType === 'Bulletins de paie' ? newTargetAgentId : undefined,
      confidentiality: newConfidentiality,
      amount: newAmount,
      status: 'En validation',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileSize: '1.2 MB',
      fileFormat: 'PDF/A',
      permissions: {
        targetRoles: ['DG', 'CHEF_DEPARTEMENT', 'DIRECTEUR', 'CHEF_DIVISION', 'CHEF_SERVICE', 'AGENT'],
        rights: { ...rights },
      },
      signatures: [],
      workflowStep: 'Circuit de visa ouvert',
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Dépôt du Document',
          details: `Création du document type ${newType}`,
        },
      ],
    };

    onAddDocument(newDoc);
    setShowUploadModal(false);
    setNewTitle('');
    setNewRef('');
    setNewDesc('');
    setNewAmount(undefined);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">GED & Gestion Documentaire en Workflow</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Module 1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publication sécurisée, filtres hiérarchiques stricts et circuit d'E-signature certifiée.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Publier un Document</span>
        </button>
      </div>

      {/* Strict Confidentiality Rule Warning Box for Payroll */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
        <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Contrainte d'habilitation spécifique aux Bulletins de Paie :</strong>
          <span className="text-amber-800 ml-1">
            Conformément à la politique RH, lorsqu'un bulletin de paie est publié, 
            <strong> seuls l'agent concerné, le Directeur RH (DR) et le Service Paie</strong> y ont accès. 
            Tous les autres utilisateurs (même Chefs de service externes ou agents d'autres services) sont strictement exclus du visonnage.
          </span>
        </div>
      </div>

      {/* Filter Tabs by Category */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tous les Documents ({accessibleDocuments.length})
          </button>
          <button
            onClick={() => setSelectedCategory('FINANCES_COMPTABILITE')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              selectedCategory === 'FINANCES_COMPTABILITE'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Finances & Comptabilité
          </button>
          <button
            onClick={() => setSelectedCategory('LOGISTIQUE_COMMERCIALE')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              selectedCategory === 'LOGISTIQUE_COMMERCIALE'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Logistique & Commerciale
          </button>
          <button
            onClick={() => setSelectedCategory('RESSOURCES_HUMAINES')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              selectedCategory === 'RESSOURCES_HUMAINES'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ressources Humaines (RH)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher référence, titre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Document Grid / Table */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Aucun document accessible</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Aucun document ne correspond à vos filtres ou à votre habilitation hiérarchique ({currentUser.role}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const hasSigned = doc.signatures.length > 0;
            const isPayroll = doc.documentType === 'Bulletins de paie';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status Bar */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {doc.reference}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {isPayroll && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center">
                          <Lock className="w-2.5 h-2.5 mr-1" /> RH Privé
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === 'Valide'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Document Type */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {doc.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.documentType}</span>
                  </div>

                  {/* Amount if financial */}
                  {doc.amount !== undefined && (
                    <div className="mt-2 text-xs font-bold text-slate-800">
                      Montant : <span className="text-blue-600">{formatCurrency(doc.amount)}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {doc.description}
                  </p>

                  {/* Signatures status */}
                  {hasSigned ? (
                    <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center space-x-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div className="text-[11px] text-emerald-900">
                        <span className="font-bold">E-Signature certifiée</span>
                        <div className="text-[10px] text-emerald-700">
                          Signé par {doc.signatures[0].signerName} ({doc.signatures[0].signerRole})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-[11px] text-slate-500">{doc.workflowStep}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Auteur : <strong>{doc.authorName}</strong>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedDocForDetail(doc)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Consulter</span>
                    </button>

                    {canUserSign(doc) && (
                      <button
                        onClick={() => setShowSignatureModal(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center space-x-1 shadow-sm"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Viser / Signer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL WITH AUDIT TRAIL AND RIGHTS */}
      {selectedDocForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {selectedDocForDetail.reference}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedDocForDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Type de Document</span>
                  <span className="text-slate-800 font-bold">{selectedDocForDetail.documentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Classification</span>
                  <span className="text-slate-800 font-bold">{selectedDocForDetail.confidentiality}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Auteur & Habilitation</span>
                  <span className="text-slate-800 font-medium">
                    {selectedDocForDetail.authorName} ({selectedDocForDetail.authorRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Date de Dépôt</span>
                  <span className="text-slate-800 font-mono">{selectedDocForDetail.createdAt}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-700 font-bold block mb-1">Description & Contenu</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                  {selectedDocForDetail.description}
                </p>
              </div>

              {/* Granular Rights Matrix Display */}
              <div>
                <span className="text-slate-700 font-bold block mb-1">
                  Matrice des Droits Granulaires Assignés
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-[10px]">
                  {Object.entries(selectedDocForDetail.permissions.rights).map(([key, val]) => (
                    <div
                      key={key}
                      className={`p-2 rounded-lg border font-semibold ${
                        val ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div>{key.replace('can', '')}</div>
                      <div className="mt-1 font-bold">{val ? 'OUI' : 'NON'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures List */}
              {selectedDocForDetail.signatures.length > 0 && (
                <div>
                  <span className="text-slate-700 font-bold block mb-1.5">
                    Certificat de Signature Électronique
                  </span>
                  {selectedDocForDetail.signatures.map((sig) => (
                    <div key={sig.id} className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start space-x-3">
                      <FileSignature className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{sig.signerName}</span>
                          <span className="font-mono text-[10px] text-blue-700">{sig.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{sig.signerTitle} · {sig.entityName}</p>
                        <p className="text-[11px] text-slate-700 italic mt-1">"{sig.comments}"</p>
                        <div className="mt-2 text-[9px] font-mono text-slate-400 bg-white p-1 rounded border border-blue-100 break-all">
                          SHA-256: {sig.certificateHash}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-SIGNATURE MODAL */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <PenTool className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Apposition de l'E-Signature</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              En signant ce document, vous certifiez formellement son visa et son entrée en vigueur dans le workflow.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-4">
              <div className="font-bold text-slate-800">{showSignatureModal.title}</div>
              <div className="text-slate-500 text-[11px] font-mono mt-0.5">{showSignatureModal.reference}</div>
            </div>

            {/* Simulated Digital Pad */}
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center bg-blue-50/20 mb-3">
              <div className="font-serif italic text-blue-800 text-2xl tracking-wide select-none py-2">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 border-t border-blue-200/60 pt-1">
                Certificat Cryptographique · Rôle : {currentUser.role} · Horodatage Automatique
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Commentaire ou Mention Particulière
              </label>
              <input
                type="text"
                placeholder="Ex: Bon à payer après rapprochement / Validé sans réserve"
                value={signaturePadComment}
                onChange={(e) => setSignaturePadComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSignatureModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleExecuteSignature(showSignatureModal)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
              >
                Signer & Sceller (SHA-256)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD / PUBLICATION MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Publier un Nouveau Document</h3>
            <p className="text-xs text-slate-500 mb-4">
              Classification selon la typologie institutionnelle et assignation des permissions granulaires.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Catégorie Institutionnelle
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'FINANCES_COMPTABILITE', label: 'Finances & Compta' },
                    { id: 'LOGISTIQUE_COMMERCIALE', label: 'Logistique & Vente' },
                    { id: 'RESSOURCES_HUMAINES', label: 'Ressources Humaines' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setNewCategory(cat.id as DocumentCategory);
                        setNewType(documentTypeMap[cat.id as DocumentCategory][0].types[0]);
                      }}
                      className={`py-2 px-2.5 rounded-xl border font-semibold text-[11px] text-center transition ${
                        newCategory === cat.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Document Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Type Précis de Document
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {documentTypeMap[newCategory].map((sec) => (
                      <optgroup key={sec.section} label={`── ${sec.section} ──`}>
                        {sec.types.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Niveau de Confidentialité
                  </label>
                  <select
                    value={newConfidentiality}
                    onChange={(e) => setNewConfidentiality(e.target.value as ConfidentialityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Interne">Usage Interne</option>
                    <option value="Confidentiel">Confidentiel (Restreint)</option>
                    <option value="Tres_Secret">Très Secret (Haute Direction)</option>
                    <option value="Public">Public (Diffusion Libre)</option>
                  </select>
                </div>
              </div>

              {/* If Payroll: select the strictly targeted agent */}
              {newType === 'Bulletins de paie' && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                  <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                    Collaborateur Bénéficiaire (Règle stricte Bulletin de Paie)
                  </label>
                  <select
                    value={newTargetAgentId}
                    onChange={(e) => setNewTargetAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs font-semibold"
                    required
                  >
                    <option value="">Sélectionnez l'agent titulaire du bulletin...</option>
                    {allUsers.filter(u => u.role === 'AGENT').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} · {u.matricule} ({u.title})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-purple-700 mt-1">
                    Conformité stricte : seul ce collaborateur, le DR et le service paie pourront le consulter.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Intitulé du Document
                </label>
                <input
                  type="text"
                  placeholder="Ex: Facture Fournisseur N° 2024-892"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Référence Interne (Facultatif)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-généré si vide"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Montant Financier (Si applicable)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 15000000"
                    value={newAmount ?? ''}
                    onChange={(e) => setNewAmount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description / Objet du Document
                </label>
                <textarea
                  rows={2}
                  placeholder="Détails du document ou pièces jointes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Granular Rights Checklist: Voir, Ouvrir, Éditer, Suivre, Exécuter, Valider, E-Signature */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Droits & Habilitations Granulaires Applicables
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'canView', label: 'Voir' },
                    { key: 'canOpen', label: 'Ouvrir' },
                    { key: 'canEdit', label: 'Éditer' },
                    { key: 'canTrack', label: 'Suivre' },
                    { key: 'canExecute', label: 'Exécuter' },
                    { key: 'canValidate', label: 'Valider' },
                    { key: 'canSign', label: 'Mettre E-Signature' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rights[key as keyof GranularRights]}
                        onChange={(e) =>
                          setRights({ ...rights, [key]: e.target.checked })
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
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow"
                >
                  Publier dans le Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
