'use client';

import { type ChangeEvent, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Bookmark,
  Calendar,
  FileText,
  FolderKanban,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Pencil,
} from 'lucide-react';

import MyCoursesContent, {
  type Course,
  type Program,
} from '~/components/estudiantes/layout/MyCoursesContent';
import {
  coverKeyToUrl,
  MAX_COVER_SIZE,
  uploadCoverToS3,
} from '~/lib/profileCover';
import { updateMyCover } from '~/server/actions/estudiantes/profile/profileActions';

import { EditProfileModal } from './EditProfileModal';

import type { MyProfile } from '~/server/actions/estudiantes/profile/profileActions';

const TABS = [
  { key: 'cursos', label: 'Cursos', icon: GraduationCap },
  { key: 'proyectos', label: 'Proyectos', icon: FolderKanban },
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'guardados', label: 'Guardados', icon: Bookmark },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const EMPTY_MESSAGES: Record<TabKey, string> = {
  proyectos: 'Todavía no tenés proyectos.',
  posts: 'Todavía no publicaste nada.',
  cursos: 'Todavía no tenés cursos.',
  guardados: 'Todavía no guardaste nada.',
};

function formatJoinDate(date: Date | null) {
  if (!date) return null;
  const formatted = new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function ProfileView({
  profile,
  courses,
  programs,
}: {
  profile: MyProfile;
  courses: Course[];
  programs: Program[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('cursos');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const joinDate = formatJoinDate(profile.createdAt);
  const coverUrl = coverKeyToUrl(profile.coverImageKey);

  const handleCoverPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file later.
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCoverError('La portada debe ser una imagen.');
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setCoverError('La portada no puede superar los 5 MB.');
      return;
    }

    setCoverError(null);
    setUploadingCover(true);
    try {
      const key = await uploadCoverToS3(file);
      const result = await updateMyCover(key);
      if (!result.success) {
        setCoverError(result.error ?? 'No se pudo guardar la portada.');
        return;
      }
      router.refresh();
    } catch (error) {
      setCoverError(
        error instanceof Error ? error.message : 'No se pudo subir la portada.'
      );
    } finally {
      setUploadingCover(false);
    }
  };
  const stats = [
    { label: 'Proyectos', value: 0 },
    { label: 'Posts', value: 0 },
    { label: 'Seguidores', value: 0 },
    { label: 'Siguiendo', value: 0 },
  ];

  return (
    <main className="relative pt-14 pb-12 lg:pt-20 lg:pb-20">
      <div
        className="
          mx-auto max-w-3xl px-4
          sm:px-6
          lg:max-w-6xl lg:px-8
          xl:max-w-7xl
        "
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="
            mb-4 inline-flex items-center gap-2 rounded-xl border
            border-border/60 bg-card/40 px-4 py-2 text-sm font-medium
            text-muted-foreground backdrop-blur-sm transition-all duration-200
            hover:border-primary/40 hover:bg-card/60 hover:text-foreground
            hover:shadow-[0_0_18px_rgba(34,196,211,0.18)]
            lg:mb-6
          "
        >
          <ArrowLeft className="size-4" />
          <span>Volver</span>
        </button>

        <div className="relative mb-8 lg:mb-10">
          {/* Banner: portada subida (responsive) o gradiente por defecto */}
          <div
            className="
              relative h-32 w-full overflow-hidden rounded-2xl border
              border-border/30
              sm:h-40
              lg:h-56 lg:rounded-3xl
              xl:h-64
            "
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt="Portada del perfil"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 1152px, 1280px"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="
                  size-full bg-gradient-to-r from-primary/30 via-cyan-500/20
                  to-primary/10
                "
              />
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverPick}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              aria-label="Editar portada"
              title="Editar portada"
              className="
                absolute top-3 right-3 z-10 flex size-9 items-center
                justify-center rounded-full border border-white/20 bg-black/40
                text-white backdrop-blur-sm transition-all
                hover:bg-black/60
                disabled:opacity-70
                lg:top-5 lg:right-5 lg:size-11
              "
            >
              {uploadingCover ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
            </button>
          </div>

          {coverError ? (
            <p className="mt-2 text-xs text-destructive">{coverError}</p>
          ) : null}

          <div className="-mt-12 px-4 sm:px-6 lg:-mt-16 lg:px-8 xl:px-10">
            <div
              className="
                flex flex-col gap-4
                sm:flex-row sm:items-end
                lg:gap-6
              "
            >
              <span
                className="
                  relative flex size-24 shrink-0 overflow-hidden rounded-full
                  border-4 border-background shadow-xl
                  lg:size-32 lg:border-[5px]
                "
              >
                {profile.imageUrl ? (
                  <Image
                    src={profile.imageUrl}
                    alt={profile.name ?? 'Perfil'}
                    width={128}
                    height={128}
                    className="aspect-square size-full object-cover"
                  />
                ) : (
                  <span
                    className="
                      flex size-full items-center justify-center bg-secondary
                      text-2xl font-bold text-foreground
                    "
                  >
                    {(profile.name ?? '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <div className="flex-1 pb-1">
                <h1
                  className="
                    text-2xl font-bold text-foreground
                    lg:text-3xl
                  "
                >
                  {profile.name ?? 'Sin nombre'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {profile.username ? `@${profile.username}` : 'Sin usuario'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="
                  rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-6 py-2
                  text-sm font-semibold text-[#01142B] transition-all
                  duration-300
                  hover:shadow-[0_0_25px_rgba(34,196,211,0.4)]
                  lg:px-7 lg:py-2.5
                "
              >
                Editar perfil
              </button>
            </div>

            {profile.bio ? (
              <p
                className="
                  mt-4 max-w-xl text-sm leading-relaxed text-foreground/80
                  lg:mt-5 lg:max-w-3xl lg:text-base
                "
              >
                {profile.bio}
              </p>
            ) : (
              <p
                className="
                  mt-4 text-sm text-muted-foreground italic
                  lg:mt-5 lg:text-base
                "
              >
                Todavía no agregaste una bio.
              </p>
            )}

            <div
              className="
                mt-3 flex flex-wrap items-center gap-4 text-xs
                text-muted-foreground
                lg:mt-4 lg:text-sm
              "
            >
              {profile.location ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {profile.location}
                </span>
              ) : null}
              {profile.website ? (
                <span className="flex items-center gap-1">
                  <LinkIcon className="size-3.5" />
                  <a
                    href={normalizeUrl(profile.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//i, '')}
                  </a>
                </span>
              ) : null}
              {joinDate ? (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Se unió en {joinDate}
                </span>
              ) : null}
            </div>

            <div
              className="
                mt-5 flex items-center justify-center gap-6
                sm:justify-start
                lg:mt-6 lg:gap-10
              "
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div
              className="
                inline-flex w-max items-center gap-2 rounded-2xl border
                border-border/30 bg-card/50 p-2 backdrop-blur-sm
                sm:w-full sm:justify-center
                lg:rounded-3xl lg:p-3
              "
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex shrink-0 items-center gap-2 rounded-full border px-5
                      py-2.5 text-sm font-medium transition-all duration-200
                      lg:px-7
                      ${
                        active
                          ? 'border-primary/30 bg-primary/15 text-primary shadow-sm'
                          : `
                            border-border/30 bg-transparent text-muted-foreground
                            hover:border-border/50 hover:text-foreground
                          `
                      }
                    `}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 lg:mt-8">
            {activeTab === 'cursos' ? (
              <MyCoursesContent courses={courses} programs={programs} />
            ) : (
              <div
                className="
                  rounded-2xl border border-dashed border-border/50 bg-card/30
                  px-6 py-16 text-center
                  lg:py-24
                "
              >
                <p className="text-sm text-muted-foreground">
                  {EMPTY_MESSAGES[activeTab]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            router.refresh();
          }}
        />
      ) : null}
    </main>
  );
}
