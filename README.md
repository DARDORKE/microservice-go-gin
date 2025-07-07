# Microservice Go avec Gin Framework

Un microservice haute performance développé en Go avec le framework Gin, architecture clean et déploiement automatisé.

## 🚀 Fonctionnalités

- **API REST** ultra-rapide avec Gin Framework
- **Architecture Clean** avec séparation des couches
- **Concurrence** native avec les goroutines Go
- **Base de données** MySQL avec GORM
- **Cache Redis** pour les performances
- **Authentification JWT** sécurisée
- **Tests** complets avec Testify
- **Monitoring** avec Prometheus et métriques personnalisées
- **Déploiement** automatisé avec Docker et Kubernetes

## 🛠️ Stack Technique

### Backend
- **Go 1.21+** avec modules
- **Gin Framework** pour l'API REST
- **GORM** comme ORM
- **MySQL 8.0+** pour la base de données
- **Redis** pour le cache et sessions
- **JWT-Go** pour l'authentification
- **Viper** pour la configuration
- **Logrus** pour les logs structurés

### Testing
- **Testify** pour les tests unitaires
- **Go-Mock** pour les mocks
- **Ginkgo** pour les tests BDD
- **Bench** pour les tests de performance

### DevOps
- **Docker** multi-stage builds
- **Docker Compose** pour le développement
- **Kubernetes** pour l'orchestration
- **Helm** pour les déploiements
- **GitLab CI/CD** avec pipelines Go

### Monitoring
- **Prometheus** pour les métriques
- **Grafana** pour les dashboards
- **Jaeger** pour le tracing distribué
- **ELK Stack** pour les logs

## 📊 Métriques de Performance

- **50k+** requêtes par seconde
- **< 50ms** latence moyenne
- **Zero** downtime avec rolling updates
- **99.9%** de disponibilité
- **Mémoire** optimisée (< 100MB)
- **CPU** efficace (< 5% utilisation)

## 🏗️ Architecture

```
├── cmd/
│   └── server/            # Point d'entrée de l'application
│       └── main.go
├── internal/              # Code privé de l'application
│   ├── config/           # Configuration
│   ├── delivery/         # Handlers HTTP (Gin)
│   │   ├── http/
│   │   │   ├── handler/
│   │   │   ├── middleware/
│   │   │   └── route/
│   │   └── grpc/         # Handlers gRPC (optionnel)
│   ├── domain/           # Entités métier
│   │   ├── entity/
│   │   ├── repository/   # Interfaces repositories
│   │   └── service/      # Interfaces services
│   ├── infrastructure/   # Implémentations techniques
│   │   ├── database/
│   │   ├── cache/
│   │   ├── logger/
│   │   └── metrics/
│   └── usecase/          # Logique métier
├── pkg/                  # Code réutilisable
│   ├── errors/
│   ├── jwt/
│   ├── validator/
│   └── utils/
├── tests/                # Tests
│   ├── unit/
│   ├── integration/
│   └── performance/
├── deployments/          # Configuration déploiement
│   ├── docker/
│   ├── kubernetes/
│   └── helm/
├── docs/                 # Documentation
├── scripts/              # Scripts utilitaires
└── migrations/           # Migrations de base de données
```

## 🚀 Installation

### Prérequis
- Go 1.21+
- Docker et Docker Compose
- MySQL 8.0+
- Redis 7+
- Make (optionnel)

### Démarrage rapide

```bash
# Cloner le repository
git clone https://github.com/kevy-dardor/microservice-go-gin.git
cd microservice-go-gin

# Lancer l'environnement de développement
make dev-start

# Installer les dépendances
go mod download

# Lancer les migrations
make db-migrate

# Démarrer le serveur
make run
```

L'API sera disponible sur :
- **API** : http://localhost:8080
- **Health Check** : http://localhost:8080/health
- **Metrics** : http://localhost:8080/metrics
- **Swagger** : http://localhost:8080/swagger/index.html

## 🧪 Tests

```bash
# Tests unitaires
make test-unit

# Tests d'intégration
make test-integration

# Tests de performance
make test-performance

# Coverage
make test-coverage

# Benchmarks
make bench
```

## 📚 Fonctionnalités Principales

### 🔐 Authentification
- JWT avec refresh tokens
- Middleware d'authentification
- RBAC (Role-Based Access Control)
- Rate limiting par utilisateur

### 📊 API Endpoints
```
GET    /health              # Health check
GET    /metrics             # Métriques Prometheus
POST   /auth/login          # Connexion
POST   /auth/refresh        # Refresh token
GET    /users               # Liste des utilisateurs
POST   /users               # Créer un utilisateur
GET    /users/:id           # Détails utilisateur
PUT    /users/:id           # Modifier utilisateur
DELETE /users/:id           # Supprimer utilisateur
```

### 🔄 Middleware
- **CORS** configuré
- **Rate Limiting** avec Redis
- **Request ID** pour le tracing
- **Logging** structuré
- **Recovery** des panics
- **Compression** Gzip
- **Security Headers**

### 🗄️ Base de Données
- **Connexion pooling** optimisé
- **Transactions** automatiques
- **Migrations** avec sql-migrate
- **Soft deletes** avec GORM
- **Indexes** optimisés

## 🔧 Configuration

### Variables d'environnement
```bash
# Serveur
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
SERVER_MODE=debug

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=microservice

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Fichier de configuration
```yaml
# config/config.yaml
server:
  port: 8080
  host: "0.0.0.0"
  mode: "debug"
  timeout: 30s

database:
  host: "localhost"
  port: 3306
  user: "root"
  password: "password"
  name: "microservice"
  max_connections: 100
  max_idle_connections: 10

redis:
  host: "localhost"
  port: 6379
  db: 0
  password: ""

jwt:
  secret: "your-secret-key"
  expires_in: "24h"
  refresh_expires_in: "7d"
```

## 📈 Monitoring

### Métriques Prometheus
```go
// Métriques personnalisées
var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "Duration of HTTP requests",
        },
        []string{"method", "endpoint"},
    )
)
```

### Health Check
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "uptime": "24h30m15s",
  "database": "connected",
  "redis": "connected",
  "memory": {
    "alloc": "10.2MB",
    "sys": "25.6MB",
    "gc": 15
  }
}
```

## 🔧 Commandes Utiles

```bash
# Développement
make dev-start        # Démarre l'environnement
make dev-stop         # Arrête l'environnement
make run              # Lance le serveur
make watch            # Lance avec hot reload

# Base de données
make db-migrate       # Applique les migrations
make db-rollback      # Rollback migrations
make db-seed          # Charge les données de test
make db-reset         # Remet à zéro la DB

# Tests
make test             # Lance tous les tests
make test-unit        # Tests unitaires
make test-integration # Tests d'intégration
make bench            # Benchmarks
make coverage         # Coverage

# Qualité
make lint             # Lint le code
make fmt              # Formate le code
make vet              # Analyse statique
make security         # Audit de sécurité

# Build
make build            # Build binaire
make build-docker     # Build image Docker
make build-linux      # Build pour Linux
make build-windows    # Build pour Windows
```

## 🚀 Déploiement

### Docker
```dockerfile
# Multi-stage build optimisé
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: microservice-go
spec:
  replicas: 3
  selector:
    matchLabels:
      app: microservice-go
  template:
    metadata:
      labels:
        app: microservice-go
    spec:
      containers:
      - name: microservice-go
        image: microservice-go:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          value: "mysql-service"
        - name: REDIS_HOST
          value: "redis-service"
```

## 🔒 Sécurité

- **Input validation** avec go-validator
- **SQL injection** protection avec GORM
- **XSS protection** avec middleware
- **HTTPS** obligatoire en production
- **Rate limiting** contre les attaques
- **CORS** configuré strictement
- **Security headers** automatiques
- **Secrets** chiffrés avec Vault

## 📱 Intégrations

### API Tiers
- **Payment** : Stripe, PayPal
- **Email** : SendGrid, Mailgun
- **SMS** : Twilio, AWS SNS
- **Storage** : AWS S3, Google Cloud
- **Monitoring** : Datadog, New Relic

### Message Brokers
- **RabbitMQ** pour les événements
- **Apache Kafka** pour le streaming
- **Redis Pub/Sub** pour les notifications
- **NATS** pour les microservices

## 🐛 Debugging

### Logs structurés
```go
log.WithFields(log.Fields{
    "user_id": userID,
    "action": "login",
    "ip": clientIP,
}).Info("User logged in")
```

### Tracing
```go
// Jaeger tracing
span := opentracing.StartSpan("database_query")
defer span.Finish()
```

### Profiling
```bash
# CPU profiling
go tool pprof http://localhost:8080/debug/pprof/profile

# Memory profiling
go tool pprof http://localhost:8080/debug/pprof/heap
```

## 📞 Support

Pour toute question ou problème :
- **Documentation** : [docs.microservice.example.com](https://docs.microservice.example.com)
- **Issues** : [GitHub Issues](https://github.com/kevy-dardor/microservice-go-gin/issues)
- **Email** : kevy.dardor@example.com

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ par Kévy DARDOR**