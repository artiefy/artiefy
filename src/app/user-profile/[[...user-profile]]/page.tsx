'use client';

import { UserProfile } from '@clerk/nextjs';

const DotIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  );
};

const CustomPage = () => {
  return (
    <div>
      <h1>Custom page</h1>
      <p>This is the content of the custom page.</p>
    </div>
  );
};

const UserProfilePage = () => (
  <UserProfile>
    <UserProfile.Page label="Custom Page" url="custom" labelIcon={<DotIcon />}>
      <CustomPage />
    </UserProfile.Page>
    <UserProfile.Link label="Homepage" url="/" labelIcon={<DotIcon />} />
    <UserProfile.Page label="account" />
    <UserProfile.Page label="security" />
  </UserProfile>
);

export default UserProfilePage;
