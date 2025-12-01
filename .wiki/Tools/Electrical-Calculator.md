# Mon Calcul Énergie

Guide d'utilisation du calculateur électrique dans DevToolbox.

## Description

Mon Calcul Énergie est un calculateur de consommation énergétique et d'estimation des coûts pour vos projets. Calculez la consommation d'énergie de vos équipements et estimez les coûts associés.

## Fonctionnalités

- **Calcul de consommation** : Calculez la consommation d'énergie
- **Estimation des coûts** : Estimez les coûts en fonction du prix du kWh
- **Historique** : Consultez vos calculs précédents
- **Paramètres personnalisables** : Configurez le prix du kWh et la devise
- **Export** : Exportez vos calculs

## Utilisation

### Accéder au calculateur

1. Depuis la page d'accueil, cliquez sur "Mon Calcul Énergie"
2. Ou accédez directement à `/tools/mon-calcul-energie`

### Effectuer un calcul

1. Entrez la **puissance** de l'équipement (en watts)
2. Entrez le nombre d'**heures** d'utilisation par jour
3. Entrez le nombre de **jours** d'utilisation par mois
4. Le calcul s'effectue automatiquement :
   - Consommation en kWh
   - Coût estimé

### Formule de calcul

```
Consommation (kWh) = (Puissance (W) × Heures × Jours) / 1000
Coût = Consommation (kWh) × Prix du kWh
```

### Exemple

- **Puissance** : 100W
- **Heures/jour** : 24h
- **Jours/mois** : 30 jours
- **Prix du kWh** : 0.15€

**Résultat** :
- Consommation : 72 kWh/mois
- Coût : 10.80€/mois

### Configurer les paramètres

1. Allez dans l'onglet "Paramètres"
2. Configurez :
   - **Prix du kWh** : Prix de l'électricité
   - **Devise** : EUR, USD, etc.
3. Les paramètres sont sauvegardés automatiquement

### Consulter l'historique

1. Allez dans l'onglet "Historique"
2. Consultez vos 50 derniers calculs
3. Les calculs sont sauvegardés automatiquement

## API Backend

Le calculateur utilise l'API backend pour :

- `GET /api/electricalc/settings` - Récupère les paramètres
- `PUT /api/electricalc/settings` - Met à jour les paramètres
- `GET /api/electricalc/history` - Récupère l'historique (50 derniers)
- `POST /api/electricalc/history` - Ajoute un calcul à l'historique

Pour plus de détails, consultez la [Référence API](API-Reference#calculateur-électrique).

## Astuces

1. **Puissance** : Vérifiez la puissance réelle de vos équipements
2. **Heures** : Estimez précisément le temps d'utilisation
3. **Prix du kWh** : Vérifiez le prix de votre fournisseur d'électricité
4. **Historique** : Utilisez l'historique pour comparer vos calculs

## Exemples d'utilisation

### Calculer la consommation d'un serveur

- **Puissance** : 200W
- **Heures/jour** : 24h
- **Jours/mois** : 30 jours
- **Résultat** : 144 kWh/mois

### Calculer la consommation d'un ordinateur

- **Puissance** : 50W
- **Heures/jour** : 8h
- **Jours/mois** : 22 jours (jours ouvrés)
- **Résultat** : 8.8 kWh/mois

## Support

Pour toute question :

1. Consultez le [Guide de dépannage](Troubleshooting)
2. Ouvrez une issue sur GitHub

---

*Dernière mise à jour : 2024*

