"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Select from "react-select";

import { Modal } from "~/components/shared/Modal";

export interface Ticket {
  id: string;
  email: string;
  description: string;
  tipo: string;
  estado: string;
  assignedToId?: string; // ← este puede quedarse si sigues mostrando un único nombre
  assignedToIds?: string[]; // ✅ AGREGA ESTA LÍNEA
  creatorName?: string;
  creatorEmail?: string;
  comments?: string;
  coverImageKey?: string;
  videoKey?: string;
  documentKey?: string;

  creatorId?: string;
}

export interface TicketFormData {
  email: string;
  description: string;
  tipo: string;
  estado: string;
  assignedToIds?: string[];
  comments?: string;
  coverImageKey?: string;
  videoKey?: string;
  documentKey?: string;
  newComment?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface TicketModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: (data: TicketFormData) => void;
  ticket?: Ticket | null;
  onUploadFileAction: (
    field: "coverImageKey" | "videoKey" | "documentKey",
    file: File,
  ) => Promise<string | null>;
}

interface UploadResponse {
  url: string;
  fields: Record<string, string>;
  key: string;
  uploadType: "simple" | "put";
}

export default function TicketModal({
  isOpen,
  onCloseAction,
  onSubmitAction,
  ticket,
  onUploadFileAction,
}: TicketModalProps) {
  const { user } = useUser();

  const initialFormState = useMemo<TicketFormData>(
    () => ({
      assignedToIds: [],
      email: "",
      description: "",
      comments: "",
      estado: "abierto",
      tipo: "otro",
      coverImageKey: "",
      videoKey: "",
      documentKey: "",
      newComment: "",
    }),
    [],
  );

  const [formData, setFormData] = useState<TicketFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setIsLoadingAdmins(true);
        const response = await fetch("/api/admin/users/admins");
        if (!response.ok) throw new Error("Failed to fetch admins");
        const data = (await response.json()) as AdminUser[];
        setAdmins(data);
      } catch (error) {
        console.error("Error loading admins:", error);
      } finally {
        setIsLoadingAdmins(false);
      }
    };

    if (isOpen) void fetchAdmins();
  }, [isOpen]);

  useEffect(() => {
    if (ticket) {
      console.log("👤 Ticket recibido:", ticket);

      setFormData({
        assignedToIds: ticket.assignedToIds ?? [],
        email: ticket.email ?? "",
        description: ticket.description ?? "",
        comments: ticket.comments ?? "",
        estado: ticket.estado ?? "abierto",
        tipo: ticket.tipo ?? "otro",
        coverImageKey: ticket.coverImageKey ?? "",
        videoKey: ticket.videoKey ?? "",
        documentKey: ticket.documentKey ?? "",
        newComment: "",
      });
    } else {
      setFormData(initialFormState);
    }
  }, [ticket, initialFormState]);
  // 🧠 Asegura que los asignados se sincronicen correctamente cuando los admins se cargan
  useEffect(() => {
    if (!ticket) return;

    const assigned = ticket.assignedToIds ?? [];

    // Solo actualiza si hay datos y admins ya cargados
    if (assigned.length > 0 && admins.length > 0) {
      setFormData((prev) => ({
        ...prev,
        assignedToIds: assigned,
      }));
    }
  }, [admins, ticket]);

  useEffect(() => {
    const fetchComments = async () => {
      if (isOpen && ticket?.id) {
        setIsLoadingComments(true);
        try {
          const response = await fetch(
            `/api/admin/tickets/${ticket.id}/comments`,
          );
          if (!response.ok) throw new Error("Failed to fetch comments");
          const data = (await response.json()) as Comment[];
          setComments(data);
        } catch (error) {
          console.error("Error fetching comments:", error);
        } finally {
          setIsLoadingComments(false);
        }
      }
    };

    void fetchComments();
  }, [isOpen, ticket?.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const submitData = {
      ...formData,
      videoKey: formData.videoKey ?? undefined,
      documentKey: formData.documentKey ?? undefined,
      coverImageKey: formData.coverImageKey ?? undefined,
    };
    console.log("📤 Enviando desde el modal:", submitData);

    if (!submitData.assignedToIds || submitData.assignedToIds.length === 0) {
      delete submitData.assignedToIds;
    }

    await Promise.resolve(onSubmitAction(submitData));

    setIsSubmitting(false);
    onCloseAction();
  };

  const handleFileUpload =
    (keyField: "coverImageKey" | "videoKey" | "documentKey") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: JSON.stringify({
            contentType: file.type,
            fileSize: file.size,
            fileName: file.name,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const uploadData = (await res.json()) as UploadResponse;
        const { url, fields, key, uploadType } = uploadData;

        if (uploadType === "simple") {
          const formDataUpload = new FormData();
          Object.entries(fields).forEach(([k, v]) =>
            formDataUpload.append(k, v),
          );
          formDataUpload.append("file", file);
          await fetch(url, { method: "POST", body: formDataUpload });
        } else {
          await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
        }

        setFormData((prev) => ({
          ...prev,
          [keyField]: key,
        }));
      } catch (error) {
        console.error("Error al subir archivo:", error);
      }
    };
  void handleFileUpload;
  void onUploadFileAction;
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseAction}
      title={
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          {ticket ? "Editar Ticket" : "Crear Nuevo Ticket"}
        </span>
      }
    >
      <div className="relative max-h-[80vh] overflow-y-auto px-4 pb-6">
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Info del creador */}
          {ticket?.creatorName && (
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
              <p className="text-sm text-gray-400">
                Creado por:{" "}
                <span className="font-medium text-white">
                  {ticket.creatorName}
                </span>
              </p>
            </div>
          )}

          {/* Grid principal responsivo */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Primera columna */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Asignar a
                </label>

                <Select
                  isMulti
                  isLoading={isLoadingAdmins}
                  options={admins.map((admin) => ({
                    value: admin.id,
                    label: `${admin.name} - ${admin.email}`,
                  }))}
                  value={
                    admins.length > 0
                      ? admins
                          .filter((a) => formData.assignedToIds?.includes(a.id))
                          .map((a) => ({
                            value: a.id,
                            label: `${a.name} - ${a.email}`,
                          }))
                      : []
                  }
                  onChange={(selectedOptions) =>
                    setFormData({
                      ...formData,
                      assignedToIds: selectedOptions.map((opt) => opt.value),
                    })
                  }
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "#01142B", // -background
                      borderColor: "#00BDD8", // -secondary
                      color: "#3AF4EF", // -primary
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#01142B", // -background
                      color: "#3AF4EF", // -primary
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? "#00A5C0" : "#01142B", // hover : normal
                      color: "#3AF4EF",
                      cursor: "pointer",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#00BDD8",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#01142B", // fondo claro, texto oscuro
                      fontWeight: 600,
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#01142B",
                      ":hover": {
                        backgroundColor: "#3AF4EF",
                        color: "#01142B",
                      },
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#3AF4EF",
                      opacity: 0.6,
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "#3AF4EF",
                    }),
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email de contacto
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2.5 text-sm text-white shadow-inner transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Tipo de Solicitud
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2.5 text-sm text-white shadow-inner transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="otro">Otro</option>
                  <option value="bug">Bug</option>
                  <option value="revision">Revisión</option>
                  <option value="logs">Logs</option>
                </select>
              </div>
            </div>

            {/* Segunda columna */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2.5 text-sm text-white shadow-inner transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="abierto">Abierto</option>
                  <option value="en proceso">En Proceso</option>
                  <option value="en revision">En Revisión</option>
                  <option value="solucionado">Solucionado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2.5 text-sm text-white shadow-inner transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Comentarios
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2.5 text-sm text-white shadow-inner transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Media uploads */}
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
            <h3 className="mb-4 text-sm font-medium text-white">
              Archivos Adjuntos
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Imagen */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  📷 Imagen de Soporte
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    console.log("📁 Subiendo archivo:", file.name);
                    const key = await onUploadFileAction("coverImageKey", file);
                    console.log("✅ Key recibido del upload:", key);
                    if (key) {
                      setFormData((prev) => ({ ...prev, coverImageKey: key }));
                    }
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-sm text-white"
                />

                {formData.coverImageKey && (
                  <div className="relative h-32 overflow-hidden rounded-lg border border-gray-600">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${formData.coverImageKey}`}
                      alt="Imagen subida"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  🎥 Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    console.log("📁 Subiendo archivo:", file.name);
                    const key = await onUploadFileAction("videoKey", file);
                    console.log("✅ Key recibido del upload:", key);

                    if (key) {
                      setFormData((prev) => ({
                        ...prev,
                        videoKey: key,
                      }));
                    }
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-sm text-white"
                />

                {formData.videoKey && (
                  <div className="relative h-32 overflow-hidden rounded-lg border border-gray-600">
                    <video controls className="h-full w-full object-contain">
                      <source
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${formData.videoKey}`}
                        type="video/mp4"
                      />
                    </video>
                  </div>
                )}
              </div>

              {/* Documento */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  📄 Documento
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const key = await onUploadFileAction("documentKey", file);
                    if (key) {
                      setFormData((prev) => ({ ...prev, documentKey: key }));
                    }
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-sm text-white"
                />

                {formData.documentKey && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${formData.documentKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/20"
                  >
                    📄 Ver Documento
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Agregar Comentario Principal
              </label>
              <textarea
                value={formData.newComment}
                onChange={(e) =>
                  setFormData({ ...formData, newComment: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2.5 text-sm text-white shadow-inner transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Escribe un nuevo comentario..."
              />
            </div>

            {/* Comments history */}
            {ticket && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">
                  Historial de Comentarios
                </h3>
                <div className="max-h-60 space-y-3 overflow-y-auto rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-blue-400">
                            {comment.user?.name || "Usuario"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-gray-500">
                      No hay comentarios
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-700 bg-gray-900/80 pt-4 backdrop-blur">
            <button
              type="button"
              onClick={onCloseAction}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2 text-sm font-medium text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : ticket ? (
                "Actualizar Ticket"
              ) : (
                "Crear Ticket"
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
