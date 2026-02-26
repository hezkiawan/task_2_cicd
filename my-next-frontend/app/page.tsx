"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        // Fetching from the Go backend
        const response = await fetch("/api/message");
        const data = await response.json();
        
        // Update the state with the message
        setMessage(data.message);
      } catch (error) {
        console.error("Failed to fetch:", error);
        setMessage("Failed to load message. Is the Go server running?");
      }
    };

    fetchMessage();
  }, []);

  return (
    <main className="min-h-screen p-16 font-sans">
      <h1 className="text-3xl font-bold mb-8">My Next.js & Go Application</h1>
      
      <div className="inline-block p-6 border border-gray-300 rounded-lg shadow-sm">
        <p className="m-0 text-gray-500 text-sm">Backend says:</p>
        <h2 className="mt-2 text-2xl font-semibold text-blue-600">
          {message}
        </h2>
      </div>
    </main>
  );
}