package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetWikiHandler(t *testing.T) {
	// 1. Create a request to pass to our handler.
	// We don't need to pass any body for a GET request.
	req, err := http.NewRequest("GET", "/api/wiki", nil)
	if err != nil {
		t.Fatal(err)
	}

	// 2. We create a ResponseRecorder (which satisfies http.ResponseWriter) to record the response.
	rr := httptest.NewRecorder()

	// 3. Call the handler function directly, passing in the recorder and request.
	handler := http.HandlerFunc(getWikiHandler)
	handler.ServeHTTP(rr, req)

	// 4. Check the status code is what we expect (200 OK).
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}
