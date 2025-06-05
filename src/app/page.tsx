'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperPlaneIcon } from '@radix-ui/react-icons';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = async () => {
    if (!input.trim() || loading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.answer || 'Sorry, I encountered an error. Please try again later.',
        role: 'assistant'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Error talking to the assistant.',
        role: 'assistant'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Typing indicator component (nested inside page)
  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Ibrahim Nexus</h1>
      <p className="text-sm text-gray-500 mb-6">Ask about my projects, skills, or experience</p>
      
      {/* Chat container */}
      <div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>How can I help you with Ibrahim's professional background?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'}`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
          placeholder="Ask about my projects..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={askQuestion}
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <PaperPlaneIcon className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        I can only answer professional questions about Ibrahim's work
      </p>
    </main>
  );
}