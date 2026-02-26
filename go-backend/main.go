package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type MessageResponse struct {
	Message string `json:"message"`
}

func messageHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := MessageResponse{
		Message: "Hello from Golang Backend (Behind Ingress)!",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func main() {
	mux := http.NewServeMux()
	// The path here still matches exactly what the Ingress forwards
	mux.HandleFunc("/api/message", messageHandler)

	log.Println("Go backend is running on port 8080...")
	// Start the server directly with our mux, no CORS wrapper needed
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}
