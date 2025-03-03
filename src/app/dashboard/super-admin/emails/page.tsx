'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import ResponsiveSidebar from '../components/ResponsiveSidebar';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function EmailSender() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewAttachments, setPreviewAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const userInputRef = useRef<HTMLDivElement>(null);

  // 🔹 Obtener usuarios
  useEffect(() => {
    async function fetchUsers() {
      console.log('📡 Cargando usuarios...');
      try {
        const response = await fetch('/api/super-admin/emails', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = (await response.json()) as User[];
        console.log('✅ Usuarios obtenidos:', data);
        setUsers(data);
      } catch (error) {
        console.error('❌ Error al obtener los usuarios:', error);
      }
    }
    fetchUsers();
  }, []);

  // 🔹 Manejar selección de usuarios
  const handleUserSelection = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
    setShowUserList(false);
    console.log('✅ Usuarios seleccionados:', selectedEmails);
  };

  // 🔹 Eliminar usuario seleccionado
  const removeUserTag = (email: string) => {
    setSelectedEmails(prev => prev.filter(e => e !== email));
    console.log('❌ Usuario eliminado:', email);
  };

  // 🔹 Manejar archivos adjuntos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setAttachments((prev) => [...prev, ...filesArray]);

      const previewUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewAttachments((prev) => [...prev, ...previewUrls]);

      console.log('📎 Archivos adjuntados:', filesArray.map(f => f.name));
    }
  };

  // 🔹 Eliminar archivo adjunto
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewAttachments((prev) => prev.filter((_, i) => i !== index));
    console.log('❌ Archivo eliminado, archivos restantes:', attachments.map(a => a.name));
  };

  // 🔹 Enviar correo
  const sendEmail = async () => {
    console.log('📩 Enviando correo...');
    if (!subject || !message || (selectedEmails.length === 0 && !customEmails.trim())) {
      setNotification({ message: 'Todos los campos son obligatorios', type: 'error' });
      console.error('❌ Error: Faltan datos obligatorios');
      return;
    }

    setLoading(true);

    const emails = [...selectedEmails, ...customEmails.split(',').map((e) => e.trim())];

    const body = {
      subject,
      message,
      emails,
    };

    // Enviar la solicitud como JSON
    try {
      const response = await fetch('/api/super-admin/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  // Enviar como JSON
        },
        body: JSON.stringify(body),  // Convertir el cuerpo a JSON
      });

      if (!response.ok) throw new Error('Error al enviar el correo');

      console.log('✅ Correo enviado con éxito');

      setNotification({ message: 'Correo enviado correctamente', type: 'success' });
      setAttachments([]);
      setPreviewAttachments([]);
      setSubject('');
      setMessage('');
      setSelectedEmails([]);
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      setNotification({ message: 'Error al enviar el correo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveSidebar>
      <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">Enviar Correo</h2>

        {/* Asunto */}
        <input
          type="text"
          className="mb-4 w-full rounded-lg bg-gray-800 p-3 text-white border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Asunto"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* Usuarios seleccionados como tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedEmails.map((email) => (
            <span key={email} className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center">
              {email}
              <button onClick={() => removeUserTag(email)} className="ml-2 text-white text-lg">✕</button>
            </span>
          ))}
        </div>

        {/* Input de búsqueda y lista de usuarios */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Seleccionar usuarios..."
            className="w-full p-3 bg-gray-800 rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowUserList(!showUserList)}
            onChange={(e) => setSearch(e.target.value)}
          />
          {showUserList && (
            <div className="absolute z-10 w-full bg-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
              {users
                .filter(user =>
                  user.name.toLowerCase().includes(search.toLowerCase()) ||
                  user.email.toLowerCase().includes(search.toLowerCase())
                )
                .map(user => (
                  <div key={user.id} className="p-3 hover:bg-blue-500 cursor-pointer" onClick={() => handleUserSelection(user.email)}>
                    {user.name} - {user.email}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Cuerpo del correo */}
        <SunEditor
          setContents={message}
          setOptions={{
            buttonList: [['bold', 'italic', 'underline', 'strike'], ['list', 'align'], ['link', 'image', 'table']]
          }}
          onChange={setMessage}
          placeholder="Escribe tu mensaje..."
          className="w-full bg-gray-800 text-white p-4 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-blue-500"
        />

        {/* Adjuntar archivos con vista previa */}
        <div className="mb-4 flex flex-wrap gap-4">
          {previewAttachments.map((src, index) => (
            <div key={index} className="relative h-24 w-24">
              <img src={src} alt={`preview-${index}`} className="h-full w-full rounded-lg object-cover" />
              <button onClick={() => removeAttachment(index)} className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-full text-xs">✕</button>
            </div>
          ))}
          {/* Input para agregar archivos adjuntos */}
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="p-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botón de envío */}
        <div className="flex justify-center">
          <button onClick={sendEmail} className="bg-blue-600 px-6 py-3 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={loading}>
            {loading ? <Loader2 className="animate-spin text-white" /> : 'Enviar Correo'}
          </button>
        </div>
      </div>
    </ResponsiveSidebar>
  );
}
