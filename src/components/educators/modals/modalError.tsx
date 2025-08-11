import { useEffect, useState } from "react";

import { useUser } from "@clerk/nextjs";
import { IoMdClose } from "react-icons/io";

// Interfaz para los errores del formulario
type FormErrors = Record<string, string>;

export const ModalError = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { user } = useUser(); // Obtiene el usuario actual
  const [formData, setFormData] = useState({
    description: "",
    comments: "",
    email: "",
    userId: user?.id ?? "",
  }); // Estado para los datos del formulario
  const [errors, setErrors] = useState<FormErrors>({}); // Estado para los errores del formulario

  // Maneja el cambio en los campos del formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Efecto para actualizar el ID del usuario
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      userId: user?.id ?? "",
    }));
  }, [user]);

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = "Error description is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.userId.trim()) {
      newErrors.userId = "User ID is required";
    }
    if (!formData.comments.trim()) {
      newErrors.comments = "Comments are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", formData);
      try {
        const response = await fetch("/api/tickets", {
          method: "POST",
          body: JSON.stringify(formData),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data: { message?: string } = (await response.json()) as {
          message?: string;
        };
        console.log(`Datos enviados al servidor: ${JSON.stringify(data)}`);
        if (response.ok) {
          alert("Ticket creado exitosamente");
        } else {
          alert("Error al crear el ticket");
        }
      } catch (error) {
        console.error("Error al crear el ticket:", error);
      }
      onClose();
      setFormData({
        description: "",
        comments: "",
        email: "",
        userId: user?.id ?? "",
      });
    }
  };

  // Renderiza el modal
  if (!isOpen) return null;

  // Vistas del modal
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Reportar un error
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-400 focus:outline-none"
            >
              <IoMdClose className="text-4xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                <span className="text-red-500">*</span>Descripcion del error
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border border-gray-400 p-2 text-black shadow-sm outline-none focus:border-red-500 focus:ring-red-500 ${
                  errors.description ? "border-red-500" : ""
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="comments"
                className="block text-sm font-medium text-gray-700"
              >
                Comentarios adicionales
              </label>
              <textarea
                id="comments"
                name="comments"
                rows={3}
                value={formData.comments}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-400 p-2 text-black shadow-sm outline-none focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                <span className="text-red-500">*</span>Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border border-gray-400 p-2 text-black shadow-sm outline-none focus:border-red-500 focus:ring-red-500 ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
