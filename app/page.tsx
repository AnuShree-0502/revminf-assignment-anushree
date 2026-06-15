'use client';

import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Add empty AI message for streaming
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let aiMessage = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        aiMessage += chunk;
        
        // Update last AI message with streaming content
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: aiMessage };
          return updated;
        });
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Revminf AI Chat 🤖</h1>
      
      <div style={{ 
        border: '1px solid #ccc', 
        height: '400px', 
        overflowY: 'auto', 
        padding: '10px', 
        marginBottom: '10px' 
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <b>{m.role === 'user' ? 'You' : 'AI'}:</b> {m.content}
          </div>
        ))}
        {loading && <div>AI is typing...</div>}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
