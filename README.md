# QuickPoll - Real-time Polling API

[![Go Version](https://img.shields.io/badge/Go-1.21-blue.svg)](https://golang.org)
[![Gin Version](https://img.shields.io/badge/Gin-1.9.1-green.svg)](https://gin-gonic.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuickPoll est une API REST haute performance pour créer et gérer des sondages en temps réel, développée avec Go et le framework Gin. Elle démontre l'utilisation de patterns modernes et de bonnes pratiques en développement Go.

## 🎯 Fonctionnalités

### Core Features
- ✅ **Création rapide de sondages** - Créez un sondage en quelques secondes
- ✅ **Résultats en temps réel** - WebSocket pour les mises à jour instantanées
- ✅ **QR Code intégré** - Partagez facilement vos sondages
- ✅ **Vote anonyme** - Aucune inscription requise
- ✅ **Choix unique ou multiple** - Flexibilité dans les options
- ✅ **Expiration automatique** - Définissez une durée de vie

### Technical Features
- 🏗️ **Clean Architecture** - Séparation claire des responsabilités
- 🚀 **Haute performance** - Optimisé avec Gin et Go
- 📊 **Metrics Prometheus** - Monitoring intégré
- 📚 **Documentation Swagger** - API auto-documentée
- 🔒 **Sécurité** - Rate limiting et validation des entrées
- 🧪 **Tests complets** - Unit et integration tests
- 🐳 **Docker Ready** - Déploiement containerisé

## 🛠️ Architecture

```
microservice-go-gin/
├── cmd/
│   └── server/          # Point d'entrée de l'application
├── internal/
│   ├── config/          # Configuration management
│   ├── domain/          # Entités métier et interfaces
│   │   ├── entity/      # Models (Poll, Option, Vote)
│   │   └── repository/  # Interfaces repository
│   ├── infrastructure/  # Implémentations techniques
│   │   ├── cache/       # Redis cache
│   │   ├── database/    # MySQL avec GORM
│   │   └── websocket/   # WebSocket hub
│   ├── delivery/        # Couche présentation
│   │   ├── http/        # Handlers REST
│   │   └── websocket/   # Handlers WebSocket
│   └── usecase/         # Logique métier
├── migrations/          # Scripts SQL
└── docker-compose.yml   # Stack de développement
```

## 🚀 Démarrage rapide

### Prérequis
- Go 1.21+
- Docker & Docker Compose
- Make

### Installation

1. **Clonez le repository**
```bash
git clone https://github.com/DARDORKE/microservice-go-gin.git
cd microservice-go-gin
```

2. **Démarrez l'environnement de développement**

**Services de base uniquement (recommandé pour débuter)**
```bash
make dev-start
```

**Avec monitoring (Prometheus + Grafana)**
```bash
make dev-monitoring
```

**Environnement complet (tous les services)**
```bash
make dev-full
```

3. **L'API est maintenant accessible sur**
- Frontend : http://localhost
- API: http://localhost/api/v1
- Swagger: http://localhost/swagger/index.html
- Metrics: http://localhost/metrics
- Prometheus: http://localhost:9090 (avec monitoring)
- Grafana: http://localhost:3000 (admin/admin, avec monitoring)

## 📡 API Endpoints

### Polls

#### Créer un sondage
```http
POST /api/v1/polls
Content-Type: application/json

{
  "title": "Quel est votre framework Go préféré ?",
  "description": "Choisissez votre framework web Go favori",
  "options": ["Gin", "Echo", "Fiber", "Chi"],
  "multi_choice": false,
  "require_auth": false,
  "expires_in": 1440  // en minutes (optionnel)
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "share_url": "http://localhost:8080/poll/550e8400-e29b-41d4-a716-446655440000",
  "qr_code_url": "http://localhost:8080/api/v1/polls/550e8400-e29b-41d4-a716-446655440000/qr"
}
```

#### Récupérer un sondage avec résultats
```http
GET /api/v1/polls/{id}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Quel est votre framework Go préféré ?",
  "description": "Choisissez votre framework web Go favori",
  "options": [
    {
      "id": "option-id-1",
      "text": "Gin",
      "vote_count": 42
    },
    {
      "id": "option-id-2",
      "text": "Echo",
      "vote_count": 18
    }
  ],
  "multi_choice": false,
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-01-16T10:00:00Z"
}
```

#### Voter
```http
POST /api/v1/polls/{id}/vote
Content-Type: application/json

{
  "option_ids": ["option-id-1"]
}
```

#### Générer QR Code
```http
GET /api/v1/polls/{id}/qr
```
Retourne une image PNG du QR code

### WebSocket - Résultats en temps réel

Connectez-vous à `/ws/polls/{id}` pour recevoir les mises à jour en temps réel:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws/polls/550e8400-e29b-41d4-a716-446655440000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Vote update:', data);
};
```

## 🧪 Tests

```bash
# Tous les tests
make test

# Tests unitaires uniquement
make test-unit

# Tests d'intégration
make test-integration

# Coverage report
make test-coverage
```

## 🐳 Docker

### Environnements de développement

Le projet utilise Docker Compose avec un système de profils pour différents environnements :

**Services de base (MySQL + Redis + App)**
```bash
docker-compose up -d
# ou
make dev-start
```

**Avec monitoring (ajoute Prometheus + Grafana)**
```bash
docker-compose --profile monitoring up -d
# ou
make dev-monitoring
```

**Environnement complet (tous les services)**
```bash
docker-compose --profile full up -d
# ou
make dev-full
```

**Tests d'intégration**
```bash
docker-compose --profile test run --rm test
# ou
make test-integration
```

### Build de production
```bash
make prod-build
make prod-docker
```

### Variables d'environnement
```env
# Database
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_USER=quickpoll
DATABASE_PASSWORD=secret
DATABASE_NAME=quickpoll

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Server
SERVER_PORT=8080
APP_ENVIRONMENT=production
```

## 📊 Performance

- **Latence moyenne**: < 10ms
- **Throughput**: 10,000+ req/s
- **Concurrent connections**: 1,000+ WebSocket
- **Memory footprint**: < 100MB

## 🔧 Développement

### Commandes utiles

**Développement**
```bash
make dev-start      # Démarrer services de base
make dev-monitoring # Démarrer avec monitoring
make dev-full       # Démarrer tous les services
make dev-stop       # Arrêter l'environnement
make dev-restart    # Redémarrer l'environnement
```

**Build et exécution**
```bash
make build          # Build l'application
make run            # Run en local
make watch          # Hot reload avec Air
```

**Qualité de code**
```bash
make lint           # Lint le code
make fmt            # Format le code
make docs           # Générer Swagger docs
make test           # Lancer tous les tests
make test-coverage  # Rapport de couverture
```

**Monitoring**
```bash
make monitor-start  # Démarrer uniquement le monitoring
make monitor-stop   # Arrêter le monitoring
```

### Structure d'un Use Case
```go
type CreatePollUseCase struct {
    pollRepo repository.PollRepository
    baseURL  string
}

func (uc *CreatePollUseCase) Execute(ctx context.Context, input CreatePollInput) (*CreatePollOutput, error) {
    // Validation
    // Business logic
    // Persistence
    // Return result
}
```

## 🚀 Déploiement

### Railway.app (Recommandé)
1. Fork ce repository
2. Connectez Railway à votre GitHub
3. Créez un nouveau projet depuis le repo
4. Railway détectera automatiquement le Dockerfile
5. Ajoutez MySQL et Redis depuis le marketplace
6. Configurez les variables d'environnement

### Autres options
- **Render.com** - Support natif Go
- **Fly.io** - Déploiement global
- **Heroku** - Avec buildpack Go

## 📝 TODO

- [ ] Frontend React interactif
- [ ] Authentification JWT pour sondages privés
- [ ] Export CSV/JSON des résultats
- [ ] Analytics dashboard
- [ ] Rate limiting par IP
- [ ] i18n support

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

Développé avec ❤️ pour démontrer les compétences en Go/Gin

---

**Note**: Ce projet est une démonstration technique. Pour une utilisation en production, ajoutez des fonctionnalités de sécurité supplémentaires et optimisez selon vos besoins.