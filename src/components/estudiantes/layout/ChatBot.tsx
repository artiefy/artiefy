import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaRobot } from 'react-icons/fa';
import '~/styles/chatmodal.css'; // Import the CSS file

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { text: string; sender: string }[]
  >([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      setChatMessages([
        ...chatMessages,
        { text: messageInput, sender: 'user' },
      ]);
      setMessageInput('');
      setIsLoading(true);
      // Simulate chatbot response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            text: '¡Gracias por tu mensaje! ¿Cómo puedo ayudarte hoy?',
            sender: 'bot',
          },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <>
      {/* Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`button ${isOpen ? 'bg-gray-200' : ''}`}
      >
        <div className="button__text">
          {Array.from("-ARTI-IA-ARTI-IA").map((char, i) => (
            <span key={i} style={{ "--index": i } as React.CSSProperties}>
              {char}
            </span>
          ))}
        </div>
        <div className="button__circle">
          <FaRobot className="button__icon" />
          <FaRobot className="button__icon button__icon--copy" />
        </div>
      </button>

      {/* Modal del Chatbot */}
      {isOpen && (
        <div className="fixed bottom-32 right-6 w-96 rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-bold text-gray-800">Arti IA</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>
          <div className="h-96 space-y-4 overflow-y-auto p-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 p-3">
                  <div className="flex space-x-2">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 rounded-lg border p-2 text-background focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-secondary px-4 py-2 text-white transition-all disabled:bg-gray-300 hover:bg-[#00A5C0]"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;