'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  LightBulbIcon,
  StarIcon as StarSolidIcon,
  XCircleIcon,
  XMarkIcon, // <-- asegúrate de importar esto
} from '@heroicons/react/24/solid';
import { Unlock } from 'lucide-react';
import { BiSolidReport } from 'react-icons/bi';
import { BsFiletypeXls } from 'react-icons/bs';
import {
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaLink,
  FaTrophy,
} from 'react-icons/fa';
import { FaRegFileImage } from 'react-icons/fa6';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import { unlockNextLesson } from '~/server/actions/estudiantes/lessons/unlockNextLesson';
import { type Activity, type Question, type SavedAnswer } from '~/types';
import { formatScoreNumber } from '~/utils/formatScore';
import { useMediaQuery } from '~/utils/useMediaQuery'; // <-- crea este hook util

import { FileUploadForm } from './FileUploadForm';

import '~/styles/arrowactivity.css';

interface ActivityModalProps {
  isOpen: boolean;
  onCloseAction: () => void; // Renamed
  activity: Activity;
  userId: string;
  onQuestionsAnsweredAction: (allAnswered: boolean) => void; // Renamed
  markActivityAsCompletedAction: () => Promise<void>; // Renamed
  onActivityCompletedAction: () => Promise<void>; // Renamed
  savedResults?: {
    score: number;
    answers: Record<string, SavedAnswer>;
    isAlreadyCompleted?: boolean;
  } | null;
  onLessonUnlockedAction: (lessonId: number) => void; // Renamed
  isLastLesson: boolean;
  courseId: number;
  isLastActivity: boolean;
  onViewHistoryAction: () => void; // Renamed
  onActivityCompleteAction: () => void; // Renamed
  isLastActivityInLesson: boolean;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface AttemptsResponse {
  attempts: number;
  isRevisada: boolean;
  attemptsLeft: number | null; // null means infinite attempts
  lastGrade: number | null;
}

interface StoredFileInfo {
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  status: 'pending' | 'reviewed';
  grade?: number;
  feedback?: string;
  submissionType: 'file' | 'url';
  url?: string;
  comment?: string; // <-- Añade esta línea para soportar el comentario del educador
}

interface PresignedResponse {
  url: string;
  fields: Record<string, string>;
  key: string;
  fileUrl: string;
}

interface DocumentUploadResponse {
  success: boolean;
  status: 'pending' | 'reviewed';
  fileUrl: string;
  documentKey: string;
}

interface FilePreview {
  file: File;
  type: string;
  size: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

// Add this interface near the other interfaces at the top of the file
interface UrlSubmissionState {
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}

// Add this interface near the other interfaces
interface FileSubmissionResponse {
  submission: StoredFileInfo | null;
  progress: {
    isCompleted: boolean;
  } | null;
}

// Add formatFileSize as a standalone utility function
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();

  switch (type) {
    case 'pdf':
      return <FaFilePdf className="h-6 w-6 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FaFileWord className="h-6 w-6 text-blue-500" />;
    case 'ppt':
    case 'pptx':
      return <FaFilePowerpoint className="h-6 w-6 text-orange-500" />;
    case 'xls':
    case 'xlsx':
      return <BsFiletypeXls className="h-6 w-6 text-green-600" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return <FaRegFileImage className="h-6 w-6 text-purple-500" />; // Using updated icon
    default:
      return <FaLink className="h-6 w-6 text-blue-500" />;
  }
};

// Add a description ID constant
const MODAL_DESCRIPTION_ID = 'activity-modal-description';

// Add interfaces for submission tabs
interface SubmissionTab {
  id: 'local' | 'drive';
  label: string;
  icon: React.JSX.Element;
}

// Update submissionTabs constant
const submissionTabs: SubmissionTab[] = [
  {
    id: 'local',
    label: 'Archivo Local',
    icon: <Icons.arrowUpTray className="h-4 w-4" />,
  },
  {
    id: 'drive', // Keep the id the same for compatibility
    label: 'Archivo URL',
    icon: <FaLink className="h-4 w-4" />, // Changed from FaGoogleDrive to FaLink
  },
];

// Replace the validateDriveUrl function with this more generic one
const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Añade la interfaz HelpFileInfo arriba de los estados
interface HelpFileInfo {
  id: string;
  archivoKey: string;
}

export function LessonActivityModal({
  isOpen,
  onCloseAction,
  activity,
  userId,
  onQuestionsAnsweredAction,
  markActivityAsCompletedAction,
  onActivityCompletedAction,
  savedResults,
  onLessonUnlockedAction,
  isLastLesson,
  courseId,
  isLastActivity,
  onViewHistoryAction,
  onActivityCompleteAction,
  isLastActivityInLesson,
}: ActivityModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>(
    {}
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isResultsLoaded, setIsResultsLoaded] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [canCloseModal, setCanCloseModal] = useState(false); // Add new state to track if user can close modal
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] =
    useState<StoredFileInfo | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  // Add new state to track if a document was just uploaded
  const [isNewUpload, setIsNewUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
  const [driveUrl, setDriveUrl] = useState('');
  const [isUrlValid, setIsUrlValid] = useState(false);
  // Add new state for URL uploading
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);
  // Nuevo estado para el archivo de ayuda del educador
  const [helpFileInfo, setHelpFileInfo] = useState<HelpFileInfo | null>(null);
  const [isLoadingHelpFile, setIsLoadingHelpFile] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (activity?.content?.questions) {
      setQuestions(activity.content.questions);
      setIsLoading(false);
    }
  }, [activity]);

  useEffect(() => {
    if (savedResults) {
      setFinalScore(savedResults.score ?? 0);
      setUserAnswers(savedResults.answers ?? {});
      setShowResults(true);
    }
  }, [savedResults]);

  useEffect(() => {
    const checkAttempts = async () => {
      const response = await fetch(
        `/api/activities/attempts?activityId=${activity.id}&userId=${userId}`
      );
      const data = (await response.json()) as AttemptsResponse;

      // Only set attempts limit for revisada activities
      if (activity.revisada) {
        setAttemptsLeft(data.attemptsLeft ?? 3);
      } else {
        setAttemptsLeft(null); // null indicates infinite attempts
      }
    };
    void checkAttempts();
  }, [activity.id, activity.revisada, userId]);

  useEffect(() => {
    if (savedResults?.isAlreadyCompleted) {
      setShowResults(true);
      setFinalScore(savedResults.score);
      setUserAnswers(savedResults.answers);
      setIsResultsLoaded(true);
    }
  }, [savedResults]);

  useEffect(() => {
    const canClose = () => {
      // Para actividades tipo documento (typeid === 1), siempre permitir cerrar
      if (activity.typeid === 1) {
        return true;
      }

      // Si la actividad ya está completada, siempre puede cerrar
      if (savedResults?.isAlreadyCompleted || activity.isCompleted) {
        return true;
      }

      // Si no hay resultados mostrados, no puede cerrar
      if (!showResults) {
        return false;
      }

      // Para actividades revisadas
      if (activity.revisada) {
        return (
          attemptsLeft === 0 ||
          finalScore >= 3 ||
          (isLastActivity && isLastLesson)
        );
      }

      // Para actividades no revisadas, siempre puede cerrar después de ver resultados
      return true;
    };

    const newCanClose = canClose();
    if (canCloseModal !== newCanClose) {
      setCanCloseModal(newCanClose);
    }
  }, [
    showResults,
    finalScore,
    attemptsLeft,
    activity.revisada,
    activity.isCompleted,
    activity.typeid,
    savedResults?.isAlreadyCompleted,
    isLastActivity,
    isLastLesson,
    canCloseModal,
  ]);

  useEffect(() => {
    const loadDocumentInfo = async () => {
      if (activity.typeid === 1) {
        try {
          setIsLoadingDocument(true);
          const response = await fetch(
            `/api/activities/getFileSubmission?activityId=${activity.id}&userId=${userId}`
          );

          if (response.ok) {
            const data = (await response.json()) as FileSubmissionResponse;
            if (data.submission) {
              setUploadedFileInfo(data.submission);
              setShowResults(true);

              if (data.progress?.isCompleted) {
                setFilePreview(null);
                setSelectedFile(null);
              }
            }
          }
        } catch (error) {
          console.error('Error loading document info:', error);
          toast.error('Error al cargar la información del documento');
        } finally {
          setIsLoadingDocument(false);
        }
      }
    };

    void loadDocumentInfo();
  }, [activity.id, activity.typeid, userId]);

  // Nuevo useEffect para obtener el archivo de ayuda desde Upstash
  useEffect(() => {
    const fetchHelpFile = async () => {
      if (activity.typeid === 1) {
        setIsLoadingHelpFile(true);
        try {
          const res = await fetch(
            `/api/activities/getHelpFile?activityId=${activity.id}`
          );
          if (res.ok) {
            // Tipar la respuesta correctamente
            const data: unknown = await res.json();
            if (
              Array.isArray(data) &&
              data.length > 0 &&
              typeof data[0] === 'object' &&
              data[0] !== null &&
              'id' in data[0] &&
              'archivoKey' in data[0]
            ) {
              const { id, archivoKey } = data[0] as {
                id: string;
                archivoKey: string;
              };
              setHelpFileInfo({ id, archivoKey });
            } else {
              setHelpFileInfo(null);
            }
          } else {
            setHelpFileInfo(null);
          }
        } catch {
          setHelpFileInfo(null);
        } finally {
          setIsLoadingHelpFile(false);
        }
      }
    };
    void fetchHelpFile();
  }, [activity.id, activity.typeid]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceedToNext = currentQuestion && userAnswers[currentQuestion.id];

  const calculateScore = () => {
    const answers = Object.values(userAnswers);
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    return formatScoreNumber((correctAnswers / answers.length) * 5);
  };

  const checkAnswer = (questionId: string, answer: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return false;

    switch (question.type) {
      case 'VOF':
      case 'OM':
        return answer === question.correctOptionId;
      case 'COMPLETAR':
        return (
          answer.toLowerCase().trim() ===
          question.correctAnswer?.toLowerCase().trim()
        );
      default:
        return false;
    }
  };

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;

    const isCorrect = checkAnswer(currentQuestion.id, answer);
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
      },
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSavingResults(true);
      setIsResultsLoaded(false);
      const score = calculateScore();
      setFinalScore(score);
      setShowResults(true);

      const allQuestionsAnswered =
        Object.keys(userAnswers).length === (questions?.length ?? 0);

      if (!allQuestionsAnswered) {
        toast.error('Debes responder todas las preguntas');
        return;
      }

      // For non-revisada activities, only need passing score
      // For revisada activities, need passing score or exhausted attempts
      setCanCloseModal(
        score >= 3 ||
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          (activity.revisada && attemptsLeft === 0) ||
          (!activity.revisada && score < 3) || // Allow closing for non-revisada even if failed
          (isLastActivity && isLastLesson)
      );

      const hasPassingScore = score >= 3;

      await fetch('/api/activities/saveAnswers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          userId,
          answers: userAnswers,
          score,
          allQuestionsAnswered,
          passed: hasPassingScore,
        }),
      });

      if (!hasPassingScore) {
        toast.error('Debes obtener al menos 3 puntos para aprobar');
      }

      // Check attempts for revisada activities
      if (activity.revisada) {
        try {
          const attemptsResponse = await fetch(
            `/api/activities/attempts?activityId=${activity.id}&userId=${userId}`
          );
          const attemptsData =
            (await attemptsResponse.json()) as AttemptsResponse;
          setAttemptsLeft(3 - (attemptsData.attempts ?? 0));
        } catch (attemptError) {
          console.error('Error checking attempts:', attemptError);
        }
      }

      // Marcar que los resultados están cargados
      setIsResultsLoaded(true);

      if (isLastActivity) {
        // Update grades in database
        const response = await fetch('/api/grades/updateGrades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            userId,
            activityId: activity.id,
            finalGrade: score,
          }),
        });

        if (response.ok) {
          toast.success(
            '¡Curso completado! Puedes ver tus calificaciones en el panel de notas.'
          );
        }
      }
    } catch (error) {
      console.error('Error saving answers:', error);
      toast.error('Error al guardar las respuestas');
    } finally {
      setIsSavingResults(false);
      setIsResultsLoaded(true);
    }
  };

  const renderLoadingState = (message: string) => (
    <div className="flex flex-col items-center justify-center p-8">
      <Icons.blocks className="fill-primary size-22 animate-pulse" />
      <p className="mt-6 text-center text-xl text-white">{message}</p>
    </div>
  );

  const handleFinishAndNavigate = async () => {
    try {
      setIsUnlocking(true);

      // First mark activity as completed
      await markActivityAsCompletedAction();

      // Then run the activity completion handler
      await onActivityCompletedAction();

      // Update the questions answered status
      onQuestionsAnsweredAction(true);

      // Finally try to unlock next lesson
      const result = await unlockNextLesson(activity.lessonsId);

      if (result?.success && result.nextLessonId) {
        onLessonUnlockedAction(result.nextLessonId);
        toast.success('¡Siguiente clase desbloqueada!');
        onCloseAction();
      } else {
        // Just close if it's the last lesson
        onCloseAction();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar la actividad');
    } finally {
      setIsUnlocking(false);
    }
  };

  const getDisplayAnswer = (userAnswer: UserAnswer, question: Question) => {
    let displayAnswer = userAnswer.answer;

    switch (question.type) {
      case 'VOF': {
        displayAnswer = userAnswer.answer === 'true' ? 'Verdadero' : 'Falso';
        break;
      }
      case 'OM': {
        const selectedOption = question.options?.find(
          (opt) => opt.id === userAnswer.answer
        );
        displayAnswer = selectedOption?.text ?? userAnswer.answer;
        break;
      }
      case 'COMPLETAR': {
        displayAnswer = userAnswer.answer;
        break;
      }
    }
    return displayAnswer;
  };

  const getDisplayCorrectAnswer = (question: Question): string => {
    let correctAnswer = '';

    switch (question.type) {
      case 'VOF': {
        correctAnswer =
          question.correctOptionId === 'true' ? 'Verdadero' : 'Falso';
        break;
      }
      case 'OM': {
        const correctOption = question.options?.find(
          (opt) => opt.id === question.correctOptionId
        );
        correctAnswer = correctOption?.text ?? question.correctOptionId ?? '';
        break;
      }
      case 'COMPLETAR': {
        correctAnswer = question.correctAnswer ?? '';
        break;
      }
    }
    return correctAnswer;
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    // Add handler for file upload type
    if (currentQuestion.type === 'FILE_UPLOAD') {
      return (
        <FileUploadForm
          question={currentQuestion}
          activityId={activity.id}
          userId={userId}
          onSubmit={() => {
            handleAnswer('uploaded');
            setShowResults(true);
          }}
        />
      );
    }

    const isQuestionAnswered = userAnswers[currentQuestion.id];

    return (
      <div className="relative">
        {' '}
        {/* Add container for positioning */}
        <div className="absolute -top-2 right-0 translate-y-[-100%] transform">
          <LightBulbIcon
            className={`h-8 w-8 transition-all duration-300 ${
              isQuestionAnswered
                ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                : 'text-gray-300'
            }`}
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <h3 className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 text-lg font-semibold text-gray-800">
            <div className="flex items-center">
              <span className="bg-primary/20 text-background mr-2 flex h-8 w-8 items-center justify-center rounded-full font-bold">
                {currentQuestionIndex + 1}
              </span>
              {currentQuestion.text}
            </div>
          </h3>

          <div className="space-y-3">
            {currentQuestion.type === 'COMPLETAR' ? (
              <input
                type="text"
                value={userAnswers[currentQuestion.id]?.answer ?? ''} // Changed || to ??
                onChange={(e) => handleAnswer(e.target.value)}
                className="text-background w-full rounded-md border border-gray-300 p-3 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none"
                placeholder="Escribe tu respuesta..."
              />
            ) : (
              <div className="grid gap-3">
                {currentQuestion.options?.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-4 transition-all hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option.id}
                      checked={
                        userAnswers[currentQuestion.id]?.answer === option.id
                      }
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-3 text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add safety check for formatScore
  const formatScore = (score: unknown): string => {
    if (typeof score !== 'number' || isNaN(score)) {
      return '0.0';
    }
    return score.toFixed(1);
  };

  const renderStars = (score: number) => {
    const totalStars = 5;
    const starScore = Math.round((score / 5) * totalStars);

    return (
      <div className="flex justify-center gap-1">
        {Array.from({ length: totalStars }, (_, index) =>
          index < starScore ? (
            <StarSolidIcon key={index} className="h-8 w-8 text-yellow-400" />
          ) : (
            <StarOutlineIcon key={index} className="h-8 w-8 text-gray-300" />
          )
        )}
      </div>
    );
  };

  const renderActionButton = () => {
    // Loading states checks
    if (!isResultsLoaded || isUnlocking) {
      return (
        <Button
          disabled
          className="mt-4 w-full cursor-not-allowed bg-gradient-to-r from-blue-400/70 to-blue-600/70"
        >
          <Icons.spinner className="mr-2 h-5 w-5" />
          <span>Cargando resultados...</span>
        </Button>
      );
    }

    // Last activity of last lesson with grade report
    if (isLastActivity && isLastLesson && showResults) {
      return (
        <div className="space-y-3">
          <Button
            onClick={onViewHistoryAction}
            className="w-full bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <FaTrophy className="mr-1" />
              Ver Reporte de Calificaciones
              <BiSolidReport className="ml-1 h-8" />
            </span>
          </Button>
          <Button
            onClick={() => {
              onActivityCompleteAction();
              onCloseAction();
            }}
            className="w-full bg-[#00BDD8] text-white transition-all duration-200 hover:bg-[#00A5C0] active:scale-[0.98]"
          >
            Cerrar
          </Button>
        </div>
      );
    }

    // Already completed activity
    if (savedResults?.isAlreadyCompleted || activity.isCompleted) {
      return (
        <Button
          onClick={onCloseAction}
          className="text-background mt-3 w-full bg-blue-500 font-bold transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
        >
          CERRAR
        </Button>
      );
    }

    // For activities with revisada=true and score < 3
    if (activity.revisada && finalScore < 3) {
      if (attemptsLeft && attemptsLeft > 0) {
        return (
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-400">
              Te quedan{' '}
              <span className="text-2xl font-bold text-white">
                {attemptsLeft}
              </span>{' '}
              intento{attemptsLeft !== 1 ? 's' : ''}
            </p>
            <Button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setUserAnswers({});
                setShowResults(false);
              }}
              className="text-background w-full bg-yellow-500 font-bold hover:bg-yellow-600"
            >
              Intentar Nuevamente
            </Button>
          </div>
        );
      }

      // No attempts left, show unlock or close button
      if (isLastActivityInLesson && !isLastLesson) {
        return (
          <Button
            onClick={handleFinishAndNavigate}
            className="mt-4 w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
          >
            <span className="flex items-center justify-center gap-2 py-4">
              Desbloquear Siguiente CLASE
              <Unlock className="h-4 w-4" />
            </span>
          </Button>
        );
      }
      return (
        <Button
          onClick={onCloseAction}
          className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
        >
          CERRAR
        </Button>
      );
    }

    // For non-revisada activities with score < 3
    if (!activity.revisada && finalScore < 3) {
      return (
        <div className="space-y-3">
          <p className="pt-4 text-center font-extralight text-gray-200">
            ! Intentos ilimitados hasta aprobar !
          </p>
          <Button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setUserAnswers({});
              setShowResults(false);
            }}
            className="text-background w-full bg-yellow-500 font-bold hover:bg-yellow-600"
          >
            Intentar Nuevamente
          </Button>

          {isLastActivityInLesson && !isLastLesson ? (
            <Button
              onClick={handleFinishAndNavigate}
              className="mt-4 w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
            >
              <span className="flex items-center justify-center gap-2 py-4">
                Desbloquear Siguiente CLASE
                <Unlock className="h-4 w-4" />
              </span>
            </Button>
          ) : (
            !isLastActivityInLesson && (
              <Button
                onClick={onCloseAction}
                className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
              >
                CERRAR
              </Button>
            )
          )}
        </div>
      );
    }

    // For non-revisada activities with passing score
    if (!activity.revisada && finalScore >= 3) {
      if (isLastActivityInLesson && !isLastLesson) {
        return (
          <Button
            onClick={handleFinishAndNavigate}
            className="mt-4 w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
          >
            <span className="flex items-center justify-center gap-2 py-4">
              Desbloquear Siguiente CLASE
              <Unlock className="h-4 w-4" />
            </span>
          </Button>
        );
      }
      return (
        <Button
          onClick={onCloseAction}
          className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
        >
          CERRAR
        </Button>
      );
    }

    if (finalScore < 3 && activity.revisada) {
      if (attemptsLeft && attemptsLeft > 0) {
        return (
          <>
            <p className="text-center text-sm text-gray-400">
              Te quedan{' '}
              <span className="text-2xl font-bold text-white">
                {attemptsLeft}
              </span>{' '}
              intento{attemptsLeft !== 1 ? 's' : ''}
            </p>
            <Button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setUserAnswers({});
                setShowResults(false);
              }}
              className="text-background w-full bg-yellow-500 font-bold hover:bg-yellow-600 active:scale-[0.98]"
            >
              Intentar Nuevamente
            </Button>
          </>
        );
      }
      if (isLastActivityInLesson && !isLastLesson) {
        return (
          <Button
            onClick={handleFinishAndNavigate}
            className="mt-4 w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
          >
            <span className="flex items-center justify-center gap-2 py-4">
              Desbloquear Siguiente CLASE
              <Unlock className="h-4 w-4" />
            </span>
          </Button>
        );
      }
      return (
        <Button
          onClick={onCloseAction}
          className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
        >
          CERRAR
        </Button>
      );
    }

    if (finalScore < 3 && !activity.revisada) {
      // For non-revisada activities
      return (
        <div className="space-y-3">
          <p className="pt-4 text-center font-extralight text-gray-200">
            ! Intentos ilimitados hasta aprobar !
          </p>
          <Button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setUserAnswers({});
              setShowResults(false);
            }}
            className="text-background w-full bg-yellow-500 font-bold hover:bg-yellow-600"
          >
            Intentar Nuevamente
          </Button>

          {/* Show unlock button only for last activity */}
          {isLastActivityInLesson && !isLastLesson && (
            <Button
              onClick={handleFinishAndNavigate}
              className="mt-4 w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
            >
              <span className="flex items-center justify-center gap-2 py-4">
                Desbloquear Siguiente CLASE
                <Unlock className="h-4 w-4" />
              </span>
            </Button>
          )}

          {/* Show close button if not last activity */}
          {!isLastActivityInLesson && (
            <Button
              onClick={onCloseAction}
              className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
            >
              CERRAR
            </Button>
          )}
        </div>
      );
    }

    if (finalScore >= 3 && !activity.isCompleted && !isLastLesson) {
      if (isLastActivityInLesson && !isLastLesson) {
        return (
          <Button
            onClick={handleFinishAndNavigate}
            className="mt-4 w-full bg-green-500 font-semibold text-green-900 transition-all duration-200 hover:scale-[1.02] hover:bg-green-600 hover:text-green-50 active:scale-95"
          >
            <span className="flex items-center justify-center gap-2 py-4">
              Desbloquear Siguiente CLASE
              <Unlock className="h-4 w-4" />
            </span>
          </Button>
        );
      }
      return (
        <Button
          onClick={onCloseAction}
          className="w-full bg-blue-500 font-bold text-blue-900 active:scale-[0.98]"
        >
          CERRAR
        </Button>
      );
    }

    return (
      <Button
        onClick={onCloseAction}
        className="w-full bg-blue-500 font-bold text-blue-900 transition-all duration-200 hover:bg-blue-600 active:scale-[0.98]"
      >
        CERRAR
      </Button>
    );
  };

  const renderResults = () => {
    if (!isResultsLoaded || isSavingResults) {
      return renderLoadingState('Cargando Resultados...');
    }

    // If it's a document upload activity
    if (activity.typeid === 1) {
      return (
        <div className="space-y-4 p-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="text-lg font-medium text-gray-900">
              Estado del Documento
            </h3>
            {/* Add loading state here */}
            {isLoadingDocument ? (
              <div className="flex flex-col items-center justify-center space-y-3 p-8">
                <Icons.spinner className="h-8 w-8 text-blue-500" />
                <p className="text-base text-gray-600">Cargando documento...</p>
              </div>
            ) : (
              uploadedFileInfo && (
                <>{/* ... rest of existing uploadedFileInfo content ... */}</>
              )
            )}
          </div>
        </div>
      );
    }

    // Regular activity results rendering - Update these styles
    return (
      <div className="px-4">
        <div className="text-center">
          {/* Reduce space between title and stars */}
          <div className="mt-1">
            {' '}
            {/* Changed from mt-3 to mt-1 */}
            {renderStars(finalScore)}
            {/* Reduce space between stars and grade */}
            <p className="mt-2 text-lg font-medium text-gray-400">
              {' '}
              {/* Changed from mt-3 to mt-2 */}
              Calificación:{' '}
              <span
                className={`text-2xl font-bold ${
                  finalScore >= 3
                    ? 'animate-pulse text-green-500 shadow-lg'
                    : 'animate-pulse text-red-500 shadow-lg'
                }`}
              >
                {formatScore(finalScore)}
              </span>
            </p>
          </div>

          {/* Add margin top to questions container */}
          <div className="mt-3 mb-4">
            {' '}
            {/* Added mb-4 to add space at bottom */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="max-h-[60vh] overflow-y-auto pr-6">
                {' '}
                {/* Added pr-6 for more spacing */}
                <div className="divide-y divide-gray-100">
                  {questions.map((question, idx) => {
                    const userAnswer = userAnswers[question.id];
                    const isCorrect = userAnswer?.isCorrect;
                    const displayAnswer = userAnswer
                      ? getDisplayAnswer(userAnswer, question)
                      : '';

                    return (
                      <div
                        key={question.id}
                        className="space-y-3 p-4 transition-all hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              <span className="mr-2 text-gray-500">
                                Pregunta {idx + 1}:
                              </span>
                              {question.text}
                            </p>
                          </div>
                          {isCorrect ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-6 w-6 text-red-600" />
                          )}
                        </div>

                        <div className="ml-6 space-y-2">
                          <div
                            className={`rounded-md p-2 ${
                              isCorrect
                                ? 'bg-green-50 text-green-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            <p className="text-sm">
                              <span className="font-bold">Tu respuesta:</span>{' '}
                              <span className="font-bold">{displayAnswer}</span>
                            </p>
                          </div>
                          {/* Solo mostrar la respuesta correcta si la calificación es >= 3 */}
                          {!isCorrect && finalScore >= 3 && (
                            <div className="rounded-md bg-gray-50 p-2 text-sm text-gray-900">
                              <span className="font-bold">
                                Respuesta correcta:
                              </span>{' '}
                              <span className="font-bold">
                                {getDisplayCorrectAnswer(question)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Add margin-top to create space between results and action buttons */}
        <div>{renderActionButton()}</div>
      </div>
    );
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'VOF':
        return 'Verdadero o Falso';
      case 'OM':
        return 'Selección Múltiple';
      case 'COMPLETAR':
        return 'Completar Texto';
      case 'FILE_UPLOAD':
        return 'Subir Archivo';
      default:
        return 'Pregunta';
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    setSelectedFile(file);
    setFilePreview({
      file,
      type: file.type.split('/')[1].toUpperCase(),
      size: formatFileSize(file.size),
      progress: 0,
      status: 'uploading',
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const renderFilePreview = () => {
    if (!filePreview) return null;

    const fileExtension =
      filePreview.file.name.split('.').pop()?.toLowerCase() ?? '';

    // Add function to truncate filename
    const truncateFileName = (fileName: string, maxLength = 50) => {
      if (fileName.length <= maxLength) return fileName;
      const extension = fileName.split('.').pop();
      const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
      const truncatedName = nameWithoutExt.slice(0, maxLength - 3) + '...';
      return `${truncatedName}.${extension}`;
    };

    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex-shrink-0 rounded-lg bg-slate-800 p-2">
                {getFileIcon(fileExtension)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {truncateFileName(filePreview.file.name)}
                </p>
                <p className="text-xs text-slate-400">
                  {filePreview.size}{' '}
                  {/* Removed the bullet point and file type */}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-4 pl-3">
              <span className="w-12 text-right text-sm font-medium text-cyan-500">
                {uploadProgress}%
              </span>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="p-1 text-slate-400 transition-colors hover:text-white"
                aria-label="Remove file"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            >
              <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmissionStatus = () => {
    if (isLoadingDocument) {
      return (
        <div className="mt-4 flex flex-col items-center justify-center space-y-2 p-4">
          <Icons.spinner className="h-8 w-8 text-blue-500" />
          <p className="text-sm text-gray-400">Cargando documento subido...</p>
        </div>
      );
    }

    if (!uploadedFileInfo) return null;

    // Determinar el logo según la nota
    const grade = uploadedFileInfo.grade ?? 0;
    const logoSrc =
      grade > 0
        ? '/contract-filed-line-svgrepo-com.png'
        : '/contract-pending-line-svgrepo-com.png';
    const logoAlt = grade > 0 ? 'Revisado' : 'En revisión';
    const logoClass = grade > 0 ? 'text-green-500' : 'text-yellow-500';

    return (
      <div className="mt-4">
        <div className="rounded-xl bg-slate-900/50">
          <div className="flex flex-col">
            {/* Document info and status */}
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-white">Subido</h3>
                </div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    grade > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {grade > 0 ? 'Revisado' : 'En Revisión'}
                </span>
              </div>
              {/* Document info with consistent spacing */}
              <div className="overflow-hidden rounded-lg">
                <div className="space-y-4">
                  {/* File section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-4">
                      <span className="text-sm font-semibold text-gray-200">
                        Archivo
                      </span>
                      <Image
                        src={logoSrc}
                        alt={logoAlt}
                        width={40}
                        height={40}
                        className={logoClass}
                      />
                    </div>
                    <div className="px-4">
                      <span className="text-sm text-gray-300">
                        {uploadedFileInfo.fileName}
                      </span>
                    </div>
                  </div>
                  {/* Upload date row */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-medium text-white">
                      Fecha De Subida:
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(
                        uploadedFileInfo.uploadDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {/* Grade section */}
              <div className="mt-6 border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-gray-300">
                    Calificación del Educador:
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      grade >= 3 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {grade ? formatScore(grade) : '0.0'}
                  </span>
                </div>
                {/* Renderizar el comentario si existe */}
                {uploadedFileInfo.comment && (
                  <div className="mt-2 px-4">
                    <span className="block text-sm text-gray-300">
                      Comentario del educador:
                    </span>
                    <span className="block text-sm text-white">
                      {uploadedFileInfo.comment}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderiza el bloque de ayuda para descarga
  const renderHelpFileBlock = () => {
    if (!helpFileInfo) return null;
    // Usa la URL pública del bucket configurada en .env
    const s3BaseUrl =
      process.env.NEXT_PUBLIC_AWS_S3_URL ??
      'https://s3.us-east-2.amazonaws.com/artiefy-upload';
    const fileUrl = `${s3BaseUrl}/${helpFileInfo.archivoKey}`;
    const fileName = helpFileInfo.archivoKey.split('/').pop() ?? 'archivo';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() ?? '';
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          {/* Ícono más grande */}
          <span className="flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center">
              {getFileIcon(fileExtension)}
            </span>
          </span>
          <div>
            <span className="block text-sm font-semibold text-blue-900">
              Archivo de ayuda del educador
            </span>
            <span className="block text-xs text-blue-700">{fileName}</span>
          </div>
        </div>
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          Descargar
        </a>
      </div>
    );
  };

  const renderContent = () => {
    const isFileUploadActivity = activity.typeid === 1;

    if (isFileUploadActivity) {
      // Elimina la declaración de isFirstSubmission
      return (
        <div className="max-h-[calc(90vh-10rem)] overflow-y-auto px-4">
          <div className="group relative w-full">
            <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
              {/* Background gradients */}
              <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-sky-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
              <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />

              <div className="relative p-6">
                {/* Botón de subir documento/URL nuevamente arriba del bloque de ayuda */}
                {uploadedFileInfo && (
                  <div className="mb-4 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        if (uploadedFileInfo.status === 'reviewed') {
                          const confirmed = window.confirm(
                            'Al subir un nuevo documento o URL, se reiniciará la calificación a 0.0 y el estado a pendiente. ¿Deseas continuar?'
                          );
                          if (!confirmed) return;
                        }
                        setUploadedFileInfo(null);
                        setSelectedFile(null);
                        setFilePreview(null);
                        setUploadProgress(0);
                        setShowResults(false);
                        setDriveUrl('');
                        setIsUrlValid(false);
                      }}
                      className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {activeTab === 'local'
                          ? 'Subir documento nuevamente'
                          : 'Subir URL nuevamente'}
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </span>
                    </Button>
                  </div>
                )}
                {/* Renderiza el archivo de ayuda antes de los tabs */}
                {isLoadingHelpFile ? (
                  <div className="mb-4 flex items-center gap-2">
                    <Icons.spinner className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-blue-500">
                      Cargando archivo de ayuda...
                    </span>
                  </div>
                ) : (
                  renderHelpFileBlock()
                )}
                {/* Título y descripción */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full items-center justify-between space-x-4">
                      <h3 className="text-lg font-semibold text-white">
                        {activity.name}
                      </h3>
                      <div className="rounded-lg bg-cyan-500/10 p-2">
                        <svg
                          className="h-6 w-6 text-cyan-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {activity.description}
                  </p>
                </div>

                {/* Tabs for submission type selection */}
                <div className="mb-6 flex space-x-2">
                  {submissionTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-all ${
                        activeTab === tab.id
                          ? 'bg-cyan-500/10 text-cyan-500'
                          : 'text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Submission content based on active tab */}
                {activeTab === 'local' ? (
                  <>
                    {/* Existing local file upload UI */}
                    <div
                      className={`mt-6 ${
                        uploadedFileInfo ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <div className="group/dropzone">
                        <div
                          className={`relative rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 transition-colors ${
                            uploadedFileInfo
                              ? 'cursor-not-allowed'
                              : 'group-hover/dropzone:border-cyan-500/50'
                          }`}
                        >
                          <input
                            type="file"
                            className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }}
                            disabled={!!uploadedFileInfo}
                          />
                          <div className="space-y-6 text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
                              <svg
                                className={`h-10 w-10 ${
                                  uploadedFileInfo
                                    ? 'text-gray-500'
                                    : 'text-cyan-500'
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>

                            <div className="space-y-2">
                              <p className="text-base font-medium text-white">
                                {uploadedFileInfo
                                  ? 'Ya has subido un documento para esta actividad'
                                  : 'Arrastra tus archivos aquí o haz clic para buscar'}
                              </p>
                              <p className="text-sm text-slate-400">
                                Formatos soportados: PDF, DOC, PNG, PPT
                              </p>
                              <p className="text-xs text-slate-400">
                                Tamaño máximo: 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vista previa del archivo y botón de subida */}
                    {renderFilePreview()}

                    <button
                      onClick={() =>
                        handleUpload({
                          selectedFile,
                          activity,
                          userId,
                          setIsUploading,
                          setUploadProgress,
                          setUploadedFileInfo,
                          setShowResults,
                          setFilePreview,
                          setIsNewUpload, // Add this parameter
                        })
                      }
                      disabled={
                        !selectedFile || isUploading || !!uploadedFileInfo
                      }
                      className="group/btn relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 p-px font-medium text-white shadow-[0_1000px_0_0_hsl(0_0%_100%_/_0%)_inset] transition-colors hover:shadow-[0_1000px_0_0_hsl(0_0%_100%_/_2%)_inset] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-950/50 px-4 py-2 transition-colors group-hover/btn:bg-transparent">
                        {isUploading ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4" />
                            Subiendo...
                          </>
                        ) : uploadedFileInfo ? (
                          'Documento ya subido'
                        ) : (
                          'Cargar Documento'
                        )}
                      </span>
                    </button>

                    {/* Add loading indicator below upload button */}
                    {isLoadingDocument && (
                      <div className="mt-4 flex items-center justify-center space-x-2 text-center">
                        <Icons.spinner className="h-5 w-5 text-cyan-500" />
                        <span className="text-sm text-gray-400">
                          Cargando documento...
                        </span>
                      </div>
                    )}

                    {/* Mostrar el estado del documento subido */}
                    {uploadedFileInfo && renderSubmissionStatus()}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                      <input
                        type="url"
                        placeholder="Pega cualquier URL aquí"
                        value={driveUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setDriveUrl(url);
                          setIsUrlValid(validateUrl(url));
                        }}
                        disabled={!!uploadedFileInfo || isUploadingUrl}
                        className={`w-full bg-transparent text-white placeholder:text-gray-400 focus:outline-none ${
                          uploadedFileInfo || isUploadingUrl
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        }`}
                      />
                    </div>
                    {driveUrl &&
                      !isUrlValid &&
                      !uploadedFileInfo &&
                      !isUploadingUrl && (
                        <p className="text-sm text-red-500">
                          Por favor ingresa una URL válida
                        </p>
                      )}
                    <button
                      onClick={
                        !uploadedFileInfo
                          ? handleDriveSubmit(
                              driveUrl,
                              activity,
                              userId,
                              setUploadedFileInfo,
                              setIsNewUpload,
                              setShowResults,
                              {
                                isUploading: isUploadingUrl,
                                setIsUploading: setIsUploadingUrl,
                              }
                            )
                          : undefined
                      }
                      disabled={
                        !isUrlValid || isUploadingUrl || !!uploadedFileInfo
                      }
                      className={`w-full rounded-lg px-4 py-2 transition-all ${
                        !uploadedFileInfo && isUrlValid && !isUploadingUrl
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                          : 'cursor-not-allowed bg-gray-700 text-gray-400'
                      }`}
                    >
                      {isUploadingUrl ? (
                        <div className="flex items-center justify-center">
                          <Icons.spinner className="mr-2 h-4 w-4" />
                          <span>Guardando URL...</span>
                        </div>
                      ) : uploadedFileInfo ? (
                        'URL ya subida'
                      ) : (
                        'Guardar URL'
                      )}
                    </button>
                    {uploadedFileInfo && renderSubmissionStatus()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular activity content for questions
    return (
      <div className="space-y-6">
        {showResults ? (
          renderResults()
        ) : (
          // Add padding-right to create space for scrollbar
          <div className="">
            {' '}
            {/* Add right padding */}
            <div className="mb-8 flex flex-col items-center justify-center text-center">
              <span className="text-primary text-2xl font-bold">
                {getQuestionTypeLabel(currentQuestion?.type ?? '')}
              </span>
              <span className="mt-2 text-sm text-gray-500">
                {currentQuestionIndex + 1} de {questions.length}
              </span>
            </div>
            {renderQuestion()}
            {/* Navigation buttons */}
            <div className="mt-6 flex justify-between">
              {' '}
              {/* Added top margin */}
              <button
                className="btn-arrow btn-arrow-prev"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              >
                <ChevronRightIcon />
                <span>Anterior</span>
              </button>
              <button
                className={`btn-arrow ${
                  isLastQuestion ? 'btn-arrow-success' : ''
                }`}
                disabled={!canProceedToNext}
                onClick={isLastQuestion ? handleFinish : handleNext}
              >
                <span>{isLastQuestion ? 'Ver resultados' : 'Siguiente'}</span>
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Emit events when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Dispatch event when modal opens
      const openEvent = new CustomEvent('activity-modal-open');
      window.dispatchEvent(openEvent);
    } else {
      // Dispatch event when modal closes
      const closeEvent = new CustomEvent('activity-modal-close');
      window.dispatchEvent(closeEvent);
    }
  }, [isOpen]);

  // Define handleRequestClose aquí
  const handleRequestClose = async () => {
    // Si es la última actividad de la lección, no es la última lección, y corresponde desbloquear, desbloquea automáticamente
    const shouldAutoUnlock =
      activity.typeid === 1 &&
      isLastActivityInLesson &&
      !isLastLesson &&
      ((uploadedFileInfo && !activity.isCompleted) ?? isNewUpload);

    if (shouldAutoUnlock) {
      await handleFinishAndNavigate();
      return;
    }
    // Emit close event before actual closing
    const closeEvent = new CustomEvent('activity-modal-close');
    window.dispatchEvent(closeEvent);

    // Permitir cerrar siempre con la X
    onCloseAction();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actividad</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <Icons.spinner className="h-8 w-8" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleRequestClose();
        }
      }}
    >
      <DialogContent
        className={`[&>button]:bg-background [&>button]:text-background [&>button]:hover:text-background flex flex-col overflow-hidden ${
          isMobile
            ? 'w-full max-w-full rounded-none p-1'
            : 'max-h-[90vh] sm:max-w-[500px]'
        }`}
        aria-describedby={MODAL_DESCRIPTION_ID}
      >
        {/* Botón de cerrar (X) arriba a la derecha, color blanco */}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={handleRequestClose}
          className="absolute top-2 right-4 z-50 rounded-full p-2 transition-colors hover:bg-gray-800"
        >
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>
        <DialogHeader className="bg-background sticky top-0 z-40">
          <DialogTitle className="text-center text-3xl font-bold">
            {activity.content?.questionsFilesSubida?.[0] != null
              ? 'SUBIDA DE DOCUMENTO'
              : 'ACTIVIDAD'}
          </DialogTitle>
          <div id={MODAL_DESCRIPTION_ID} className="sr-only">
            {activity.description ?? 'Actividad del curso'}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {isUnlocking
            ? renderLoadingState('Desbloqueando Siguiente Clase...')
            : isSavingResults
              ? renderLoadingState('Cargando Resultados...')
              : renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UploadParams {
  selectedFile: File | null;
  activity: Activity;
  userId: string;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (value: number) => void;
  setUploadedFileInfo: (info: StoredFileInfo | null) => void;
  setShowResults: (value: boolean) => void;
  setFilePreview: (preview: FilePreview | null) => void;
  setIsNewUpload: (value: boolean) => void; // Add this line
}

// Add custom error type
class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

// Update handleUpload function with proper error handling
async function handleUpload({
  selectedFile,
  activity,
  userId,
  setIsUploading,
  setUploadProgress,
  setUploadedFileInfo,
  setShowResults,
  setFilePreview,
  setIsNewUpload, // Add this parameter
}: UploadParams): Promise<void> {
  if (!selectedFile) return;

  const updateFilePreview = (
    progress: number,
    status: FilePreview['status'] = 'uploading'
  ): void => {
    setFilePreview({
      file: selectedFile,
      type: selectedFile.type.split('/')[1].toUpperCase(),
      size: formatFileSize(selectedFile.size),
      progress,
      status,
    });
  };

  try {
    setIsUploading(true);
    setUploadProgress(0);
    updateFilePreview(0);

    // Get presigned URL
    const presignedResponse = await fetch('/api/activities/documentupload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: selectedFile.name,
        contentType: selectedFile.type,
        activityId: activity.id,
        userId,
      }),
    });

    if (!presignedResponse.ok) {
      throw new UploadError('Failed to get upload URL');
    }

    const presignedData = (await presignedResponse.json()) as PresignedResponse;
    const { url, fields, key, fileUrl } = presignedData;

    updateFilePreview(20);

    // Upload to S3
    const formData = new FormData();
    Object.entries(fields).forEach(([fieldKey, value]) => {
      formData.append(fieldKey, String(value));
    });
    formData.append('file', selectedFile);

    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new UploadError('Upload to storage failed');
    }

    updateFilePreview(60);

    // Save in database
    const dbResponse = await fetch('/api/activities/saveFileSubmission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: activity.id,
        userId,
        fileInfo: {
          fileName: selectedFile.name,
          fileUrl,
          documentKey: key,
          uploadDate: new Date().toISOString(),
          status: 'pending',
        },
      }),
    });

    if (!dbResponse.ok) {
      throw new UploadError('Failed to save submission');
    }

    const result = (await dbResponse.json()) as DocumentUploadResponse;

    updateFilePreview(100, 'complete');
    setUploadProgress(100);
    setUploadedFileInfo({
      fileName: selectedFile.name,
      fileUrl: result.fileUrl,
      uploadDate: new Date().toISOString(),
      status: result.status,
      submissionType: 'file',
    });

    setIsNewUpload(true); // This will now work properly
    toast.success('Documento subido correctamente');
    setShowResults(true);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Error desconocido al subir el archivo';
    if (setFilePreview) {
      setFilePreview({
        file: selectedFile,
        type: selectedFile.type.split('/')[1].toUpperCase(),
        size: formatFileSize(selectedFile.size),
        progress: 0,
        status: 'error',
      });
    }
    console.error('Error de subida:', errorMessage);
    toast.error(`Error al subir el archivo: ${errorMessage}`);
  } finally {
    setIsUploading(false);
  }
}

// Add interface for API response
interface UrlSubmissionApiResponse {
  success: boolean;
  message: string;
  error?: string;
  submission?: StoredFileInfo;
}

// Update handleDriveSubmit function with proper error handling
const handleDriveSubmit =
  (
    driveUrl: string,
    activity: Activity,
    userId: string,
    setUploadedFileInfo: (info: StoredFileInfo | null) => void,
    setIsNewUpload: (value: boolean) => void,
    setShowResults: (value: boolean) => void,
    uploadState: UrlSubmissionState
  ) =>
  async () => {
    const { setIsUploading } = uploadState;
    setIsUploading(true);

    try {
      const submission = {
        fileName: 'URL Document',
        fileUrl: driveUrl,
        uploadDate: new Date().toISOString(),
        status: 'pending' as const,
        submissionType: 'url' as const,
        url: driveUrl,
      };

      const response = await fetch('/api/activities/saveUrlSubmission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          userId,
          submissionData: submission,
        }),
      });

      const apiResponse = (await response.json()) as UrlSubmissionApiResponse;

      if (!response.ok) {
        throw new Error(apiResponse.error ?? 'Error al guardar la URL');
      }

      setUploadedFileInfo({
        fileName: 'URL Document',
        fileUrl: driveUrl,
        uploadDate: new Date().toISOString(),
        status: 'pending',
        submissionType: 'url',
        url: driveUrl,
        grade: 0.0,
      });
      setIsNewUpload(true);
      setShowResults(true);
      toast.success('URL guardada correctamente');
    } catch (error) {
      // Proper error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la URL';
      console.error('Error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
