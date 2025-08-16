import CourseVideo from './CourseVideo';

interface CoursePlayerProps {
  title: string;
  videoKey: string;
  onClose: () => void;
  progress?: number; // <-- Nuevo prop opcional
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({
  title,
  videoKey,
  onClose,
  progress,
}) => (
  <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white p-0 shadow-lg">
    <button
      className="absolute top-2 right-2 z-20 text-2xl font-bold text-gray-700 hover:text-red-600"
      onClick={onClose}
      aria-label="Cerrar"
      type="button"
    >
      ×
    </button>
    <div className="p-4 pb-0">
      <h2 className="mb-2 text-lg font-bold text-gray-900">{title}</h2>
    </div>
    <div className="p-0">
      <CourseVideo videoKey={videoKey} progress={progress} />
    </div>
  </div>
);

export default CoursePlayer;
