import React, { useState } from 'react';

interface ModalFormProgramProps {
    isOpen: boolean;
    onSubmitAction: (
        id: string,
        title: string,
        description: string,
        file: File | null,
        categoryid: number,
        modalidadesid: number,
        nivelid: number,
        rating: number,
        addParametros: boolean,
        coverImageKey: string,
        fileName: string
    ) => void;
    editingProgramId: number;
    title: string;
    description: string;
    categoryid: number;
    modalidadesid: number;
    nivelid: number;
    coverImageKey: string;
    parametros: {
        id: number;
        name: string;
        description: string;
        porcentaje: number;
    }[];
    rating: number;
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    setCategoryid: (categoryid: number) => void;
    setModalidadesid: (modalidadesid: number) => void;
    setNivelid: (nivelid: number) => void;
    setCoverImageKey: (coverImageKey: string) => void;
    setParametrosAction: (parametros: {
        id: number;
        name: string;
        description: string;
        porcentaje: number;
    }[]) => void;
    setRating: (rating: number) => void;
    onCloseAction: () => void;
    uploading: boolean;
}



const ModalFormProgram: React.FC<ModalFormProgramProps> = ({
    isOpen,
    onSubmitAction,
    editingProgramId,
    title,
    description,
    categoryid,
    modalidadesid,
    nivelid,
    coverImageKey,
    parametros,
    rating,
    setTitle,
    setDescription,
    setCategoryid,
    setModalidadesid,
    setNivelid,
    setCoverImageKey,
    setParametrosAction,
    setRating,
    onCloseAction,
    uploading,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setFileName(e.target.files[0].name);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmitAction(
            editingProgramId.toString(),
            title,
            description,
            file,
            categoryid,
            modalidadesid,
            nivelid,
            rating,
            false, // addParametros value
            coverImageKey,
            fileName    
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Editar Programa</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                            Título
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
                            Imagen de portada
                        </label>
                        <input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryid">
                            Categoría
                        </label>
                        <input
                            id="categoryid"
                            type="number"
                            value={categoryid}
                            onChange={(e) => setCategoryid(parseInt(e.target.value))}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="modalidadesid">
                            Modalidad
                        </label>
                        <input
                            id="modalidadesid"
                            type="number"
                            value={modalidadesid}
                            onChange={(e) => setModalidadesid(parseInt(e.target.value))}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nivelid">
                            Nivel
                        </label>
                        <input
                            id="nivelid"
                            type="number"
                            value={nivelid}
                            onChange={(e) => setNivelid(parseInt(e.target.value))}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">
                            Calificación
                        </label>
                        <input
                            id="rating"
                            type="number"
                            value={rating}
                            onChange={(e) => setRating(parseInt(e.target.value))}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            disabled={uploading}
                        >
                            {uploading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                        <button
                            type="button"
                            onClick={onCloseAction}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalFormProgram;