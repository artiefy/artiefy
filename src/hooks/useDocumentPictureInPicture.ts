'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Baseline for the floating document. It starts blank, so the host page's
 * margins, scrollbars and full-height layout have to be re-established.
 */
const BASE_STYLE = `
  html, body { height: 100%; margin: 0; overflow: hidden; }
`;

function isPictureInPictureSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.documentPictureInPicture?.requestWindow === 'function'
  );
}

/**
 * Mirrors the host stylesheets into the floating document. That window is a
 * separate `Document`, so it inherits none of the page CSS — without this the
 * portalled tree renders unstyled.
 */
function copyStyles(target: Window) {
  const targetDocument = target.document;

  // Theme and font variables live on <html>/<body>, not in a stylesheet.
  targetDocument.documentElement.className = document.documentElement.className;
  targetDocument.body.className = document.body.className;

  const base = targetDocument.createElement('style');
  base.textContent = BASE_STYLE;
  targetDocument.head.append(base);

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const cssText = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join('');
      const style = targetDocument.createElement('style');
      style.textContent = cssText;
      targetDocument.head.append(style);
    } catch {
      // Cross-origin sheet: its rules are unreadable, so re-link it instead.
      if (!sheet.href) continue;
      const link = targetDocument.createElement('link');
      link.rel = 'stylesheet';
      link.href = sheet.href;
      if (sheet.media.length > 0) link.media = sheet.media.mediaText;
      targetDocument.head.append(link);
    }
  }
}

interface UseDocumentPictureInPictureResult {
  /** False until the client confirms the API exists, so SSR stays stable. */
  isSupported: boolean;
  /** The floating window while it is open, otherwise null. */
  pipWindow: Window | null;
  /** Must be called from a user gesture: the API rejects without one. */
  open: () => Promise<void>;
  close: () => void;
}

/**
 * Opens an always-on-top window that stays visible over other apps, ready to
 * receive a React tree through `createPortal`.
 *
 * Desktop Chromium and Firefox only — callers must hide their entry point when
 * `isSupported` is false rather than letting the call fail.
 */
export function useDocumentPictureInPicture(
  width = 400,
  height = 620
): UseDocumentPictureInPictureResult {
  const [isSupported, setIsSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const windowRef = useRef<Window | null>(null);

  // Detection runs on the client: the API is absent during SSR, so checking
  // it while rendering would flag it unsupported everywhere.
  useEffect(() => {
    setIsSupported(isPictureInPictureSupported());
  }, []);

  const close = useCallback(() => {
    windowRef.current?.close();
    windowRef.current = null;
    setPipWindow(null);
  }, []);

  const open = useCallback(async () => {
    const api = window.documentPictureInPicture;
    if (!api || windowRef.current) return;

    try {
      const target = await api.requestWindow({
        width,
        height,
        // Drops the browser's "back to tab" button. The panel already carries
        // its own header with the same affordances, so that button was a
        // duplicate. The origin strip above it is drawn by the browser and
        // cannot be removed: an always-on-top window must always say which
        // site it belongs to.
        disallowReturnToOpener: true,
      });

      copyStyles(target);

      // Fires when the user closes the floating window from its own chrome.
      target.addEventListener('pagehide', () => {
        windowRef.current = null;
        setPipWindow(null);
      });

      windowRef.current = target;
      setPipWindow(target);
    } catch {
      // Denied, or no user gesture: the panel simply stays in the page.
    }
  }, [width, height]);

  // A floating window outlives its opener's React tree, so unmounting without
  // closing it would leave an orphan window on screen.
  useEffect(
    () => () => {
      windowRef.current?.close();
      windowRef.current = null;
    },
    []
  );

  return { isSupported, pipWindow, open, close };
}
