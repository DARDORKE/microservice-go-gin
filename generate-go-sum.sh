#!/bin/bash

# Script pour générer go.sum avec Docker
docker run --rm -v $(pwd):/app -w /app golang:1.21-alpine sh -c "go mod download && go mod tidy"