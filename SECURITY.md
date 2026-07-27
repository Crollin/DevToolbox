# Politique de sécurité

## Versions supportées

| Version | Supportée |
|---------|-----------|
| Dernière version sur `main` | ✅ |

Les versions antérieures ne reçoivent pas de correctifs de sécurité.

## Signaler une vulnérabilité

Si vous découvrez un problème de sécurité dans DevToolbox (app, API ou extension Raycast), **ne pas** ouvrir d’issue publique.

Envoyez un rapport via [GitHub Security Advisories](https://github.com/Crollin/DevToolbox/security/advisories/new) (recommandé) ou contactez le mainteneur en privé.

Incluez :

- Description du problème et impact potentiel
- Étapes pour reproduire
- Version / commit concerné, et mode de déploiement (Docker, local)

Nous nous engageons à accuser réception sous **72 heures** et à proposer un correctif ou un plan d’action dans les **30 jours** pour les vulnérabilités confirmées.

## Bonnes pratiques pour les self-hosters

- Définissez un **`JWT_SECRET` fort** (jamais la valeur de développement)
- Ne committez jamais `.env`, bases SQLite ni tokens
- Limitez l’exposition du port API ; préférez le reverse-proxy du frontend
- L’inscription (`POST /api/auth/register`) est ouverte par défaut : protégez l’instance (réseau, reverse-proxy, ou désactivation côté déploiement) si elle est publique
- Personal Access Tokens Raycast (`dt_…`) : scopes minimaux (`licences`, `tasks`, `knowledge_base`), révocation dès compromission
- Activez SMTP / canaux de notif uniquement avec des credentials dédiés et rotatifs

## Données sensibles

| Donnée | Emplacement typique | Sensibilité |
|--------|---------------------|-------------|
| JWT / sessions | Client + serveur | Élevée |
| PAT Raycast | Préférences Raycast + hash serveur | Élevée |
| SQLite | volume `data/` / `DB_PATH` | Élevée (comptes, licences, notes) |
| SMTP / Telegram / Ntfy | `.env` | Élevée |

Les secrets **ne doivent jamais** être présents dans le dépôt Git.
