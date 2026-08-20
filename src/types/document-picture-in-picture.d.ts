/**
 * Document Picture-in-Picture API.
 *
 * Opens an always-on-top window that accepts arbitrary DOM, unlike the older
 * Picture-in-Picture API which only handled `<video>`. Ships in Chromium 130+
 * and Firefox 151+ on desktop; absent from Safari and from every mobile
 * browser, so every call site must feature-detect first.
 *
 * Not part of the TypeScript DOM lib yet, hence these declarations.
 */

interface DocumentPictureInPictureOptions {
  /** Initial width of the floating window, in CSS pixels. */
  width?: number;
  /** Initial height of the floating window, in CSS pixels. */
  height?: number;
  /** Hides the "back to tab" button when true. */
  disallowReturnToOpener?: boolean;
  /** Opens the window in its last remembered position and size. */
  preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPicture extends EventTarget {
  /** The open floating window, or null when none is open. */
  readonly window: Window | null;
  /** Requires a user gesture; rejects otherwise. */
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

interface Window {
  /** Undefined on Safari and on all mobile browsers. */
  readonly documentPictureInPicture?: DocumentPictureInPicture;
}
