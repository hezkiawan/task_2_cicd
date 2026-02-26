# ==========================================
# Stage 1: Builder
# ==========================================
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy dependency files first (optimizes Docker layer caching)
COPY go.mod go.sum* ./
RUN go mod download

# Copy the rest of your raw source code
COPY . .

# Compile the Go application
# CGO_ENABLED=0 ensures a static binary, perfect for minimal images
RUN CGO_ENABLED=0 GOOS=linux go build -o backend-app .

# ==========================================
# Stage 2: Final Production Image
# ==========================================
FROM alpine:latest

WORKDIR /app

# Copy ONLY the compiled binary from the 'builder' stage
COPY --from=builder /app/backend-app .

# Expose the port your app runs on
EXPOSE 8080

# Run the binary
CMD ["./backend-app"]