# 🚀 QuickPoll - Déploiement Rapide

## Variables d'Environnement pour Railway

Copiez ces variables dans votre projet Railway :

```bash
# Application
APP_ENVIRONMENT=production
APP_DEBUG=false

# Base de données Neon (CONFIGURÉE ✅)
DATABASE_TYPE=postgres
DATABASE_HOST=ep-floral-fire-abivn1uy-pooler.eu-west-2.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=npg_bswef0zOmdl5
DATABASE_NAME=neondb

# Redis (À ajouter via Railway)
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT (CHANGEZ CE SECRET !)
JWT_SECRET=votre-super-secret-jwt-pour-production-changez-moi

# URLs (À mettre à jour après déploiement)
SERVER_BASE_URL=https://votre-app-railway.railway.app
FRONTEND_URL=https://votre-app-vercel.vercel.app
```

## 🎯 Étapes de Déploiement

### 1. Railway (Backend)
```bash
# Se connecter à Railway
railway login

# Créer et déployer le projet
railway project create quickpoll-backend
railway up

# Ajouter Redis
railway add redis

# Les variables Redis seront automatiquement disponibles
```

### 2. Vercel (Frontend)
```bash
# Depuis le dossier frontend
cd frontend
vercel

# Configurer la variable d'environnement
# REACT_APP_API_BASE_URL=https://votre-url-railway.railway.app
```

### 3. Test Final
- ✅ Base de données Neon : Connectée et testée
- 🔄 Backend Railway : À déployer
- 🔄 Frontend Vercel : À déployer
- 🔄 Configuration CORS : Automatique

## 📋 Checklist

- [x] Base de données Neon configurée
- [x] Variables d'environnement préparées
- [ ] Déploiement Railway
- [ ] Configuration Redis
- [ ] Déploiement Vercel
- [ ] Test de l'application complète

## 🔧 URLs importantes

Une fois déployé :
- **API Health Check** : `https://votre-app.railway.app/health`
- **API Documentation** : `https://votre-app.railway.app/swagger/index.html`
- **Frontend** : `https://votre-app.vercel.app`
- **Métriques** : `https://votre-app.railway.app/metrics`

---

💡 **Conseil** : Changez le `JWT_SECRET` avant le déploiement en production !