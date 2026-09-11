import React, { useState } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  ShieldCheck, 
  Database,
  Sparkles
} from 'lucide-react';

interface LaravelArchitectureModalProps {
  onClose: () => void;
}

export const LaravelArchitectureModal: React.FC<LaravelArchitectureModalProps> = ({ onClose }) => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'migrations' | 'models' | 'middleware' | 'policies' | 'controller'>('migrations');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const snippets = {
    migrations: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. ORGANISATIONS (Entreprise, Établissement, ONG)
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['Entreprise', 'Etablissement', 'ONG'])->default('Entreprise');
            $table->string('legal_registration')->nullable();
            $table->string('headquarters')->nullable();
            $table->boolean('has_departments')->default(true);
            $table->boolean('has_directions')->default(true);
            $table->boolean('has_divisions')->default(true);
            $table->boolean('has_services')->default(true);
            $table->timestamps();
        });

        // 2. ENTITÉS HIÉRARCHIQUES (Département, Direction, Division, Service)
        Schema::create('entities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('type', ['Departement', 'Direction', 'Division', 'Service']);
            $table->foreignId('parent_entity_id')->nullable()->constrained('entities')->nullOnDelete();
            $table->text('description')->nullable();
            $table->foreignId('manager_user_id')->nullable();
            $table->timestamps();
        });

        // 3. UTILISATEURS & AGENTS
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('matricule')->unique();
            $table->enum('role', [
                'DG', 'PDG', 'DGA', 
                'CHEF_DEPARTEMENT', 
                'DIRECTEUR', 
                'CHEF_DIVISION', 
                'CHEF_SERVICE', 
                'AGENT',
                'RESPONSABLE_SECURITE'
            ])->default('AGENT');
            $table->foreignId('entity_id')->nullable()->constrained('entities')->nullOnDelete();
            $table->boolean('is_locked')->default(false);
            $table->boolean('is_revoked')->default(false);
            $table->integer('failed_intrusion_attempts')->default(0);
            $table->string('phone')->nullable();
            $table->string('password');
            $table->timestamps();
        });

        // 4. DOCUMENTS GED EN WORKFLOW
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('title');
            $table->enum('category', ['FINANCES_COMPTABILITE', 'LOGISTIQUE_COMMERCIALE', 'RESSOURCES_HUMAINES']);
            $table->string('document_type'); // Factures, Bilans, Bulletins de paie, etc.
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->foreignId('author_id')->constrained('users');
            $table->foreignId('entity_id')->constrained('entities'); // Entité émettrice
            $table->foreignId('target_agent_id')->nullable()->constrained('users'); // Règle stricte Bulletin de Paie
            $table->enum('confidentiality', ['Public', 'Interne', 'Confidentiel', 'Tres_Secret'])->default('Interne');
            $table->enum('status', ['Brouillon', 'En_validation', 'Valide', 'Rejete', 'Archive'])->default('En_validation');
            $table->json('target_entity_ids')->nullable(); // Entités génériques cibles
            $table->json('rights_matrix')->nullable(); // canView, canOpen, canEdit, canTrack, canExecute, canValidate, canSign
            $table->string('file_path')->nullable();
            $table->timestamps();
        });

        // 5. SIGNATURES ÉLECTRONIQUES CERTIFIÉES (SHA-256)
        Schema::create('e_signatures', function (Blueprint $table) {
            $table->id();
            $table->morphs('signable'); // polymorphic: Document ou Task
            $table->foreignId('user_id')->constrained('users');
            $table->string('signer_name');
            $table->string('signer_role');
            $table->string('certificate_hash'); // Empreinte SHA-256
            $table->text('signature_data')->nullable(); // Canvas SVG/PNG
            $table->string('comments')->nullable();
            $table->timestamp('signed_at');
        });

        // 6. INCIDENTS DE SÉCURITÉ & INTRUSION INTER-ENTITÉS
        Schema::create('security_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('attempted_entity_id')->constrained('entities');
            $table->string('ip_address');
            $table->integer('attempt_count')->default(1);
            $table->enum('status', ['ALERTE_ENVOYEE', 'COMPTE_VERROUILLE', 'CONVOCATION_GENEREE', 'RESOLU']);
            $table->boolean('is_locked')->default(false);
            $table->json('notified_emails')->nullable(); // DG et Manager
            $table->json('summons_data')->nullable(); // Détails de convocation formelle
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_incidents');
        Schema::dropIfExists('e_signatures');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('users');
        Schema::dropIfExists('entities');
        Schema::dropIfExists('organizations');
    }
};`,

    models: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\MorphMany;

class Entity extends Model
{
    protected $fillable = [
        'organization_id', 'name', 'code', 'type', 
        'parent_entity_id', 'description', 'manager_user_id'
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'parent_entity_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Entity::class, 'parent_entity_id');
    }

    /**
     * Récupère récursivement tous les sous-paliers (descendants)
     */
    public function getAllDescendantIds(): array
    {
        $ids = [$this->id];
        foreach ($this->children as $child) {
            $ids = array_merge($ids, $child->getAllDescendantIds());
        }
        return $ids;
    }
}

class User extends Model
{
    protected $fillable = [
        'name', 'email', 'matricule', 'role', 
        'entity_id', 'is_locked', 'is_revoked', 
        'failed_intrusion_attempts', 'phone', 'password'
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'is_revoked' => 'boolean',
    ];

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function isSuperUserGlobal(): bool
    {
        return in_array($this->role, ['DG', 'PDG', 'DGA']);
    }

    public function canAccessEntity(Entity $targetEntity): bool
    {
        if ($this->isSuperUserGlobal() || $this->role === 'RESPONSABLE_SECURITE') {
            return true;
        }
        if (!$this->entity_id) {
            return false;
        }
        if ($this->entity_id === $targetEntity->id) {
            return true;
        }

        // Vérification de la descendance hiérarchique
        $descendants = $this->entity->getAllDescendantIds();
        return in_array($targetEntity->id, $descendants);
    }
}`,

    middleware: `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use App\\Models\\SecurityIncident;
use App\\Models\\User;
use App\\Notifications\\IntrusionAlertNotification;
use Illuminate\\Support\\Facades\\Notification;

class CheckEntityAccessMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // 1. Vérification si le compte est déjà verrouillé
        if ($user->is_locked) {
            return response()->json([
                'error' => 'COMPTE_VERROUILLE',
                'message' => 'Votre compte est verrouillé pour violation de sécurité. Vous êtes convoqué devant la Direction Générale et le Responsable Sécurité.',
            ], 403);
        }

        // 2. Détection d'entité demandée
        $targetEntityId = $request->route('entity_id') ?? $request->input('entity_id');

        if ($targetEntityId && !$user->canAccessEntityById($targetEntityId)) {
            // INCURSION NON AUTORISÉE DÉTECTÉE !
            $user->increment('failed_intrusion_attempts');
            $attemptCount = $user->failed_intrusion_attempts;

            $isLockTriggered = ($attemptCount >= 2); // Verrouillage dès récidive

            if ($isLockTriggered) {
                $user->update(['is_locked' => true]);
            }

            // Enregistrement de l'incident d'audit
            $incident = SecurityIncident::create([
                'user_id' => $user->id,
                'attempted_entity_id' => $targetEntityId,
                'ip_address' => $request->ip(),
                'attempt_count' => $attemptCount,
                'status' => $isLockTriggered ? 'COMPTE_VERROUILLE' : 'ALERTE_ENVOYEE',
                'is_locked' => $isLockTriggered,
            ]);

            // Notification immédiate au DG et au Responsable de l'entité visée
            $dgUsers = User::whereIn('role', ['DG', 'PDG', 'DGA'])->get();
            $targetManager = User::where('entity_id', $targetEntityId)->where('role', '!=', 'AGENT')->get();

            Notification::send($dgUsers->merge($targetManager), new IntrusionAlertNotification($incident, $user));

            return response()->json([
                'error' => 'ACCES_INTERDIT_ALERTE_DECLENCHEE',
                'message' => 'Tentative d\'accès non autorisé inter-entité enregistrée. Une alerte a été transmise au DG et au responsable d\'entité.',
                'is_locked' => $isLockTriggered,
            ], 403);
        }

        return $next($request);
    }
}`,

    policies: `<?php

namespace App\\Policies;

use App\\Models\\Document;
use App\\Models\\User;

class DocumentPolicy
{
    /**
     * Règle d'autorisation de consultation de document
     */
    public function view(User $user, Document $document): bool
    {
        // RÈGLE STRICTE BULLETIN DE PAIE :
        // Seul l'agent concerné, le DR (Directeur RH) et le Service Paie peuvent voir le bulletin de paie.
        if ($document->document_type === 'Bulletins de paie') {
            if ($user->id === $document->target_agent_id) return true;
            if ($user->isSuperUserGlobal()) return true;
            if ($user->entity && in_array($user->entity->code, ['SRV-PAIE', 'DIR-RH', 'DRHJ', 'DIV-PAIE'])) {
                return true;
            }
            return false;
        }

        // Le DG, PDG, DGA VOIT TOUT DANS LE SYSTÈME
        if ($user->isSuperUserGlobal()) {
            return true;
        }

        // Si l'utilisateur est l'auteur
        if ($user->id === $document->author_id) {
            return true;
        }

        // Contrôle de portée hiérarchique (Département -> Direction -> Division -> Service)
        $userScope = $user->entity->getAllDescendantIds();
        $targetEntities = $document->target_entity_ids ?? [];

        return count(array_intersect($userScope, $targetEntities)) > 0 
            || in_array($document->entity_id, $userScope);
    }

    public function sign(User $user, Document $document): bool
    {
        // Seuls les postes de direction ou chefs habilités peuvent apposer l'e-signature
        if ($user->isSuperUserGlobal()) return true;
        if (in_array($user->role, ['CHEF_DEPARTEMENT', 'DIRECTEUR', 'CHEF_DIVISION', 'CHEF_SERVICE'])) {
            return $user->canAccessEntity($document->entity);
        }
        return false;
    }
}`,

    controller: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Document;
use App\\Models\\ESignature;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Auth;

class DocumentWorkflowController extends Controller
{
    public function sign(Request $request, Document $document)
    {
        $this->authorize('sign', $document);

        $user = Auth::user();

        // Calcul de l'empreinte cryptographique SHA-256 certifiée
        $payload = json_encode([
            'document_id' => $document->id,
            'reference' => $document->reference,
            'signer_id' => $user->id,
            'signer_role' => $user->role,
            'timestamp' => now()->toIso8601String(),
            'amount' => $document->amount,
        ]);
        $certificateHash = hash('sha256', $payload);

        $signature = ESignature::create([
            'signable_type' => Document::class,
            'signable_id' => $document->id,
            'user_id' => $user->id,
            'signer_name' => $user->name,
            'signer_role' => $user->role,
            'certificate_hash' => $certificateHash,
            'signature_data' => $request->input('signature_svg'),
            'comments' => $request->input('comments', 'Visa d\'approbation et certification'),
            'signed_at' => now(),
        ]);

        $document->update([
            'status' => 'Valide',
            'workflow_step' => 'Visé et Scellé par ' . $user->role,
        ]);

        return response()->json([
            'message' => 'Document signé électroniquement avec succès.',
            'certificate_hash' => $certificateHash,
            'signature' => $signature,
        ]);
    }
}`,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-slate-100 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-800 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Spécification & Code Laravel 11 Backend</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Migrations, Models Eloquent avec récursion hiérarchique, Middleware anti-intrusion et Policies.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-3 border-b border-slate-800 text-xs font-semibold">
          {[
            { id: 'migrations', label: '1. Migrations BD' },
            { id: 'models', label: '2. Models & Récursion' },
            { id: 'middleware', label: '3. Middleware Anti-Intrusion' },
            { id: 'policies', label: '4. Policies & Bulletins Paie' },
            { id: 'controller', label: '5. Controller & E-Signature' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSnippetTab(t.id as any)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition ${
                activeSnippetTab === t.id
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-mono text-[11px]">
              {activeSnippetTab === 'migrations' && 'database/migrations/2024_09_01_create_enterprise_workflow_tables.php'}
              {activeSnippetTab === 'models' && 'app/Models/Entity.php & app/Models/User.php'}
              {activeSnippetTab === 'middleware' && 'app/Http/Middleware/CheckEntityAccessMiddleware.php'}
              {activeSnippetTab === 'policies' && 'app/Policies/DocumentPolicy.php'}
              {activeSnippetTab === 'controller' && 'app/Http/Controllers/DocumentWorkflowController.php'}
            </span>

            <button
              onClick={() => handleCopy(snippets[activeSnippetTab], activeSnippetTab)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] transition"
            >
              {copiedKey === activeSnippetTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copier le Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 p-4 overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed">
            <code>{snippets[activeSnippetTab]}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Compatible Laravel 10.x et Laravel 11.x avec PHP 8.2+</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Fermer la Fenêtre
          </button>
        </div>

      </div>
    </div>
  );
};
