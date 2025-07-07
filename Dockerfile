# Development stage avec Go 1.24
FROM golang:1.24-alpine

# Install dependencies
RUN apk add --no-cache git gcc musl-dev make curl

# Install development tools
RUN go install github.com/air-verse/air@latest && \
    go install github.com/swaggo/swag/cmd/swag@latest && \
    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Generate Swagger docs
RUN swag init -g cmd/server/main.go -o docs/

# Expose port
EXPOSE 8080

# Start with air for hot reload
CMD ["go", "run", "cmd/server/main.go"]