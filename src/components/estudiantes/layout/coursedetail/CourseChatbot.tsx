'use client';

import { useEffect, useRef, useState } from 'react';

import { BsPersonCircle } from 'react-icons/bs';
import { FaRobot } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'sonner';

import '~/styles/chatmodal.css';

interface CourseChatbotProps {
  isEnrolled: boolean;
}

const CourseChatbot: React.FC<CourseChatbotProps> = ({ isEnrolled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: '¡Hola! ¿En qué puedo ayudarte hoy?', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEnrolled) {
      toast.error('Debes estar inscrito en el curso para usar el chat', {
        description: 'Por favor, inscríbete primero para acceder al chat.',
        action: {
          label: 'Cerrar',
          onClick: () => console.log('Cerrado'),
        },
      });
      return;
    }
    if (!inputText.trim()) return;

    const newUserMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user' as const,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: 'Gracias por tu mensaje. Estoy procesando tu solicitud.',
        sender: 'bot' as const,
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleClick = () => {
    if (!isEnrolled) {
      toast.error('Acceso restringido', {
        description:
          'Se necesita estar inscrito al curso para poder usar la IA de Artie',
        action: {
          label: 'Entendido',
          onClick: () => console.log('Closed'),
        },
        duration: 5000,
      });
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`button ${!isEnrolled && 'cursor-not-allowed opacity-50'}`}
        style={{ display: isOpen ? 'none' : 'flex' }}
        aria-label={
          isEnrolled
            ? 'Abrir chat'
            : 'Chat disponible solo para estudiantes inscritos'
        }
      >
        <div className="button__text">
          {Array.from('-ARTI-IA-ARTI-IA').map((char, i) => (
            <span key={i} style={{ '--index': i } as React.CSSProperties}>
              {char}
            </span>
          ))}
        </div>
        <div className="button__circle">
          <FaRobot className="button__icon" aria-hidden="true" />
          <FaRobot
            className="button__icon button__icon--copy"
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && isEnrolled && (
        <div className="chat-modal">
          <div
            className="chat-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="chat-header">
              <div className="flex items-center space-x-2">
                <FaRobot className="text-secondary text-2xl" />
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  Artie IA
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
                aria-label="Cerrar chat"
              >
                <IoMdClose className="text-xl text-gray-500" />
              </button>
            </div>

            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`flex max-w-[80%] items-start space-x-2 ${
                      message.sender === 'user'
                        ? 'flex-row-reverse space-x-reverse'
                        : 'flex-row'
                    }`}
                  >
                    {message.sender === 'bot' ? (
                      <FaRobot className="text-secondary mt-2 text-xl" />
                    ) : (
                      <BsPersonCircle className="mt-2 text-xl text-gray-500" />
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
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
                      <div className="loading-dot" />
                      <div className="loading-dot" />
                      <div className="loading-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="input-container">
              <div className="flex w-full space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isEnrolled
                      ? 'Escribe tu mensaje...'
                      : 'Inscríbete para chatear'
                  }
                  className="focus:ring-secondary flex-1 rounded-lg border border-gray-300 p-2 text-white focus:ring-2 focus:outline-none"
                  disabled={!isEnrolled || isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-secondary rounded-lg px-4 text-white transition-colors hover:bg-[#00A5C0] disabled:bg-gray-300"
                  aria-label="Enviar mensaje"
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

export default CourseChatbot;
