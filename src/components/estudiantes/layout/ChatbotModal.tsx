import { useState, useRef, useEffect } from 'react';
import { BsPersonCircle } from 'react-icons/bs';
import { FaRobot } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';

const ChatbotModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I assist you today?', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
  }

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newUserMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: "Thank you for your message. I'm processing your request.",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-secondary p-4 text-white shadow-lg transition-all duration-300 hover:border-2 hover:border-primary hover:bg-background"
        style={{ display: isOpen ? 'none' : 'block' }}
      >
        <FaRobot className="text-2xl" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <FaRobot className="text-2xl text-secondary" />
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  Arti IA
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
                aria-label="Close chat"
              >
                <IoMdClose className="text-xl text-gray-500" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[80%] items-start space-x-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {message.sender === 'bot' ? (
                      <FaRobot className="mt-2 text-xl text-secondary" />
                    ) : (
                      <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                    )}
                    <div
                      className={`rounded-lg p-3 ${message.sender === 'user' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 p-3">
                    <div className="flex space-x-2">
                      <div className="size-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div className="size-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                      <div className="size-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="border-t border-gray-200 p-4"
            >
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-gray-300 p-2 text-background focus:outline-none focus:ring-2 focus:ring-secondary"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-secondary p-2 text-white transition-colors hover:bg-secondary disabled:bg-background"
                  aria-label="Send message"
                >
                  <FiSend className="text-xl" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotModal;
