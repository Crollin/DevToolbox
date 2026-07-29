# Notifications Telegram

DevToolbox peut envoyer des notifications via un **bot Telegram** : rappels de tâches, licences expirantes, domaines à renouveler.

## Prérequis

- Un compte Telegram
- Un accès au serveur backend (pour la variable d'environnement)

## 1. Créer le bot Telegram

1. Ouvrez Telegram et cherchez **@BotFather**
2. Envoyez `/newbot`
3. Choisissez un nom (ex: `DevToolbox Notifications`) et un username (ex: `devtoolbox_notif_bot`)
4. BotFather vous donne un **token** du type :
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. Conservez ce token, il sera nécessaire à l'étape suivante

## 2. Configurer le serveur

Ajoutez le token dans le fichier `.env` du backend :

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

Redémarrez le backend pour prendre en compte la variable.

> Le backend vérifie la présence de `TELEGRAM_BOT_TOKEN` pour activer le canal Telegram. Sans cette variable, l'option apparaît comme "bot Telegram non configuré" dans l'interface.

## 3. Obtenir votre Chat ID

1. Ouvrez Telegram et cherchez **@userinfobot**
2. Envoyez-lui `/start`
3. Il vous répond avec votre **Chat ID** (un nombre, ex: `1004494597025`)

> **Important** : envoyez aussi un message `/start` à votre bot pour qu'il ait la permission de vous écrire. Sans cela, les notifications échoueront silencieusement.

## 4. Activer dans DevToolbox

1. Connectez-vous à DevToolbox
2. Allez sur **Mon compte** (icône utilisateur en haut à droite)
3. Onglet **Notifications**
4. Cochez le canal **Telegram**
5. Dans la section "Configuration Telegram" qui apparaît, entrez votre **Chat ID**
6. Cliquez **Enregistrer**
7. Cliquez **Tester** pour vérifier que tout fonctionne

Si le bot est correctement configuré sur le serveur, vous verrez le message :
> ✅ Bot Telegram configuré sur le serveur

## Ce qui est notifié

| Type | Déclencheur | Exemple de message |
|------|------------|-------------------|
| **Licences** | J-30, J-7, J-1, jour J, J+1 | `🔑 Licences à renouveler (2)` |
| **Domaines** | J-60, J-30, J-7, J-1, jour J, J+1 | `🌐 Domaines à renouveler (3, 1 à facturer)` |
| **Tâches** | Selon les rappels configurés par tâche | `📋 Relancer le client - Échéance demain` |

Chaque tâche peut choisir individuellement ses canaux de notification (Ntfy, Email, Telegram) lors de sa création ou modification.

## Notifications par tâche

Lors de la création ou modification d'une tâche, vous pouvez :

- Choisir les canaux de notification spécifiques à cette tâche (indépendamment de la config globale)
- Définir des rappels "X jours avant l'échéance"
- Définir un rappel à une date et heure précise

## Dépannage

| Problème | Solution |
|----------|----------|
| "Bot Telegram non configuré" | Vérifiez que `TELEGRAM_BOT_TOKEN` est bien dans le `.env` et redémarrez le backend |
| Test échoué malgré bot configuré | Assurez-vous d'avoir envoyé `/start` à votre bot sur Telegram |
| Chat ID invalide | Renvoyez `/start` à @userinfobot pour obtenir le bon ID |
| Notifications silencieuses | Vérifiez que Telegram est coché dans vos canaux de notification et que la config est enregistrée |

## Architecture technique

```
Utilisateur         DevToolbox Backend         API Telegram
    │                      │                        │
    │  Chat ID (config)    │                        │
    ├─────────────────────>│                        │
    │                      │                        │
    │                      │  POST /sendMessage     │
    │                      │  (bot token + chat_id) │
    │                      ├───────────────────────>│
    │                      │                        │
    │  Message Telegram    │                        │
    │<─────────────────────┼────────────────────────┤
```

Le backend utilise l'API Telegram Bot (`https://api.telegram.org/bot<TOKEN>/sendMessage`) pour envoyer les messages en texte brut, sans prévisualisation de liens.
