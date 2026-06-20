import { redirect } from 'next/navigation';

import { Header } from '~/components/estudiantes/layout/Header';
import { ProfileView } from '~/components/estudiantes/profile/ProfileView';
import { getMyProfile } from '~/server/actions/estudiantes/profile/profileActions';

export default async function ProfilePage() {
  const profile = await getMyProfile();

  if (!profile) {
    redirect('/sign-in?redirect_url=/estudiantes/perfil');
  }

  return (
    <>
      <Header />
      <ProfileView profile={profile} />
    </>
  );
}
