import { type SignUpProps } from '@clerk/shared/types';

type ClerkAppearance = NonNullable<SignUpProps['appearance']>;

/**
 * Shared Clerk appearance so every Clerk-rendered surface (the SignUp
 * "complete your data" step, the UserButton popover, the UserProfile modal)
 * uses the Artiefy dark palette with proper contrast instead of Clerk's
 * low-contrast defaults — which render the primary button and icons nearly
 * black on the dark navy background.
 *
 * Uses Clerk v7 appearance variables:
 * https://clerk.com/docs/customization/overview
 */
export const clerkAppearance: ClerkAppearance = {
  variables: {
    // Cyan brand accent (matches --color-primary). Buttons/links use this;
    // its foreground is the dark navy so text on the button stays readable.
    colorPrimary: '#22c4d3',
    colorPrimaryForeground: '#01152d',
    // Surface + text: dark navy card with white copy.
    colorBackground: '#01152d',
    colorForeground: '#ffffff',
    // Secondary/subtle surfaces and text.
    colorMuted: '#1d283a',
    colorMutedForeground: '#94a3b8',
    // Inputs match the header search fields.
    colorInput: '#1d283a',
    colorInputForeground: '#ffffff',
    // Light base so generated borders/dividers/icons contrast on dark.
    colorNeutral: '#ffffff',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorRing: '#22c4d3',
    colorModalBackdrop: 'rgba(1, 21, 45, 0.72)',
    borderRadius: '0.6rem',
  },
};
