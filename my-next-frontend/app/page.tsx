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
  const [statusMsg, setStatusMsg] = useState("");

  // Modal & Auth State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"add" | "delete" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  // 2. Intercept Form Submission
  const requestAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setModalAction("add");
    setIsModalOpen(true);
  };

  // 3. Intercept Deletion
  const requestDelete = (id: number) => {
    setItemToDelete(id);
    setModalAction("delete");
    setIsModalOpen(true);
  };

  // 4. Execute the authorized action via the Modal
  const executeAction = async () => {
    if (!adminKey) {
      alert("Please enter your Admin Secret Key.");
      return;
    }

    setIsModalOpen(false); // Close modal while processing
    setStatusMsg("Processing...");

    if (modalAction === "add") {
      try {
        const res = await fetch("/api/wiki", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
    } else if (modalAction === "delete" && itemToDelete !== null) {
      try {
        const res = await fetch(`/api/wiki/${itemToDelete}`, {
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
    }

    // Reset modal states
    setAdminKey("");
    setModalAction(null);
    setItemToDelete(null);
    setShowPassword(false);
  };

  // Cancel Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setAdminKey("");
    setModalAction(null);
    setItemToDelete(null);
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8 relative">
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
            
            <form onSubmit={requestAdd} className="space-y-4">
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
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter the detailed answer here..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 shadow-sm mt-2"
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
                      onClick={() => requestDelete(pair.id)}
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

      {/* Auth Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Authentication Required</h3>
            <p className="text-sm text-gray-500 mb-5">
              Please enter your Admin Secret Key to {modalAction === 'add' ? 'save this new entry' : 'delete this entry'}.
            </p>
            
            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 pr-10"
                placeholder="Enter Secret Key"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') executeAction();
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-green-700 focus:outline-none"
              >
                {/* Eye / Eye-slash SVG Toggle */}
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition duration-200 shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}