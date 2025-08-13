import { Dialog } from '@headlessui/react';

import CourseVideo from './CourseVideo';

interface CourseModalTeamsProps {
  open: boolean;
  title: string;
  videoKey: string;
  onClose: () => void;
  progress?: number; // <-- Nuevo prop opcional
}

const CourseModalTeams: React.FC<CourseModalTeamsProps> = ({
  open,
  title,
  videoKey,
  onClose,
  progress,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
  >
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex w-full max-w-2xl flex-col gap-4 rounded-lg bg-white p-6 shadow-lg">
        <button
          className="absolute top-3 right-3 z-20 text-2xl font-bold text-gray-700 hover:text-red-600"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          ×
        </button>
        <h2 className="mb-2 text-lg font-bold text-gray-900">{title}</h2>
        <div className="rounded-lg bg-black p-2 pb-4">
          <CourseVideo videoKey={videoKey} progress={progress} />
        </div>
      </div>
    </div>
  </Dialog>
);

export default CourseModalTeams;
