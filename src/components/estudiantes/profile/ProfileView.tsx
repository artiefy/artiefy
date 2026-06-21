'use client';

import { useState } from 'react';

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
  MapPin,
} from 'lucide-react';

import MyCoursesContent, {
  type Course,
  type Program,
} from '~/components/estudiantes/layout/MyCoursesContent';

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

  const joinDate = formatJoinDate(profile.createdAt);
  const stats = [
    { label: 'Proyectos', value: 0 },
    { label: 'Posts', value: 0 },
    { label: 'Seguidores', value: 0 },
    { label: 'Siguiendo', value: 0 },
  ];

  return (
    <main className="relative pt-20 pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="
            mb-4 flex items-center gap-2 text-muted-foreground
            transition-colors
            hover:text-foreground
          "
        >
          <ArrowLeft className="size-5" />
          <span className="text-sm font-medium">Volver</span>
        </button>

        <div className="relative mb-8">
          {/* Banner (gradiente estático) */}
          <div
            className="
              h-32 rounded-2xl border border-border/30 bg-gradient-to-r
              from-primary/30 via-cyan-500/20 to-primary/10
              sm:h-40
            "
          />

          <div className="-mt-12 px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <span
                className="
                  relative flex size-24 shrink-0 overflow-hidden rounded-full
                  border-4 border-background shadow-xl
                "
              >
                {profile.imageUrl ? (
                  <Image
                    src={profile.imageUrl}
                    alt={profile.name ?? 'Perfil'}
                    width={96}
                    height={96}
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
                <h1 className="text-2xl font-bold text-foreground">
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
                "
              >
                Editar perfil
              </button>
            </div>

            {profile.bio ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground italic">
                Todavía no agregaste una bio.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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

            <div className="mt-5 flex items-center justify-center gap-6 sm:justify-start">
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

          <div className="mt-6">
            {activeTab === 'cursos' ? (
              <MyCoursesContent courses={courses} programs={programs} />
            ) : (
              <div
                className="
                  rounded-2xl border border-dashed border-border/50 bg-card/30
                  px-6 py-16 text-center
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
