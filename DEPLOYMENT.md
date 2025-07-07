# QuickPoll - Guide de Déploiement

Ce guide explique comment déployer l'application QuickPoll en utilisant :
- **Neon** pour la base de données PostgreSQL
- **Railway** pour le backend Go
- **Vercel** pour le frontend React

## Prérequis

1. Comptes sur :
   - [Neon](https://neon.tech/)
   - [Railway](https://railway.app/)
   - [Vercel](https://vercel.com/)

2. Outils installés :
   - [Railway CLI](https://docs.railway.app/reference/cli-api)
   - [Vercel CLI](https://vercel.com/cli)

## 1. Configuration de la Base de Données Neon

### Créer un nouveau projet
1. Allez sur [Neon Console](https://console.neon.tech/)
2. Cliquez sur "Create Project"
3. Configurez votre projet :
   - Nom : `quickpoll`
   - Version PostgreSQL : 16 (recommandée)
   - Région : Choisissez la plus proche de vos utilisateurs

### Récupérer les détails de connexion
1. Dans votre tableau de bord Neon, allez dans "Connection Details"
2. Notez la chaîne de connexion ou les détails individuels :
   - Host : `ep-xxx-xxx.us-east-1.aws.neon.tech`
   - Nom de la base : `neondb`
   - Port : `5432`
   - Utilisateur : Votre nom d'utilisateur
   - Mot de passe : Votre mot de passe
   - Mode SSL : `require`

### Avantages de Neon pour ce déploiement
- **Serverless** : Se met automatiquement à l'échelle jusqu'à zéro quand pas utilisé
- **Branching** : Créez des branches de base de données pour différents environnements
- **Connection pooling** : Pooling de connexions intégré pour de meilleures performances
- **Auto-scaling** : Ajuste automatiquement le compute selon la demande
- **Free tier** : Niveau gratuit généreux, parfait pour le développement et petits projets

### Optionnel : Exécuter les migrations
L'application migrera automatiquement les tables au démarrage, mais vous pouvez aussi les exécuter manuellement avec l'éditeur SQL Neon :

```sql
-- Créer la table des sondages
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_multiple_votes BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Créer la table des options
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table des votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES options(id) ON DELETE CASCADE,
    voter_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Déploiement du Backend Railway

### Déployer le backend
1. Installer Railway CLI :
   ```bash
   npm install -g @railway/cli
   ```

2. Se connecter à Railway :
   ```bash
   railway login
   ```

3. Depuis la racine du projet, déployer :
   ```bash
   railway project create quickpoll-backend
   railway up
   ```

### Configurer les variables d'environnement
Dans le tableau de bord Railway, ajoutez ces variables :

```bash
# Configuration Base de Données (Neon)
DATABASE_TYPE=postgres
DATABASE_HOST=ep-xxx-xxx.us-east-1.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=your-neon-username
DATABASE_PASSWORD=your-neon-password
DATABASE_NAME=neondb

# Configuration Redis (Add-on Redis Railway)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Secret JWT
JWT_SECRET=your-super-secret-jwt-key

# Configuration Serveur
PORT=8080
APP_ENVIRONMENT=production
```

### Ajouter le service Redis
1. Dans le tableau de bord Railway, cliquez sur "Add Service"
2. Choisissez "Redis"
3. Notez les détails de connexion

### Configurer un domaine personnalisé (optionnel)
1. Dans le tableau de bord Railway, allez dans Settings → Domains
2. Ajoutez votre domaine personnalisé ou utilisez le domaine Railway généré

## 3. Déploiement du Frontend Vercel

### Déployer le frontend
1. Installer Vercel CLI :
   ```bash
   npm install -g vercel
   ```

2. Depuis le répertoire `frontend` :
   ```bash
   cd frontend
   vercel
   ```

3. Suivez les instructions :
   - Set up and deploy : Oui
   - Which scope : Votre compte
   - Link to existing project : Non
   - Project name : `quickpoll-frontend`
   - Directory : `./` (répertoire actuel)

### Configurer les variables d'environnement
Dans le tableau de bord Vercel, ajoutez cette variable :

```bash
REACT_APP_API_BASE_URL=https://your-railway-domain.railway.app
```

## 4. Configuration Finale

### Mettre à jour les paramètres CORS
Assurez-vous que votre backend autorise les requêtes depuis votre domaine Vercel. L'application devrait gérer automatiquement CORS, mais vérifiez dans la configuration du middleware.

### Tester le déploiement
1. Visitez votre domaine Vercel
2. Créez un sondage
3. Vérifiez que les mises à jour en temps réel fonctionnent
4. Testez la génération de QR code

## 5. Surveillance et Maintenance

### Vérifications de santé
- Vérification santé backend : `https://your-railway-domain.railway.app/health`
- Métriques : `https://your-railway-domain.railway.app/metrics`

### Logs
- Railway : Vérifiez les logs dans le tableau de bord Railway
- Vercel : Vérifiez les logs de fonction dans le tableau de bord Vercel

### Surveillance de la base de données
- Surveillez l'utilisation de la base de données dans le tableau de bord Neon
- Configurez des alertes pour les limites de connexion et l'utilisation du compute

## Résumé des Variables d'Environnement

### Railway (Backend)
```bash
DATABASE_TYPE=postgres
DATABASE_HOST=ep-xxx-xxx.us-east-1.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=your-neon-username
DATABASE_PASSWORD=your-neon-password
DATABASE_NAME=neondb
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-password
JWT_SECRET=your-jwt-secret
PORT=8080
APP_ENVIRONMENT=production
SERVER_BASE_URL=https://your-railway-app.railway.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Vercel (Frontend)
```bash
REACT_APP_API_BASE_URL=https://your-railway-app.railway.app
```

## Dépannage

### Problèmes courants :
1. **Erreurs de connexion base de données** : Vérifiez les identifiants Neon et les exigences SSL
2. **Erreurs CORS** : Vérifiez la configuration de l'URL API dans le frontend
3. **Problèmes de connexion WebSocket** : Assurez-vous que l'URL WebSocket est correctement configurée
4. **Échecs de build** : Vérifiez la compatibilité de la version Node.js
5. **Limites de connexion Neon** : Surveillez l'utilisation de la base de données et mettez à niveau le plan si nécessaire

### Support
- Railway : [Documentation Railway](https://docs.railway.app/)
- Vercel : [Documentation Vercel](https://vercel.com/docs)
- Neon : [Documentation Neon](https://neon.tech/docs)