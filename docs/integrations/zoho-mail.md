# Zoho Mail Europe → Task Reminder

L’intégration relève les nouveaux mails entrants de Zoho Europe toutes les trois minutes. Elle analyse leur texte avec **Mistral via OpenRouter** par défaut. **DeepSeek Platform**, appelé directement avec sa propre clé, est sélectionnable comme alternative. Il n’y a aucun basculement automatique entre services ou modèles.

## Configuration serveur

Utiliser le runtime Node 20 du Dockerfile. Sauvegarder la base SQLite et les fichiers joints avant le déploiement : une migration rend les échéances des tâches facultatives en préservant les relations existantes.

Configurer ces variables sur le backend (elles sont transmises par `docker-compose.yml`) :

| Variable | Valeur |
|---|---|
| `MAIL_ENCRYPTION_KEY` | Clé aléatoire de 32 octets encodée en base64, générée avec `openssl rand -base64 32` |
| `MAIL_ADMIN_USER_IDS` | Identifiants utilisateurs DevToolbox autorisés à gérer l’IA, séparés par des virgules |
| `ZOHO_CLIENT_ID` | Identifiant de l’application serveur enregistrée dans la console API Zoho Europe |
| `ZOHO_CLIENT_SECRET` | Secret de cette application |
| `ZOHO_REDIRECT_URI` | `https://votre-toolbox.example/api/integrations/zoho/callback` |
| `FRONTEND_URL` | Origine publique de DevToolbox, utilisée pour le retour vers Mon compte |

L’identifiant utilisateur est disponible via `GET /api/auth/me` avec une session. Aucun administrateur n’est désigné implicitement : sans `MAIL_ADMIN_USER_IDS`, la configuration IA est inaccessible. Les PAT ne peuvent pas configurer l’intégration.

Conserver la clé de chiffrement séparément des sauvegardes de la base. Ne pas la remplacer sans procédure de migration : les clés API et les refresh tokens déjà chiffrés deviendraient illisibles. Après une perte de clé, reconfigurer les clés IA et reconnecter Zoho.

Dans la console Zoho **Europe**, créer une application serveur avec exactement l’URI de retour configurée. Les scopes utilisés sont `ZohoMail.accounts.READ`, `ZohoMail.folders.READ` et `ZohoMail.messages.READ`. Le code échange et renouvelle les jetons uniquement sur `accounts.zoho.eu`, et lit les messages sur `mail.zoho.eu`.

## Activation

1. Se connecter avec un utilisateur déclaré administrateur et ouvrir **Mon compte → Intégrations**.
2. Dans **Analyse IA des mails**, enregistrer la clé OpenRouter et le modèle `mistralai/mistral-small-2603`, puis **Enregistrer et tester OpenRouter**. Le test vérifie le catalogue, la prise en charge du schéma et une extraction synthétique sans échéance.
3. Facultativement, enregistrer la clé DeepSeek Platform et le modèle `deepseek-chat`, puis effectuer son test. Les modèles sont modifiables pour suivre les catalogues des fournisseurs.
4. Sélectionner le fournisseur actif et enregistrer. Un changement de clé ou de modèle invalide son test précédent ; les traitements attendent un test réussi du fournisseur actif.
5. Chaque utilisateur connecte sa boîte via **Connecter Zoho Mail (.eu)**. La boîte Zoho principale est sélectionnée (une boîte par utilisateur). La lecture des comptes, dossiers et métadonnées est vérifiée avant activation.
6. Configurer les exclusions d’expéditeurs/domaines et les associations aux clients déjà créés dans Task Reminder.
7. Consulter **Task Reminder → Mails Zoho · À vérifier** pour accepter/corriger ou rejeter les propositions, et consulter l’historique.

La localisation `.eu` concerne Zoho. OpenRouter utilise ici son endpoint standard, et DeepSeek son API directe : aucune résidence européenne de l’analyse n’est promise. L’analyse OpenRouter exige un endpoint compatible avec les sorties structurées et refusant la collecte des données (`data_collection: deny`).

## Comportement

- Seuls les mails reçus depuis la première activation de la boîte sont importés. Une réautorisation de la même boîte préserve cette date ; une déconnexion puis une nouvelle connexion repartent de la nouvelle activation.
- Tous les dossiers entrants, y compris personnalisés, sont parcourus ; spam, corbeille, brouillons, envoyés, boîte d’envoi et modèles sont exclus. Le statut lu/non lu ne sert pas de curseur et n’est jamais modifié.
- Les pages se recouvrent et sont parcourues jusqu’à la date d’activation pour repérer les déplacements entre dossiers. Ce choix privilégie la fiabilité pour une boîte personnelle ; le nombre d’appels augmente avec son historique depuis activation. Les limites Zoho sont signalées dans l’état de synchronisation.
- La file SQLite survit aux redémarrages. Le worker traite au plus 20 messages par boîte et par passage. Les erreurs sont réessayées avec délai croissant ; après cinq tentatives, **Réessayer** permet une reprise manuelle.
- Les messages gardent le fournisseur/modèle choisi lors de leur première tentative. Changer le fournisseur actif ne réanalyse pas les messages terminés.
- Une demande explicite produit une ou plusieurs tâches. Les ambiguïtés, contenu tronqué, échéances non justifiées et demandes dépendant d’une pièce jointe passent en vérification. Les dates relatives sont interprétées en `Europe/Paris` par rapport à la date du mail.
- Les clients viennent uniquement des associations configurées, pas d’une invention du modèle. La priorité normale est utilisée par défaut et toute autre priorité nécessite un extrait justificatif.
- Une relance reconnue peut être reliée à une tâche du même fil. Modifier une tâche ou la clôturer nécessite une acceptation humaine explicite.
- Les tâches sans échéance affichent **Sans échéance**. Les rappels relatifs sont désactivés ; un rappel à date/heure précise reste possible.
- Les identifiants du mail, son sujet et son expéditeur figurent dans les sources de la tâche. L’interface ouvre Zoho Mail ; elle n’invente pas d’URL profonde non documentée.

Le corps du mail reste en mémoire pendant le traitement et n’est pas conservé dans SQLite. La base garde les métadonnées, le résumé de la tâche et les citations des propositions à vérifier. Les clés sont chiffrées en AES-256-GCM et ne sont jamais renvoyées au navigateur. Les journaux d’erreur ne contiennent ni corps ni réponse brute d’un fournisseur.

## API

Toutes les routes exigent un JWT de session sauf le callback OAuth, protégé par un état à usage unique lié à l’utilisateur.

| Route | Action |
|---|---|
| `GET /api/integrations/zoho` | État sans jetons, capacité IA, droits d’administration |
| `POST /api/integrations/zoho/connect` | Retourne l’URL d’autorisation |
| `GET /api/integrations/zoho/callback` | Consomme l’état OAuth et connecte la boîte |
| `PUT /api/integrations/zoho` | `{ paused, mappings: [{ match, client }], exclusions: [] }` |
| `DELETE /api/integrations/zoho` | Supprime les jetons, annule les imports en attente, conserve les tâches |
| `GET /api/integrations/zoho/messages` | Historique des 100 derniers messages |
| `POST /api/integrations/zoho/messages/:id/retry` | Relance un traitement en échec de la boîte actuelle |
| `GET /api/integrations/zoho/proposals` | Les 100 premières propositions en attente, les suivantes apparaissant après traitement |
| `POST /api/integrations/zoho/proposals/:id/accept` | Accepte avec champs corrigés ; idempotent |
| `POST /api/integrations/zoho/proposals/:id/reject` | Rejette sans créer de tâche |
| `GET/PUT /api/integrations/mail-ai` | Configuration administrateur ; clés omises/vides conservées |
| `POST /api/integrations/mail-ai/test` | Test synthétique `{ provider: 'openrouter' | 'deepseek' }` |
| `GET /api/integrations/mail-ai/usage` | Tokens, coût déclaré en USD lorsqu’il est fourni, erreurs et appels cumulés |

`POST /api/tasks` et `PUT /api/tasks/:id` acceptent désormais `dueDate: null` ou une date omise. Le titre reste requis. Le frontend, le MCP et Raycast doivent être déployés avec cette version pour afficher correctement les dates nulles.

## Vérifications

Depuis la racine, lancer `npm test` et `npm run build`. Depuis `backend/`, avec Node 20, lancer `npm test` et `npm run build`. Vérifier également `npm run build` dans `mcp-task-reminder/` et `npx tsc --noEmit` dans `raycast/` pour contrôler les clients concernés par les échéances facultatives.

Les tests backend couvrent la migration, OAuth, la file et les décisions avec des réponses fournisseurs simulées. Les tests ne dépensent pas de crédits. Le bouton de test effectue un appel réel facturable sur un exemple synthétique et vérifie l’accès au modèle choisi. Il ne constitue pas une mesure exhaustive de qualité sur vos mails.

Avant de généraliser, examiner les premières tâches et exceptions sur le compte pilote. Aucune connexion réelle ni activation en production n’est effectuée par la simple installation du code. Les pièces jointes, réponses automatiques, webhooks et reprise historique sont hors de cette version.

### Évaluation IA facultative sur exemples annotés

`backend/src/__tests__/lib/mailAiEvaluation.test.ts` contient neuf exemples synthétiques français par fournisseur (actions multiples, dates relatives, ambiguïté, pièce jointe, destinataire tiers, tentative de détournement, etc.). Ces tests sont ignorés par défaut.

Pour les exécuter depuis `backend/`, définir `MAIL_AI_LIVE_TESTS=1` et la clé du fournisseur dans l’environnement (`OPENROUTER_API_KEY` et/ou `DEEPSEEK_API_KEY`), puis lancer `npm test -- src/__tests__/lib/mailAiEvaluation.test.ts`. `OPENROUTER_MODEL` et `DEEPSEEK_MODEL` permettent de choisir les modèles. Ces appels consomment les crédits des clés fournies ; aucun message de votre boîte n’est lu. Un échec d’évaluation doit être examiné avant généralisation du modèle.
