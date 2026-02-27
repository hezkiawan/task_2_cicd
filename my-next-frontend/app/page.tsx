"use client";

import { useState, useEffect } from "react";

// Define the shape of our data based on the Go backend struct
interface QAPair {
  id: number;
  question: string;
  answer: string;
}

export default function Home() {
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // 1. Fetch all Q&A pairs (GET /api/wiki)
  const fetchQA = async () => {
    try {
      const res = await fetch("/api/wiki");
      if (res.ok) {
        const data = await res.json();
        setQaPairs(data || []); // Fallback to empty array if data is null
      } else {
        setStatusMsg("Failed to load Wiki entries.");
      }
    } catch (error) {
      console.error(error);
      setStatusMsg("Error connecting to server.");
    }
  };

  // Load the data when the component first mounts
  useEffect(() => {
    fetchQA();
  }, []);

  // 2. Add a new Q&A pair (POST /api/wiki)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("Submitting...");

    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The API_KEY goes right here in the Authorization header
          "Authorization": adminKey,
        },
        body: JSON.stringify({ question, answer }),
      });

      if (res.ok) {
        setStatusMsg("✅ Q&A added successfully!");
        setQuestion("");
        setAnswer("");
        fetchQA(); // Refresh the list
      } else if (res.status === 401) {
        setStatusMsg("❌ Unauthorized: Invalid Admin Secret Key.");
      } else {
        setStatusMsg("❌ Failed to add Q&A.");
      }
    } catch (error) {
      console.error(error);
      setStatusMsg("❌ Error connecting to server.");
    }
  };

  // 3. Delete a Q&A pair (DELETE /api/wiki/{id})
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`/api/wiki/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": adminKey,
        },
      });

      if (res.ok) {
        setStatusMsg("✅ Entry deleted.");
        fetchQA(); // Refresh the list
      } else if (res.status === 401) {
        setStatusMsg("❌ Unauthorized: Invalid Admin Secret Key.");
      } else {
        setStatusMsg("❌ Failed to delete entry.");
      }
    } catch (error) {
      console.error(error);
      setStatusMsg("❌ Error connecting to server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-green-700 tracking-tight">
            AI Wiki Admin
          </h1>
          <p className="text-gray-500 mt-2">Manage internal knowledge base Q&A pairs</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Add New Entry</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., What is Kouventa?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter the detailed answer here..."
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Secret Key</label>
                <input
                  type="password"
                  required
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Enter API Key to authenticate"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 shadow-sm"
              >
                Save Entry
              </button>

              {statusMsg && (
                <div className="mt-4 text-sm font-medium text-center text-gray-700 bg-gray-100 py-2 rounded-md">
                  {statusMsg}
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Display List */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Current Knowledge Base</h2>
            
            {qaPairs.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                No entries found. Add your first Q&A pair!
              </div>
            ) : (
              <div className="space-y-4">
                {qaPairs.map((pair) => (
                  <div key={pair.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start group">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Q: {pair.question}</h3>
                      <p className="text-gray-600 mt-2 whitespace-pre-wrap">A: {pair.answer}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(pair.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-4"
                      title="Delete Entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}