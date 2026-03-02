package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
)

// QAPair represents a single Question and Answer entry
type QAPair struct {
	ID       int    `json:"id"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

// In-memory data store with a mutex for thread safety
var (
	mu      sync.Mutex
	qaStore = make(map[int]QAPair)
	nextID  = 1
)

// authMiddleware
func isAuthorized(r *http.Request) bool {
	expectedKey := os.Getenv("API_KEY")

	if expectedKey == "" {
		return false
	}

	authHeader := r.Header.Get("Authorization")
	return authHeader == expectedKey
}

// GET /api/wiki - Publicly returns all Q&A pairs
func getWikiHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	mu.Lock()
	defer mu.Unlock()

	// Convert the map to a slice for the JSON response
	pairs := make([]QAPair, 0, len(qaStore))
	for _, pair := range qaStore {
		pairs = append(pairs, pair)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(pairs)
}

// POST /api/wiki - Adds a new Q&A pair (Requires Auth)
func postWikiHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthorized(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var newPair QAPair
	if err := json.NewDecoder(r.Body).Decode(&newPair); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	newPair.ID = nextID
	qaStore[nextID] = newPair
	nextID++

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newPair)
}

// DELETE /api/wiki/{id} - Removes a Q&A pair (Requires Auth)
func deleteWikiHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthorized(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract the {id} wildcard from the URL path (Go 1.22+ feature)
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID format", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	if _, exists := qaStore[id]; !exists {
		http.Error(w, "Q&A pair not found", http.StatusNotFound)
		return
	}

	delete(qaStore, id)
	w.WriteHeader(http.StatusNoContent)
}

func main() {
	mux := http.NewServeMux()

	// Go 1.22+ allows us to define the HTTP method directly in the route string
	mux.HandleFunc("GET /api/wiki", getWikiHandler)
	mux.HandleFunc("POST /api/wiki", postWikiHandler)
	mux.HandleFunc("DELETE /api/wiki/{id}", deleteWikiHandler)

	log.Println("Kouventa Wiki Admin API is running on port 8080...")
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}
