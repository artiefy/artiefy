'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useOnClickOutside } from '~/hooks/use-on-click-outside';
import { Button } from '~/components/admin/ui/button';
import { Card } from '~/components/admin/ui/card';
import { MessageCircle } from 'lucide-react';
import { ChatHeader } from '~/components/admin/ui/ChatHeader';
import { ChatContent } from './ChatContent';
import { ChatInput } from '~/components/admin/ui/ChatInput';
import type { Contacto, Conversacion, Mensaje } from '~/types/chat';

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [conversacionActiva, setConversacionActiva] =
    useState<Conversacion | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensajeAResponder, setMensajeAResponder] = useState<Mensaje | null>(null);
  const [mensajeProgramado, setMensajeProgramado] = useState<{ texto: string; fecha: Date } | null>(null);
  const [mostrarSeleccionContactos, setMostrarSeleccionContactos] = useState(false);

  // CORRECCIÓN: Asegurar que useRef no tenga problemas de tipo
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const { theme, setTheme } = useTheme();

  // Simulación de contactos
  const contactos: Contacto[] = [
    { id: '1', nombre: 'Juan', apellido: 'Pérez', rol: 'Estudiante', estado: 'en_linea', avatar: '/placeholder.svg', ticketsPendientes: 2 },
    { id: '2', nombre: 'María', apellido: 'González', rol: 'Admin', estado: 'ausente', avatar: '/placeholder.svg', ticketsPendientes: 0 },
    { id: '3', nombre: 'Carlos', apellido: 'Rodríguez', rol: 'Técnico', estado: 'ocupado', avatar: '/placeholder.svg', ticketsPendientes: 5 },
  ];

  useEffect(() => {
    setConversaciones([
      {
        contacto: contactos[0],
        mensajes: [
          { id: '1', texto: 'Hola, ¿cómo puedo ayudarte?', fecha: new Date(), emisorId: contactos[0].id, receptorId: 'usuario', leido: true, reacciones: [], editado: false },
        ],
      },
    ]);
  }, []);

  useEffect(() => {
    document.title = isOpen ? 'Chat de Soporte' : 'Sistema de Soporte de Tickets';
  }, [isOpen]);

  useOnClickOutside(chatContainerRef, () => {
	if (isOpen) {
	  setIsOpen(false);
	  setMostrarSeleccionContactos(false);
	}
  });

  const iniciarConversacion = (contacto: Contacto) => {
    const conversacionExistente = conversaciones.find(c => c.contacto.id === contacto.id);
    if (conversacionExistente) {
      setConversacionActiva(conversacionExistente);
    } else {
      const nuevaConversacion: Conversacion = { contacto, mensajes: [] };
      setConversaciones(prev => [...prev, nuevaConversacion]);
      setConversacionActiva(nuevaConversacion);
    }
    setMostrarSeleccionContactos(false);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={chatContainerRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="flex h-[600px] w-[400px] flex-col overflow-hidden shadow-2xl">
            <ChatHeader
              conversacionActiva={conversacionActiva}
              setConversacionActiva={setConversacionActiva}
              setMostrarSeleccionContactos={setMostrarSeleccionContactos}
              setIsOpen={setIsOpen}
            />
            <ChatContent
						  conversacionActiva={conversacionActiva}
						  mostrarSeleccionContactos={mostrarSeleccionContactos || !conversacionActiva}
						  busqueda={busqueda}
						  setBusqueda={setBusqueda}
						  iniciarConversacion={iniciarConversacion}
						  contactos={contactos}
						  conversaciones={conversaciones}
						  setConversacionActiva={setConversacionActiva} enviarMensaje={function (texto: string, imagen?: string, archivo?: { nombre: string; tipo: string; url: string; }, audio?: string): void {
							  throw new Error('Function not implemented.');
						  } } escribiendo={false} mensajeAResponder={null} setMensajeAResponder={function (mensaje: Mensaje | null): void {
							  throw new Error('Function not implemented.');
						  } } agregarReaccion={function (mensajeId: string, emoji: string): void {
							  throw new Error('Function not implemented.');
						  } } editarMensaje={function (mensajeId: string, nuevoTexto: string): void {
							  throw new Error('Function not implemented.');
						  } } eliminarMensaje={function (mensajeId: string): void {
							  throw new Error('Function not implemented.');
						  } }            />
            {conversacionActiva && (
              <ChatInput
                enviarMensajeAction={() => {}}
                mensajeAResponder={mensajeAResponder}
                setMensajeAResponderAction={setMensajeAResponder}
              />
            )}
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Button
            onClick={() => {
              setIsOpen(true);
              setMostrarSeleccionContactos(true);
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl"
          >
            <MessageCircle className={`h-8 w-8 ${theme === 'dark' ? 'text-yellow-400' : 'text-blue-500'}`} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatButton;
