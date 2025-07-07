# Makefile pour Microservice Go avec Gin

.DEFAULT_GOAL := help
.PHONY: help build run test clean

# Variables
APP_NAME = microservice-go-gin
DOCKER_COMPOSE = docker-compose
MAIN_PATH = cmd/server/main.go
BUILD_DIR = build
COVERAGE_FILE = coverage.out

# Colors
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m

help: ## Affiche l'aide
	@echo "$(GREEN)Microservice Go avec Gin - Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Développement
dev-start: ## Démarre l'environnement de développement
	@echo "$(GREEN)🚀 Démarrage de l'environnement de développement...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Environnement démarré!$(NC)"
	@echo "$(BLUE)API: http://localhost:8080$(NC)"
	@echo "$(BLUE)Swagger: http://localhost:8080/swagger/index.html$(NC)"
	@echo "$(BLUE)Prometheus: http://localhost:9090$(NC)"
	@echo "$(BLUE)Grafana: http://localhost:3000 (admin/admin)$(NC)"
	@echo "$(BLUE)Jaeger: http://localhost:16686$(NC)"

dev-stop: ## Arrête l'environnement de développement
	@echo "$(YELLOW)🔄 Arrêt de l'environnement...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Environnement arrêté!$(NC)"

dev-restart: ## Redémarre l'environnement
	@echo "$(YELLOW)🔄 Redémarrage de l'environnement...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Environnement redémarré!$(NC)"

dev-logs: ## Affiche les logs de tous les services
	$(DOCKER_COMPOSE) logs -f

dev-logs-app: ## Affiche les logs de l'application
	$(DOCKER_COMPOSE) logs -f app

# Build et exécution
build: ## Build l'application
	@echo "$(GREEN)🏗️ Build de l'application...$(NC)"
	@mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PATH)
	@echo "$(GREEN)✅ Build terminé: $(BUILD_DIR)/$(APP_NAME)$(NC)"

build-linux: ## Build pour Linux
	@echo "$(GREEN)🏗️ Build pour Linux...$(NC)"
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/$(APP_NAME)-linux $(MAIN_PATH)
	@echo "$(GREEN)✅ Build Linux terminé!$(NC)"

build-windows: ## Build pour Windows
	@echo "$(GREEN)🏗️ Build pour Windows...$(NC)"
	@mkdir -p $(BUILD_DIR)
	GOOS=windows GOARCH=amd64 go build -o $(BUILD_DIR)/$(APP_NAME)-windows.exe $(MAIN_PATH)
	@echo "$(GREEN)✅ Build Windows terminé!$(NC)"

build-docker: ## Build l'image Docker
	@echo "$(GREEN)🐳 Build de l'image Docker...$(NC)"
	docker build -t $(APP_NAME):latest .
	@echo "$(GREEN)✅ Image Docker construite!$(NC)"

run: ## Lance l'application localement
	@echo "$(GREEN)🚀 Lancement de l'application...$(NC)"
	go run $(MAIN_PATH)

watch: ## Lance l'application avec hot reload
	@echo "$(GREEN)🔥 Lancement avec hot reload...$(NC)"
	air

# Dépendances
deps: ## Installe les dépendances
	@echo "$(GREEN)📦 Installation des dépendances...$(NC)"
	go mod download
	go mod tidy
	@echo "$(GREEN)✅ Dépendances installées!$(NC)"

deps-update: ## Met à jour les dépendances
	@echo "$(GREEN)🔄 Mise à jour des dépendances...$(NC)"
	go get -u ./...
	go mod tidy
	@echo "$(GREEN)✅ Dépendances mises à jour!$(NC)"

# Tests
test: ## Lance tous les tests
	@echo "$(GREEN)🧪 Lancement de tous les tests...$(NC)"
	go test ./... -v -race
	@echo "$(GREEN)✅ Tests terminés!$(NC)"

test-unit: ## Lance les tests unitaires
	@echo "$(GREEN)🧪 Lancement des tests unitaires...$(NC)"
	go test ./... -v -race -short
	@echo "$(GREEN)✅ Tests unitaires terminés!$(NC)"

test-integration: ## Lance les tests d'intégration
	@echo "$(GREEN)🧪 Lancement des tests d'intégration...$(NC)"
	$(DOCKER_COMPOSE) --profile test run --rm test
	@echo "$(GREEN)✅ Tests d'intégration terminés!$(NC)"

test-coverage: ## Génère le rapport de couverture
	@echo "$(GREEN)📊 Génération du rapport de couverture...$(NC)"
	go test ./... -race -coverprofile=$(COVERAGE_FILE)
	go tool cover -html=$(COVERAGE_FILE) -o coverage.html
	@echo "$(GREEN)✅ Rapport de couverture généré: coverage.html$(NC)"

bench: ## Lance les benchmarks
	@echo "$(GREEN)⚡ Lancement des benchmarks...$(NC)"
	go test ./... -bench=. -benchmem
	@echo "$(GREEN)✅ Benchmarks terminés!$(NC)"

# Qualité de code
lint: ## Vérifie la qualité du code
	@echo "$(GREEN)🔍 Vérification de la qualité du code...$(NC)"
	golangci-lint run
	@echo "$(GREEN)✅ Vérification terminée!$(NC)"

fmt: ## Formate le code
	@echo "$(GREEN)✨ Formatage du code...$(NC)"
	go fmt ./...
	goimports -w .
	@echo "$(GREEN)✅ Code formaté!$(NC)"

vet: ## Analyse statique du code
	@echo "$(GREEN)🔍 Analyse statique...$(NC)"
	go vet ./...
	@echo "$(GREEN)✅ Analyse terminée!$(NC)"

security: ## Audit de sécurité
	@echo "$(GREEN)🔒 Audit de sécurité...$(NC)"
	gosec ./...
	@echo "$(GREEN)✅ Audit de sécurité terminé!$(NC)"

# Base de données
db-migrate: ## Applique les migrations
	@echo "$(GREEN)🗄️ Application des migrations...$(NC)"
	$(DOCKER_COMPOSE) exec app go run scripts/migrate.go up
	@echo "$(GREEN)✅ Migrations appliquées!$(NC)"

db-rollback: ## Rollback des migrations
	@echo "$(YELLOW)🔄 Rollback des migrations...$(NC)"
	$(DOCKER_COMPOSE) exec app go run scripts/migrate.go down
	@echo "$(GREEN)✅ Rollback effectué!$(NC)"

db-seed: ## Charge les données de test
	@echo "$(GREEN)🌱 Chargement des données de test...$(NC)"
	$(DOCKER_COMPOSE) exec app go run scripts/seed.go
	@echo "$(GREEN)✅ Données de test chargées!$(NC)"

db-reset: ## Remet à zéro la base de données
	@echo "$(YELLOW)⚠️ Remise à zéro de la base de données...$(NC)"
	$(DOCKER_COMPOSE) exec mysql mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS microservice; CREATE DATABASE microservice;"
	make db-migrate
	make db-seed
	@echo "$(GREEN)✅ Base de données remise à zéro!$(NC)"

db-shell: ## Ouvre un shell MySQL
	$(DOCKER_COMPOSE) exec mysql mysql -u microservice_user -pmicroservice_password microservice

# Utilitaires
clean: ## Nettoie les fichiers temporaires
	@echo "$(YELLOW)🧹 Nettoyage...$(NC)"
	rm -rf $(BUILD_DIR)
	rm -f $(COVERAGE_FILE)
	rm -f coverage.html
	go clean -cache
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé!$(NC)"

shell: ## Ouvre un shell dans le container
	$(DOCKER_COMPOSE) exec app bash

status: ## Affiche le statut des services
	@echo "$(GREEN)📊 Statut des services:$(NC)"
	$(DOCKER_COMPOSE) ps

logs-tail: ## Suit les logs en temps réel
	$(DOCKER_COMPOSE) logs -f --tail=100

# Documentation
docs: ## Génère la documentation Swagger
	@echo "$(GREEN)📚 Génération de la documentation...$(NC)"
	swag init -g $(MAIN_PATH) -o docs/
	@echo "$(GREEN)✅ Documentation générée!$(NC)"

docs-serve: ## Démarre la documentation
	@echo "$(GREEN)📚 Documentation disponible sur:$(NC)"
	@echo "$(BLUE)http://localhost:8080/swagger/index.html$(NC)"

# Monitoring
monitor-start: ## Démarre le monitoring
	@echo "$(GREEN)📈 Démarrage du monitoring...$(NC)"
	$(DOCKER_COMPOSE) up -d prometheus grafana jaeger
	@echo "$(GREEN)✅ Monitoring démarré!$(NC)"

monitor-stop: ## Arrête le monitoring
	@echo "$(YELLOW)🔄 Arrêt du monitoring...$(NC)"
	$(DOCKER_COMPOSE) stop prometheus grafana jaeger
	@echo "$(GREEN)✅ Monitoring arrêté!$(NC)"

# Profiling
profile-cpu: ## Profile CPU (pendant 30s)
	@echo "$(GREEN)🔍 Profiling CPU...$(NC)"
	go tool pprof -http=:8081 http://localhost:8080/debug/pprof/profile?seconds=30

profile-mem: ## Profile mémoire
	@echo "$(GREEN)🔍 Profiling mémoire...$(NC)"
	go tool pprof -http=:8081 http://localhost:8080/debug/pprof/heap

profile-goroutine: ## Profile goroutines
	@echo "$(GREEN)🔍 Profiling goroutines...$(NC)"
	go tool pprof -http=:8081 http://localhost:8080/debug/pprof/goroutine

# Load testing
load-test: ## Lance un test de charge
	@echo "$(GREEN)⚡ Test de charge...$(NC)"
	hey -n 10000 -c 100 http://localhost:8080/health
	@echo "$(GREEN)✅ Test de charge terminé!$(NC)"

stress-test: ## Lance un test de stress
	@echo "$(GREEN)💪 Test de stress...$(NC)"
	hey -n 50000 -c 500 -t 60 http://localhost:8080/health
	@echo "$(GREEN)✅ Test de stress terminé!$(NC)"

# Production
prod-build: ## Build pour la production
	@echo "$(GREEN)🏭 Build production...$(NC)"
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PATH)
	@echo "$(GREEN)✅ Build production terminé!$(NC)"

prod-docker: ## Build image Docker de production
	@echo "$(GREEN)🐳 Build image Docker production...$(NC)"
	docker build -f Dockerfile.prod -t $(APP_NAME):prod .
	@echo "$(GREEN)✅ Image Docker production construite!$(NC)"

# Backup et restauration
backup-db: ## Sauvegarde la base de données
	@echo "$(GREEN)💾 Sauvegarde de la base de données...$(NC)"
	$(DOCKER_COMPOSE) exec mysql mysqldump -u microservice_user -pmicroservice_password microservice > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Sauvegarde terminée!$(NC)"

restore-db: ## Restaure la base de données (usage: make restore-db FILE=backup.sql)
	@echo "$(GREEN)🔄 Restauration de la base de données...$(NC)"
	$(DOCKER_COMPOSE) exec -T mysql mysql -u microservice_user -pmicroservice_password microservice < $(FILE)
	@echo "$(GREEN)✅ Restauration terminée!$(NC)"

# Installation d'outils
install-tools: ## Installe les outils de développement
	@echo "$(GREEN)🔧 Installation des outils...$(NC)"
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	go install golang.org/x/tools/cmd/goimports@latest
	@echo "$(GREEN)✅ Outils installés!$(NC)"