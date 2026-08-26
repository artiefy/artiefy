'use client';

import {
  type ComponentType,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type UIEvent as ReactUIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  AlignLeft,
  ArrowDown,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FolderKanban,
  Maximize2,
  Minimize2,
  PictureInPicture,
  PictureInPicture2,
  Play,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';

import { messageHasCode } from '~/components/agents/AgentMessageContent';
import { AgentRevealedContent } from '~/components/agents/AgentRevealedContent';
import { ArtiefyMark } from '~/components/agents/ArtiefyMark';
import { useDocumentPictureInPicture } from '~/hooks/useDocumentPictureInPicture';
import {
  type AgentChatScope,
  GENERAL_SCOPE,
  scopeBadge,
  subscribeToAgentChat,
} from '~/lib/agents/agentChatBus';

gsap.registerPlugin(useGSAP);

/** Artiefy brand cyan. The floating launcher keeps it for every agent. */
const LAUNCHER_COLOR = '#22C4D3';

/** Below this width the panel behaves as a full-screen bottom sheet. */
const BOTTOM_SHEET_QUERY = '(max-width: 767px)';

/** Drag distance, in px, past which releasing the handle dismisses the sheet. */
const DISMISS_THRESHOLD = 120;

/** Starting size of the floating picture-in-picture window, in CSS pixels. */
const PIP_WIDTH = 400;
const PIP_HEIGHT = 620;

/** Width of the docked history column, in px. */
const DOCKED_HISTORY_WIDTH = 264;

/** Panel width, in px, below which the docked history stops fitting. */
const DOCKED_HISTORY_MIN_PANEL = 560;

/** Gap kept between the panel and the edges of the viewport, in px. */
const PANEL_MARGIN = 12;

/** Smallest the panel can be dragged to, in px. */
const PANEL_MIN_WIDTH = 260;
const PANEL_MIN_HEIGHT = 320;

/**
 * Size the panel takes when it is detached from the page.
 * `documentPictureInPicture` is desktop-only — no mobile browser implements
 * it — so phones get this card instead, floating over a page that keeps
 * scrolling behind it.
 */
const DETACHED_WIDTH = 360;
const DETACHED_HEIGHT = 520;

/** Every side and corner the panel can be resized from. */
const RESIZE_EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

type ResizeEdge = (typeof RESIZE_EDGES)[number];

/** Cursor and hit area for each grab edge, keyed by direction. */
const RESIZE_HANDLES: Record<ResizeEdge, { label: string; className: string }> =
  {
    n: {
      label: 'Cambiar el alto del chat por arriba',
      className: 'top-0 right-3 left-3 h-1.5 cursor-ns-resize',
    },
    s: {
      label: 'Cambiar el alto del chat por abajo',
      className: 'right-3 bottom-0 left-3 h-1.5 cursor-ns-resize',
    },
    e: {
      label: 'Cambiar el ancho del chat por la derecha',
      className: 'top-3 right-0 bottom-3 w-1.5 cursor-ew-resize',
    },
    w: {
      label: 'Cambiar el ancho del chat por la izquierda',
      className: 'top-3 bottom-3 left-0 w-1.5 cursor-ew-resize',
    },
    ne: {
      label: 'Cambiar el tamaño del chat por la esquina superior derecha',
      className: 'top-0 right-0 size-4 cursor-nesw-resize',
    },
    nw: {
      label: 'Cambiar el tamaño del chat por la esquina superior izquierda',
      className: 'top-0 left-0 size-4 cursor-nwse-resize',
    },
    se: {
      label: 'Cambiar el tamaño del chat por la esquina inferior derecha',
      className: 'right-0 bottom-0 size-4 cursor-nwse-resize',
    },
    sw: {
      label: 'Cambiar el tamaño del chat por la esquina inferior izquierda',
      className: 'bottom-0 left-0 size-4 cursor-nesw-resize',
    },
  };

interface PanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Keeps the panel fully on screen after a move, a resize or a rotation. */
function clampPanelRect(rect: PanelRect): PanelRect {
  const width = clamp(
    rect.width,
    PANEL_MIN_WIDTH,
    window.innerWidth - PANEL_MARGIN * 2
  );
  const height = clamp(
    rect.height,
    PANEL_MIN_HEIGHT,
    window.innerHeight - PANEL_MARGIN * 2
  );

  return {
    width,
    height,
    x: clamp(rect.x, PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN),
    y: clamp(rect.y, PANEL_MARGIN, window.innerHeight - height - PANEL_MARGIN),
  };
}

/**
 * Applies one drag of one edge. Each axis is clamped before the opposite side
 * is derived, so pulling past the minimum stops the panel instead of sliding
 * it across the screen.
 */
function resizePanelRect(
  rect: PanelRect,
  edge: ResizeEdge,
  dx: number,
  dy: number
): PanelRect {
  let { x, y, width, height } = rect;

  if (edge.includes('e')) {
    width = clamp(
      rect.width + dx,
      PANEL_MIN_WIDTH,
      window.innerWidth - PANEL_MARGIN - rect.x
    );
  } else if (edge.includes('w')) {
    const right = rect.x + rect.width;
    width = clamp(rect.width - dx, PANEL_MIN_WIDTH, right - PANEL_MARGIN);
    x = right - width;
  }

  if (edge.includes('s')) {
    height = clamp(
      rect.height + dy,
      PANEL_MIN_HEIGHT,
      window.innerHeight - PANEL_MARGIN - rect.y
    );
  } else if (edge.includes('n')) {
    const bottom = rect.y + rect.height;
    height = clamp(rect.height - dy, PANEL_MIN_HEIGHT, bottom - PANEL_MARGIN);
    y = bottom - height;
  }

  return { x, y, width, height };
}

/** Single shared quick action shown above the composer for every agent. */
const QUICK_ACTIONS = ['Hablar con un asesor'];

/**
 * What the agent is doing while a reply is in flight. The line walks through
 * these instead of showing three anonymous dots, so the wait reads as work.
 */
const THINKING_STEPS = [
  'Entendiendo tu mensaje',
  'Buscando en el contenido',
  'Conectando las ideas',
  'Redactando la respuesta',
];

/** How long each working step stays on screen, in ms. */
const THINKING_STEP_MS = 2200;

/** Distance from the bottom, in px, still counted as reading the latest turn. */
const AT_BOTTOM_THRESHOLD = 80;

/**
 * How long, in ms, scroll events are ignored after the thread pins itself.
 * A pin lands before the answer has finished growing, so the scroll event it
 * fires reports a gap that is about to close — reading it as "the learner
 * scrolled away" is what unpins the thread mid-answer.
 */
const SCROLL_SETTLE_MS = 400;

/**
 * Opening menu. Each option is sent as a plain message: the orchestrator reads
 * the intent and hands the conversation to the right specialist on its own.
 */
const WELCOME_OPTIONS = [
  'Quiero aprender algo nuevo',
  'Quiero desarrollar y crear una nueva idea o proyecto',
  'Quiero conocer qué puedo hacer en Artiefy',
];

/**
 * Chat history lives in the browser: the chat API stores no conversations.
 * The key carries the account id, so two people sharing a device never read
 * each other's chats — signed-out visitors get their own `anon` bucket.
 */
const HISTORY_STORAGE_PREFIX = 'artiefy.agent-chat.history';

const historyStorageKeyFor = (userId: string | null) =>
  `${HISTORY_STORAGE_PREFIX}.${userId ?? 'anon'}`;

/** Stands in for a conversation id while the clear-all confirmation is open. */
const CLEAR_ALL_ID = '__all__';

/**
 * The single, unscoped key every visitor shared before histories were split per
 * account. Read once so nobody loses their chats on the way over, then dropped.
 */
const LEGACY_HISTORY_KEY = HISTORY_STORAGE_PREFIX;

function readStoredHistory(key: string): StoredConversation[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or unavailable storage: start with an empty history.
    return [];
  }
}

/**
 * Loads one account's conversations, adopting the pre-split blob the first time
 * a bucket would otherwise come up empty. The blob had no owner and was already
 * readable by anyone on this browser profile, so claiming it exposes nothing
 * new — and once claimed it is deleted, which is what ends the sharing.
 */
function loadHistoryFor(key: string): StoredConversation[] {
  const stored = readStoredHistory(key);
  if (stored.length > 0) return stored;

  const legacy = readStoredHistory(LEGACY_HISTORY_KEY);
  if (legacy.length === 0) return stored;

  try {
    window.localStorage.setItem(key, JSON.stringify(legacy));
    window.localStorage.removeItem(LEGACY_HISTORY_KEY);
  } catch {
    // Storage blocked: the list still loads, it just is not migrated yet.
  }

  return legacy;
}
const MAX_STORED_CONVERSATIONS = 20;

export type AgentId = 'artie' | 'tutor' | 'coach';

/** Order of the manual switcher: the orchestrator first, then the specialists. */
const AGENT_ORDER: AgentId[] = ['artie', 'tutor', 'coach'];

/** What each one is for, shown under its name in the switcher. */
const AGENT_ROLES: Record<AgentId, string> = {
  artie: 'Consultas generales',
  tutor: 'Cursos',
  coach: 'Proyectos guiados',
};

interface AgentDefinition {
  id: AgentId;
  name: string;
  badge: string;
  /** Hex, always 6 digits: alpha suffixes are appended to it (`${color}1f`). */
  color: string;
  /** Lucide icons and the inline Artiefy mark both satisfy this. */
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
}

const AGENTS: Record<AgentId, AgentDefinition> = {
  artie: {
    id: 'artie',
    name: 'Artie',
    badge: 'Guía',
    color: LAUNCHER_COLOR,
    icon: ArtiefyMark,
  },
  tutor: {
    id: 'tutor',
    name: 'Tutor',
    badge: 'Enseñanza',
    color: '#FBBD23',
    icon: Brain,
  },
  coach: {
    id: 'coach',
    name: 'Coach',
    badge: 'Proyectos',
    color: '#32C8B4',
    icon: Rocket,
  },
};

export interface AgentActivity {
  id: number;
  name: string;
  isCompleted: boolean;
}

export interface AgentObjective {
  id: number;
  title: string;
  activities?: AgentActivity[];
}

export interface AgentProject {
  id: number;
  title: string;
  objectives: AgentObjective[];
}

export interface AgentChatWidgetProps {
  /** Present only on guided project routes. Unlocks the Coach objectives tree. */
  project?: AgentProject;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agent: AgentId;
  text: string;
  time: string;
}

type AgentQuotaTier = 'anon' | 'free' | 'premium';

interface AgentQuotaPayload {
  tier: AgentQuotaTier;
  limit: number;
  remaining: number;
  resetsDaily: boolean;
}

interface AgentQuotaNotice {
  title: string;
  body: string;
  primary: { label: string; href: string } | null;
  secondary: { label: string; href: string } | null;
}

/** Friendly, sales-forward copy shown when an allowance runs out. */
function buildQuotaNotice(quota: AgentQuotaPayload): AgentQuotaNotice {
  if (quota.tier === 'premium') {
    return {
      title: 'Llegaste a tus intentos de hoy',
      body: `Tu plan incluye ${quota.limit} intentos diarios con nuestros agentes. El cupo se renueva mañana y seguimos donde lo dejamos.`,
      primary: null,
      secondary: null,
    };
  }

  if (quota.tier === 'free') {
    return {
      title: 'Se te acabaron los intentos de prueba',
      body: `Aprovechaste los ${quota.limit} intentos de tu prueba gratis, y se nota que le estás sacando jugo. Con Premium tienes 50 intentos al día con Artie, el Tutor y el Coach, más todos los cursos, para que nada te frene.`,
      primary: { label: 'Quiero Premium', href: '/planes' },
      secondary: null,
    };
  }

  return {
    title: 'Se te acabaron los intentos gratis',
    body: `Ya usaste los ${quota.limit} intentos de cortesía. Crea tu cuenta y estrena 10 días de Premium, o pásate a Premium y conversa hasta 50 veces al día con nuestros agentes.`,
    primary: { label: 'Quiero Premium', href: '/planes' },
    secondary: { label: 'Crear cuenta gratis', href: '/sign-up' },
  };
}

interface StoredConversation {
  id: string;
  agent: AgentId;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  /** Absent on conversations stored before scopes existed. */
  scope?: AgentChatScope;
}

/** Conversations saved before scopes existed are read back as general ones. */
function readScope(conversation: StoredConversation): AgentChatScope {
  return conversation.scope ?? GENERAL_SCOPE;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

export function AgentChatWidget({ project }: AgentChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agentId, setAgentId] = useState<AgentId>(project ? 'coach' : 'artie');
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [expandedObjectives, setExpandedObjectives] = useState<number[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [history, setHistory] = useState<StoredConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<AgentQuotaNotice | null>(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  /**
   * Explicit geometry, taken over from CSS the moment the learner drags an edge
   * or detaches the panel. Null means the default layout is still in charge:
   * full-screen sheet on phones, corner popover from `md` up.
   */
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);
  /** Rendered panel width, for layouts CSS or the pop-out window controls. */
  const [measuredWidth, setMeasuredWidth] = useState(0);
  /** True only while the panel floats over the page as a detached card. */
  const [isDetached, setIsDetached] = useState(false);
  /** Conversation waiting for a delete confirmation; null when none is. */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  /** Id of the agent message currently typewriter-revealing; null when idle. */
  const [revealingId, setRevealingId] = useState<string | null>(null);
  /** Full-window mode, stacked above the site header. Additive: it never
   *  touches `panelRect`, so collapsing restores the panel exactly. */
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * The scope the route itself implies. Guided project pages mount the widget
   * with their project, so a chat opened there is already about that project.
   */
  const routeScope = useMemo<AgentChatScope>(
    () =>
      project
        ? { kind: 'project', id: project.id, title: project.title }
        : GENERAL_SCOPE,
    [project]
  );
  const [scope, setScope] = useState<AgentChatScope>(routeScope);

  const hasLoadedHistory = useRef(false);
  /** Storage key the current `history` came from, to detect account switches. */
  const loadedHistoryKey = useRef<string | null>(null);
  /** The open conversation, readable from callbacks that outlive a render. */
  const activeConversationRef = useRef<string | null>(null);
  /** Cancels the reply in flight when the learner leaves its conversation. */
  const inFlightRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  /** Pointer Y where the current handle drag started; null when not dragging. */
  const dragStartY = useRef<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  /** Pointer offset inside the panel while moving it; null when idle. */
  const moveOffset = useRef<{ x: number; y: number } | null>(null);
  /** Pointer position, edge and panel box when the resize gesture started. */
  const resizeStart = useRef<{
    pointerX: number;
    pointerY: number;
    edge: ResizeEdge;
    rect: PanelRect;
  } | null>(null);
  /** Mirrors `isAtBottom` for effects that must read it without re-subscribing. */
  const isAtBottomRef = useRef(true);
  /** Timestamp until which scroll events come from a pin, not from the learner. */
  const settleUntil = useRef(0);
  /** Mirrors `hasRoomForHistory` for the subscription, which never re-binds. */
  const hasRoomForHistoryRef = useRef(false);

  const {
    isSupported: canPopOut,
    pipWindow,
    open: openPopOut,
    close: closePopOut,
  } = useDocumentPictureInPicture(PIP_WIDTH, PIP_HEIGHT);
  const isPoppedOut = pipWindow !== null;

  const { user, isLoaded: isUserLoaded } = useUser();
  const historyStorageKey = historyStorageKeyFor(user?.id ?? null);

  /**
   * Switches the open conversation. Any reply still in flight belongs to the
   * one being left, so it is aborted here: without this it lands in whatever
   * chat is open by the time it resolves.
   *
   * Only refs and setters are touched, which is what keeps it stable enough to
   * sit in an effect's dependency list.
   */
  const leaveConversation = useCallback((nextId: string | null) => {
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    activeConversationRef.current = nextId;
    setConversationId(nextId);
    setIsSending(false);
    setUnreadCount(0);
    setPendingDeleteId(null);
    // Whatever bubble was mid-reveal belongs to the conversation being left;
    // it renders its full text instantly once `revealingId` no longer matches.
    setRevealingId(null);
  }, []);

  const agent = AGENTS[agentId];
  const AgentIcon = agent.icon;

  const hasPanelRect = panelRect !== null;
  /**
   * Full-window mode never applies while popped out — that window is already
   * its own always-on-top surface, so "expand" has nothing to add there.
   */
  const isFullWindow = isExpanded && !isPoppedOut;
  /** A panel with its own geometry can be dragged around; a CSS-sized one
   *  cannot, and neither can one currently forced full-window. */
  const canMovePanel = hasPanelRect && !isPoppedOut && !isFullWindow;

  /**
   * How wide the panel actually is. A dragged panel knows its own width; a
   * CSS-sized one — the corner popover, the sheet, the pop-out window — has to
   * be measured, so widening the pop-out window counts too.
   */
  const panelWidth = panelRect?.width ?? measuredWidth;

  /** Whether the panel is wide enough to show two columns side by side. */
  const hasRoomForHistory = panelWidth >= DOCKED_HISTORY_MIN_PANEL;

  /**
   * Two columns need room: the history docks beside the thread once the panel
   * is wide enough, and keeps covering it below that.
   */
  const showDockedHistory = isHistoryOpen && hasRoomForHistory;

  // Widening the panel deploys the history beside the thread on its own —
  // that empty half is what the space was made for. Shrinking folds it back,
  // so it never turns into an overlay covering the conversation.
  useEffect(() => {
    hasRoomForHistoryRef.current = hasRoomForHistory;
    setIsHistoryOpen(hasRoomForHistory);
  }, [hasRoomForHistory]);

  // Measure the CSS-driven layouts. The pop-out window resizes independently of
  // the page, so it is the one that has to be listened to when it exists.
  useEffect(() => {
    if (!isOpen) return;

    const view = pipWindow ?? window;

    const measure = () => {
      const element = rootRef.current;
      if (element) setMeasuredWidth(element.getBoundingClientRect().width);
    };

    measure();
    view.addEventListener('resize', measure);

    return () => view.removeEventListener('resize', measure);
    // `isExpanded` is included so toggling full-window mode re-measures right
    // away: its layout changes without firing a `resize` event on its own.
  }, [isOpen, pipWindow, isExpanded]);

  // Escape collapses the full-window mode, the same way it closes any other
  // overlay stacked above the page.
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Rotating the phone or resizing the window must not leave the panel
  // half off screen.
  useEffect(() => {
    if (!hasPanelRect) return;

    const reclamp = () =>
      setPanelRect((prev) => (prev ? clampPanelRect(prev) : prev));

    window.addEventListener('resize', reclamp);
    window.addEventListener('orientationchange', reclamp);

    return () => {
      window.removeEventListener('resize', reclamp);
      window.removeEventListener('orientationchange', reclamp);
    };
  }, [hasPanelRect]);

  /**
   * Entrance. On small screens the panel is an Apple-style bottom sheet: it
   * slides up over a fading backdrop. From `md` up it stays the corner popover
   * and only gets a short fade, so the desktop layout is untouched.
   */
  useGSAP(
    () => {
      if (!isOpen || !panelRef.current) return;

      const mm = gsap.matchMedia();

      mm.add(BOTTOM_SHEET_QUERY, () => {
        const timeline = gsap.timeline();

        // The floating card renders no backdrop, so there is nothing to fade.
        if (backdropRef.current) {
          timeline.fromTo(
            backdropRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.25, ease: 'power1.out' },
            0
          );
        }

        timeline.from(
          panelRef.current,
          { yPercent: 100, duration: 0.45, ease: 'power3.out' },
          0
        );
      });

      mm.add(`not all and ${BOTTOM_SHEET_QUERY}`, () => {
        gsap.from(panelRef.current, {
          autoAlpha: 0,
          y: 12,
          duration: 0.2,
          ease: 'power2.out',
        });
      });

      return () => {
        mm.revert();
        // The drag and exit tweens below are created after this hook runs, so
        // they live outside the context and need killing by hand.
        gsap.killTweensOf([panelRef.current, backdropRef.current]);
      };
    },
    { scope: rootRef, dependencies: [isOpen], revertOnUpdate: true }
  );

  /** Plays the exit animation first, then unmounts the panel. */
  const closePanel = () => {
    const panel = panelRef.current;

    if (
      !panel ||
      hasPanelRect ||
      !window.matchMedia(BOTTOM_SHEET_QUERY).matches
    ) {
      setIsOpen(false);
      return;
    }

    gsap
      .timeline({ onComplete: () => setIsOpen(false) })
      .to(panel, { yPercent: 100, y: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(backdropRef.current, { autoAlpha: 0, duration: 0.3 }, 0);
  };

  /**
   * Dismisses the chat wherever it currently lives. The sheet animation only
   * exists in the page, so the detached layouts are torn down directly.
   */
  const dismissChat = () => {
    if (isPoppedOut) {
      closePopOut();
      setIsOpen(false);
      return;
    }

    if (hasPanelRect) {
      setPanelRect(null);
      setIsDetached(false);
      setIsOpen(false);
      return;
    }

    closePanel();
  };

  /**
   * Detaches the chat so the page stays usable behind it. Desktop Chromium and
   * Firefox get a real always-on-top window; everywhere else — every phone
   * included, since no mobile browser ships the API — it becomes a draggable
   * card floating over the page.
   */
  const togglePopOut = () => {
    if (isPoppedOut) {
      closePopOut();
      return;
    }

    if (canPopOut) {
      void openPopOut();
      return;
    }

    if (isDetached) {
      setPanelRect(null);
      setIsDetached(false);
      return;
    }

    const width = Math.min(
      DETACHED_WIDTH,
      window.innerWidth - PANEL_MARGIN * 2
    );
    const height = Math.min(
      DETACHED_HEIGHT,
      window.innerHeight - PANEL_MARGIN * 2
    );

    setPanelRect(
      clampPanelRect({
        width,
        height,
        x: window.innerWidth - width - PANEL_MARGIN,
        y: window.innerHeight - height - PANEL_MARGIN,
      })
    );
    setIsDetached(true);
  };

  /**
   * Resizes the pop-out window itself. Its top-left corner belongs to the OS,
   * so every edge grows or shrinks it from that fixed origin: pulling the left
   * edge outward widens the window rather than moving it.
   */
  const resizePopOut = (
    rect: PanelRect,
    edge: ResizeEdge,
    dx: number,
    dy: number
  ) => {
    if (!pipWindow) return;

    const widthDelta = edge.includes('w') ? -dx : edge.includes('e') ? dx : 0;
    const heightDelta = edge.includes('n') ? -dy : edge.includes('s') ? dy : 0;

    try {
      pipWindow.resizeTo(
        Math.round(
          clamp(
            rect.width + widthDelta,
            PANEL_MIN_WIDTH,
            pipWindow.screen.availWidth
          )
        ),
        Math.round(
          clamp(
            rect.height + heightDelta,
            PANEL_MIN_HEIGHT,
            pipWindow.screen.availHeight
          )
        )
      );
    } catch {
      // `resizeTo` requires a live user activation and the browser may refuse
      // mid-drag. The release handler applies the final size instead.
    }
  };

  /**
   * Reads the panel's current box off the DOM. A CSS-sized panel has no rect
   * of its own until a gesture needs one, so the first drag freezes it exactly
   * where it already sits instead of making it jump.
   */
  const readPanelRect = (): PanelRect | null => {
    if (panelRect) return panelRect;

    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return null;

    return { x: box.left, y: box.top, width: box.width, height: box.height };
  };

  // Move the panel by its header. Buttons inside it keep working: a gesture
  // that starts on one is a click, not a move.
  const handleMoveStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = readPanelRect();
    if (!rect) return;
    if ((event.target as HTMLElement).closest('button, a, input')) return;

    moveOffset.current = {
      x: event.clientX - rect.x,
      y: event.clientY - rect.y,
    };
    setPanelRect(rect);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMoveMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const offset = moveOffset.current;
    if (!offset) return;

    event.preventDefault();
    setPanelRect((prev) =>
      prev
        ? clampPanelRect({
            ...prev,
            x: event.clientX - offset.x,
            y: event.clientY - offset.y,
          })
        : prev
    );
  };

  const handleMoveEnd = () => {
    moveOffset.current = null;
  };

  /** Grabs one side or corner. Every edge shares this one gesture. */
  const handleResizeStart =
    (edge: ResizeEdge) => (event: ReactPointerEvent<HTMLDivElement>) => {
      // Inside the pop-out window there is no panel box to resize: the window
      // itself is the panel, so its outer size is what the gesture carries.
      const rect = pipWindow
        ? {
            x: pipWindow.screenX,
            y: pipWindow.screenY,
            width: pipWindow.outerWidth,
            height: pipWindow.outerHeight,
          }
        : readPanelRect();
      if (!rect) return;

      resizeStart.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        edge,
        rect,
      };
      if (!pipWindow) setPanelRect(rect);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

  const handleResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = resizeStart.current;
    if (!start) return;

    event.preventDefault();

    const dx = event.clientX - start.pointerX;
    const dy = event.clientY - start.pointerY;

    if (pipWindow) {
      resizePopOut(start.rect, start.edge, dx, dy);
      return;
    }

    setPanelRect(resizePanelRect(start.rect, start.edge, dx, dy));
  };

  const handleResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = resizeStart.current;

    // `resizeTo` needs a fresh user activation, and a long drag can outlive the
    // one from pointerdown. Releasing is itself an activation, so the final
    // size is applied here even when the live ones during the drag were denied.
    if (start && pipWindow) {
      resizePopOut(
        start.rect,
        start.edge,
        event.clientX - start.pointerX,
        event.clientY - start.pointerY
      );
    }

    resizeStart.current = null;
  };

  // Drag the grab handle down to dismiss, the way a native sheet behaves.
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !panelRef.current) return;
    // Only downward drags move the sheet; pulling up does nothing.
    gsap.set(panelRef.current, {
      y: Math.max(0, event.clientY - dragStartY.current),
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !panelRef.current) return;

    const travelled = Math.max(0, event.clientY - dragStartY.current);
    dragStartY.current = null;

    if (travelled > DISMISS_THRESHOLD) {
      closePanel();
      return;
    }

    gsap.to(panelRef.current, { y: 0, duration: 0.25, ease: 'power2.out' });
  };

  /**
   * Jumps to the newest turn. Instant on purpose: a smooth scroll fires
   * intermediate events that read as the learner scrolling away.
   */
  const pinToBottom = useCallback(() => {
    const area = scrollAreaRef.current;
    if (!area) return;

    settleUntil.current = performance.now() + SCROLL_SETTLE_MS;
    area.scrollTop = area.scrollHeight;
  }, []);

  const scrollToBottom = useCallback(() => {
    pinToBottom();
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setUnreadCount(0);
  }, [pinToBottom]);

  /**
   * A revealing bubble grows without `messages` itself changing, so the pin
   * effect keyed on `messages` never fires for it. Each reveal tick re-pins
   * imperatively instead, the same way the code-block `ResizeObserver` below
   * does for lazy-loaded content.
   */
  const handleRevealTick = useCallback(() => {
    if (isAtBottomRef.current) pinToBottom();
  }, [pinToBottom]);

  const handleScroll = (event: ReactUIEvent<HTMLDivElement>) => {
    const area = event.currentTarget;
    const atBottom =
      area.scrollHeight - area.scrollTop - area.clientHeight <
      AT_BOTTOM_THRESHOLD;

    // Still settling after a pin: the gap belongs to content that is finishing
    // its layout, not to a learner who scrolled up.
    if (!atBottom && performance.now() < settleUntil.current) return;

    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  };

  // Follow the thread when the learner just wrote or was already reading the
  // latest turn. Otherwise the reply is counted, and the jump button announces
  // it instead of yanking them away from what they were reading.
  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];

    if (last.role === 'user' || isAtBottomRef.current) {
      scrollToBottom();
      return;
    }

    setUnreadCount((prev) => prev + 1);
  }, [messages, scrollToBottom]);

  // A message keeps growing after it lands: the syntax highlighter behind a
  // code block loads lazily. Stay pinned to the bottom while that happens,
  // otherwise the answer scrolls out from under the learner.
  useEffect(() => {
    const area = scrollAreaRef.current;
    if (!area || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!isAtBottomRef.current) return;
      pinToBottom();
    });

    for (const child of Array.from(area.children)) observer.observe(child);

    return () => observer.disconnect();
  }, [messages, pinToBottom]);

  // Walk the working line while a reply is in flight, stopping on the last
  // step so a slow answer never loops back to "entendiendo tu mensaje".
  useEffect(() => {
    if (!isSending) {
      setThinkingStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setThinkingStep((prev) => Math.min(prev + 1, THINKING_STEPS.length - 1));
    }, THINKING_STEP_MS);

    return () => window.clearInterval(timer);
  }, [isSending]);

  // Load the conversations of whoever is signed in, and reload them when that
  // changes. Waiting for Clerk avoids reading the anonymous bucket first and
  // flashing someone else's list.
  useEffect(() => {
    if (!isUserLoaded) return;

    const previousKey = loadedHistoryKey.current;
    const isAccountSwitch =
      previousKey !== null && previousKey !== historyStorageKey;

    loadedHistoryKey.current = historyStorageKey;
    hasLoadedHistory.current = false;
    setHistory(loadHistoryFor(historyStorageKey));

    // Signing in or out must not leave the previous account's conversation on
    // screen, so the open one is dropped along with its pending reply.
    if (isAccountSwitch) {
      leaveConversation(null);
      setMessages([]);
      setQuotaNotice(null);
    }
  }, [historyStorageKey, isUserLoaded, leaveConversation]);

  // Keep the open conversation mirrored into the history list. Only exchanges
  // that got an answer are stored, so a blocked message leaves nothing behind.
  useEffect(() => {
    if (!conversationId) return;
    if (!messages.some((message) => message.role === 'agent')) return;

    const firstUserMessage = messages.find(
      (message) => message.role === 'user'
    );
    // A scoped conversation is named after what it is about, so the history
    // reads as a list of courses and projects instead of opening lines.
    const title =
      scope.kind === 'general'
        ? (firstUserMessage?.text.slice(0, 60) ?? 'Nueva conversación')
        : scope.title;

    const entry: StoredConversation = {
      id: conversationId,
      agent: agentId,
      title,
      updatedAt: Date.now(),
      messages,
      scope,
    };

    setHistory((prev) =>
      [entry, ...prev.filter((item) => item.id !== conversationId)].slice(
        0,
        MAX_STORED_CONVERSATIONS
      )
    );
  }, [messages, conversationId, agentId, scope]);

  // Persist on every change except the very first render, which would
  // overwrite stored history before the load effect above has run.
  useEffect(() => {
    if (!isUserLoaded) return;
    if (!hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      return;
    }
    try {
      window.localStorage.setItem(historyStorageKey, JSON.stringify(history));
    } catch {
      // Storage full or blocked: history stays in memory for this session.
    }
  }, [history, historyStorageKey, isUserLoaded]);

  /** Closes the history, unless it is docked — there it is part of the layout. */
  const closeHistoryPanel = () => {
    if (!hasRoomForHistory) setIsHistoryOpen(false);
  };

  const startNewConversation = () => {
    // Cancels the reply the previous chat was still waiting for, so it cannot
    // land here. Also clears its sending state: this chat starts idle.
    leaveConversation(null);
    setMessages([]);
    setDraft('');
    setQuotaNotice(null);
    closeHistoryPanel();
    setScope(routeScope);
    // A fresh chat always starts at the orchestrator, whoever answered last:
    // it reads the intent and hands off to the specialist on its own.
    setAgentId('artie');
  };

  const openConversation = (conversation: StoredConversation) => {
    leaveConversation(conversation.id);
    setAgentId(conversation.agent);
    setMessages(conversation.messages);
    setDraft('');
    setQuotaNotice(null);
    closeHistoryPanel();
    setScope(readScope(conversation));
  };

  /**
   * Enrolling in a course or guided project anywhere in the app opens the chat
   * on that subject. It always lands in a fresh conversation, so the new
   * subject never gets mixed into whatever was already open.
   */
  useEffect(
    () =>
      subscribeToAgentChat(({ scope: requested, greeting }) => {
        const now = new Date();
        const specialist: AgentId =
          requested.kind === 'project' ? 'coach' : 'tutor';

        setScope(requested);
        setAgentId(specialist);
        leaveConversation(`conv-${now.getTime()}`);
        setMessages([
          {
            id: `${now.getTime()}-agent`,
            role: 'agent',
            agent: specialist,
            text: greeting,
            time: formatTime(now),
          },
        ]);
        setDraft('');
        setQuotaNotice(null);
        // Only the overlay hides the new conversation; a docked column does not.
        if (!hasRoomForHistoryRef.current) setIsHistoryOpen(false);
        setIsOpen(true);
      }),
    [leaveConversation]
  );

  /**
   * Deleting is one tap plus a confirmation: the chat is the only copy, since
   * nothing is stored server-side.
   */
  const deleteConversation = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setPendingDeleteId(null);

    // Deleting the chat being read also drops what it was still waiting for.
    if (activeConversationRef.current === id) {
      leaveConversation(null);
      setMessages([]);
      setQuotaNotice(null);
    }
  };

  const deleteAllConversations = () => {
    setHistory([]);
    setPendingDeleteId(null);
    leaveConversation(null);
    setMessages([]);
    setQuotaNotice(null);
  };

  const { totalActivities, completedActivities, currentActivity } =
    useMemo(() => {
      let total = 0;
      let completed = 0;
      let current: {
        objective: AgentObjective;
        activity: AgentActivity;
      } | null = null;

      for (const objective of project?.objectives ?? []) {
        for (const activity of objective.activities ?? []) {
          total += 1;
          if (activity.isCompleted) {
            completed += 1;
          } else if (!current) {
            current = { objective, activity };
          }
        }
      }

      return {
        totalActivities: total,
        completedActivities: completed,
        currentActivity: current,
      };
    }, [project]);

  // The active activity is the selected one, falling back to the first
  // uncompleted activity in objective order.
  const activeActivityId =
    selectedActivityId ?? currentActivity?.activity.id ?? null;

  const progressPercent =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  const showTree = Boolean(project) && agentId === 'coach';

  const toggleObjective = (objectiveId: number) => {
    setExpandedObjectives((prev) =>
      prev.includes(objectiveId)
        ? prev.filter((id) => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const isObjectiveExpanded = (objective: AgentObjective) =>
    expandedObjectives.includes(objective.id) ||
    (expandedObjectives.length === 0 &&
      objective.id === currentActivity?.objective.id);

  const sendMessage = async (text: string) => {
    if (!text || isSending || quotaNotice) return;

    const now = new Date();
    const userMessageId = `${now.getTime()}-user`;

    // Everything below belongs to THIS conversation. The learner can start a
    // new chat while the answer is still travelling, so every write that
    // follows the await is checked against what is open by then.
    const targetConversationId = conversationId ?? `conv-${now.getTime()}`;
    if (!conversationId) setConversationId(targetConversationId);
    activeConversationRef.current = targetConversationId;

    const isStillOpen = () =>
      activeConversationRef.current === targetConversationId;

    const controller = new AbortController();
    inFlightRef.current = controller;

    // A new turn starting cancels whatever reveal was still animating: the
    // previous bubble renders its full text instantly the moment its id no
    // longer matches `revealingId`.
    setRevealingId(null);

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        agent: agentId,
        text,
        time: formatTime(now),
      },
    ]);
    setDraft('');
    setIsSending(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agent: agentId,
          projectId: scope.kind === 'project' ? scope.id : undefined,
          projectSource: scope.kind === 'project' ? scope.source : undefined,
          courseId: scope.kind === 'course' ? scope.id : undefined,
          // The activity tree only belongs to the project this route mounted;
          // a project picked up from an enrollment elsewhere has none loaded.
          activityId:
            scope.kind === 'project' && scope.id === project?.id
              ? activeActivityId
              : undefined,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        agent?: AgentId;
        error?: string;
        quota?: AgentQuotaPayload;
        notice?: AgentQuotaNotice;
      };

      // The learner moved on: this answer belongs to a chat they already left,
      // and the one they are reading now must not inherit it.
      if (!isStillOpen()) return;

      // Blocked: no session, not enrolled, or allowance spent. In every case
      // the message never reached the agent, so the optimistic bubble goes
      // away and the draft comes back — the learner types nothing twice.
      // What replaces the composer is the upgrade card, not an error line: a
      // wall that only says "no" converts nobody.
      const blockingNotice =
        response.status === 429 && data.quota
          ? buildQuotaNotice(data.quota)
          : (data.notice ?? null);

      if (blockingNotice) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== userMessageId)
        );
        setDraft(text);
        setQuotaNotice(blockingNotice);
        return;
      }

      const replyTime = new Date();
      // The orchestrator decides who answers, so the badge follows the reply
      // instead of whatever the previous turn happened to be.
      const answeringAgent =
        data.agent && AGENTS[data.agent] ? data.agent : agentId;
      setAgentId(answeringAgent);

      const agentMessageId = `${replyTime.getTime()}-agent`;

      setMessages((prev) => [
        ...prev,
        {
          id: agentMessageId,
          role: 'agent',
          agent: answeringAgent,
          text:
            data.reply ??
            data.error ??
            'No pude responder en este momento. Intenta de nuevo.',
          time: formatTime(replyTime),
        },
      ]);
      setRevealingId(agentMessageId);
    } catch (error) {
      // Aborting is how leaving a conversation cancels its reply, not a
      // failure the learner should ever be told about.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (!isStillOpen()) return;

      const errorTime = new Date();
      setMessages((prev) => [
        ...prev,
        {
          id: `${errorTime.getTime()}-agent`,
          role: 'agent',
          agent: agentId,
          text: 'No pudimos contactar al asistente. Revisa tu conexión e intenta de nuevo.',
          time: formatTime(errorTime),
        },
      ]);
    } finally {
      if (inFlightRef.current === controller) inFlightRef.current = null;
      // A conversation the learner already left must not unlock the composer
      // of the one they are in now — that one owns its own sending state.
      if (isStillOpen()) setIsSending(false);
    }
  };

  // `js-floating-launcher` lets globals.css lift the launcher above the fixed
  // mobile bottom nav on small screens.
  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Abrir chat con Artie"
        onClick={() => setIsOpen(true)}
        className="js-floating-launcher fixed right-6 bottom-6 z-60 flex size-14 items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${LAUNCHER_COLOR}, rgba(34, 196, 211, 0.65))`,
          boxShadow: '0 4px 24px rgba(34, 196, 211, 0.35)',
        }}
      >
        <Brain className="size-6" style={{ color: 'rgb(8, 12, 22)' }} />
      </button>
    );
  }

  // The floating window is narrower than the `md` breakpoint, so the panel
  // reuses its full-screen sheet layout there and fills the window edge to
  /* Saved conversations plus the new-chat action. Rendered either as the
     full-cover overlay of the compact panel or as the docked left column
     of the expanded one, so both layouts share one markup. */
  const historyPanel = (
    <>
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <h3 className="text-sm font-semibold text-foreground">
          Historial de chats
        </h3>
        <div className="flex items-center gap-1">
          {history.length > 0 &&
            (pendingDeleteId === CLEAR_ALL_ID ? (
              <>
                <button
                  type="button"
                  onClick={deleteAllConversations}
                  className="
                    rounded-lg px-2 py-1 text-[11px] font-semibold
                    text-red-400 transition-colors
                    hover:bg-red-500/10
                  "
                >
                  Borrar todo
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(null)}
                  className="
                    rounded-lg px-2 py-1 text-[11px] font-medium
                    text-muted-foreground transition-colors
                    hover:bg-white/[0.06]
                  "
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label="Vaciar el historial"
                title="Vaciar el historial"
                onClick={() => setPendingDeleteId(CLEAR_ALL_ID)}
                className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </button>
            ))}
          <button
            type="button"
            aria-label="Cerrar historial"
            onClick={() => setIsHistoryOpen(false)}
            className="rounded-lg p-2 transition-colors hover:bg-white/[0.06]"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="scrollbar-minimal flex-1 overflow-y-auto p-3">
        {history.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Todavía no tienes conversaciones guardadas. Escríbele a un agente y
            aparecerán aquí.
          </p>
        ) : (
          <ul className="space-y-1">
            {history.map((conversation) => {
              const conversationAgent = AGENTS[conversation.agent];
              const ConversationIcon = conversationAgent.icon;
              const badge = scopeBadge(readScope(conversation));
              const lastMessage =
                conversation.messages[conversation.messages.length - 1];

              return (
                <li
                  key={conversation.id}
                  className="flex items-center gap-1 rounded-xl px-1 transition-colors hover:bg-white/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `${conversationAgent.color}26`,
                      }}
                    >
                      <ConversationIcon
                        className="size-4"
                        style={{ color: conversationAgent.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm text-foreground">
                          {conversation.title}
                        </p>
                        {badge && (
                          <span
                            className="
                              shrink-0 rounded-full px-2 py-0.5
                              text-[10px] leading-none font-medium
                            "
                            style={{
                              backgroundColor: `${badge.color}1f`,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-[11px] text-muted-foreground">
                          {lastMessage?.text ?? conversationAgent.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDay(conversation.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                  {pendingDeleteId === conversation.id ? (
                    <span className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        aria-label={`Confirmar eliminar ${conversation.title}`}
                        onClick={() => deleteConversation(conversation.id)}
                        className="
                          rounded-lg px-2 py-1 text-[11px] font-semibold
                          text-red-400 transition-colors
                          hover:bg-red-500/10
                        "
                      >
                        Borrar
                      </button>
                      <button
                        type="button"
                        aria-label="Cancelar"
                        onClick={() => setPendingDeleteId(null)}
                        className="
                          rounded-lg p-1.5 transition-colors
                          hover:bg-white/[0.06]
                        "
                      >
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Eliminar ${conversation.title}`}
                      onClick={() => setPendingDeleteId(conversation.id)}
                      className="
                        shrink-0 rounded-lg p-2 transition-colors
                        hover:bg-white/[0.06]
                      "
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Floating action: starting a new chat is the primary intent here,
          so it is spelled out instead of left as a bare plus. */}
      <button
        type="button"
        onClick={startNewConversation}
        className="
          absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full
          py-2.5 pr-4 pl-3 text-sm font-semibold whitespace-nowrap
          transition-transform
          hover:scale-105
          active:scale-95
        "
        style={{
          background: `linear-gradient(135deg, ${agent.color}, ${agent.color}bf)`,
          boxShadow: `0 10px 24px -8px ${agent.color}99`,
          color: '#04121b',
        }}
      >
        <Plus className="size-4" />
        Nuevo chat
      </button>
    </>
  );

  // edge. Only the sheet-specific affordances are dropped.
  const panel = (
    <div
      ref={rootRef}
      className={
        isPoppedOut
          ? 'js-agent-chat-panel fixed inset-0 z-60'
          : isFullWindow
            ? 'js-agent-chat-panel fixed inset-0 z-[100010]'
            : hasPanelRect
              ? 'js-agent-chat-panel fixed z-60'
              : `
                js-agent-chat-panel fixed inset-0 z-60
                md:inset-auto md:right-6 md:bottom-6 md:h-[min(70dvh,620px)]
                md:w-[440px] md:max-w-[calc(100vw-48px)]
              `
      }
      style={
        panelRect && !isPoppedOut && !isFullWindow
          ? {
              left: panelRect.x,
              top: panelRect.y,
              width: panelRect.width,
              height: panelRect.height,
            }
          : undefined
      }
    >
      {/* Sheet backdrop. Tapping it dismisses, like a native bottom sheet. The
          floating card has none: the whole point is to keep the page usable. */}
      {!isPoppedOut && !hasPanelRect && (
        <div
          ref={backdropRef}
          aria-hidden="true"
          onClick={closePanel}
          className="absolute inset-0 bg-black/60 md:hidden"
        />
      )}

      <div
        ref={panelRef}
        className={`
          holo-glass absolute inset-0 flex flex-col overflow-hidden
          ${
            isPoppedOut || isFullWindow
              ? 'rounded-none'
              : hasPanelRect
                ? 'rounded-[18px]'
                : 'rounded-none md:relative md:inset-auto md:h-full md:rounded-[20px]'
          }
        `}
        style={{
          boxShadow: `rgba(4, 6, 11, 0.6) 0px 8px 40px, ${agent.color} 0px 0px 1px`,
          // Padding, not a flex column: the docked history is positioned into
          // this gutter, so the rest of the panel keeps its existing markup.
          paddingLeft: showDockedHistory ? DOCKED_HISTORY_WIDTH : undefined,
        }}
      >
        {showDockedHistory && (
          <aside
            className="absolute inset-y-0 left-0 z-[72] flex flex-col border-r"
            style={{
              width: DOCKED_HISTORY_WIDTH,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {historyPanel}
          </aside>
        )}
        {/* Grab handle: drag it down to dismiss. Bottom-sheet sizes only. */}
        {!isPoppedOut && !hasPanelRect && (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex shrink-0 touch-none justify-center py-2.5 md:hidden"
          >
            <span className="h-1 w-10 rounded-full bg-white/25" />
          </div>
        )}

        {/* Header. On the floating card it is also the drag surface, so the
            learner moves the chat out of the way of whatever they are reading. */}
        <div
          onPointerDown={canMovePanel ? handleMoveStart : undefined}
          onPointerMove={canMovePanel ? handleMoveMove : undefined}
          onPointerUp={canMovePanel ? handleMoveEnd : undefined}
          onPointerCancel={canMovePanel ? handleMoveEnd : undefined}
          className={`relative border-b px-4 py-3 ${
            canMovePanel ? 'cursor-grab touch-none active:cursor-grabbing' : ''
          }`}
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
            background:
              'linear-gradient(135deg, rgba(34, 196, 211, 0.06), rgba(124, 59, 237, 0.03), transparent)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Historial de chats"
              aria-expanded={isHistoryOpen}
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="
                flex size-9 shrink-0 items-center justify-center rounded-full
                border transition-colors hover:bg-white/[0.08]
              "
              style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <AlignLeft className="size-4 text-muted-foreground" />
            </button>

            {/* Agent identity: avatar with a live dot, then name and role. */}
            <div className="relative shrink-0">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}14)`,
                  boxShadow: `inset 0 0 0 1px ${agent.color}33`,
                }}
              >
                <AgentIcon className="size-4" style={{ color: agent.color }} />
              </div>
              <span
                aria-hidden
                className="
                  absolute -right-0.5 -bottom-0.5 size-2.5 animate-pulse
                  rounded-full bg-green-500 ring-2 ring-black/40
                "
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col text-left">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm leading-tight font-semibold text-foreground">
                  {agent.name}
                </h3>
                <span
                  className="
                    shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-none
                    font-medium
                  "
                  style={{
                    backgroundColor: `${agent.color}1f`,
                    color: agent.color,
                  }}
                >
                  {agent.badge}
                </span>
              </div>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {scope.kind === 'general'
                  ? 'Guía de Artiefy'
                  : `${scopeBadge(scope)?.label} · ${scope.title}`}
              </p>
            </div>

            {/* Desktop Chromium and Firefox get a real always-on-top window;
                everywhere else this detaches the panel into a floating card. */}
            <button
              type="button"
              aria-label={
                isPoppedOut || isDetached
                  ? 'Devolver el chat a la página'
                  : 'Ver el chat en una ventana flotante'
              }
              title={
                isPoppedOut || isDetached
                  ? 'Devolver el chat a la página'
                  : 'Ver el chat en una ventana flotante'
              }
              onClick={togglePopOut}
              className="
                shrink-0 rounded-lg p-2 transition-colors
                hover:bg-white/[0.06]
              "
            >
              {isPoppedOut || isDetached ? (
                <PictureInPicture className="size-4 text-muted-foreground" />
              ) : (
                <PictureInPicture2 className="size-4 text-muted-foreground" />
              )}
            </button>

            {/* Full-window mode, stacked above the site header — additive to
                the pop-out control above, which keeps working unchanged. */}
            <button
              type="button"
              aria-label={
                isFullWindow
                  ? 'Salir de pantalla completa'
                  : 'Expandir el chat a pantalla completa'
              }
              aria-expanded={isFullWindow}
              title={
                isFullWindow
                  ? 'Salir de pantalla completa'
                  : 'Expandir el chat a pantalla completa'
              }
              onClick={() => setIsExpanded((prev) => !prev)}
              disabled={isPoppedOut}
              className="
                shrink-0 rounded-lg p-2 transition-colors
                hover:bg-white/[0.06]
                focus-visible:outline focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-white/60
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              {isFullWindow ? (
                <Minimize2 className="size-4 text-muted-foreground" />
              ) : (
                <Maximize2 className="size-4 text-muted-foreground" />
              )}
            </button>

            <button
              type="button"
              aria-label="Cambiar de agente"
              aria-expanded={isAgentMenuOpen}
              title="Cambiar de agente"
              onClick={() => setIsAgentMenuOpen((prev) => !prev)}
              className="
                shrink-0 rounded-lg p-2 transition-colors
                hover:bg-white/[0.06]
              "
            >
              <Users className="size-4 text-muted-foreground" />
            </button>

            <button
              type="button"
              aria-label="Cerrar chat"
              onClick={dismissChat}
              className="
                shrink-0 rounded-lg p-2 transition-colors
                hover:bg-white/[0.06]
              "
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Manual override. The orchestrator still routes on its own; this
              just says who should take the next message. */}
          {isAgentMenuOpen && (
            <div
              className="
                holo-glass absolute top-full right-3 z-[75] mt-1 w-56
                overflow-hidden rounded-xl border
              "
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              {AGENT_ORDER.map((optionId) => {
                const option = AGENTS[optionId];
                const OptionIcon = option.icon;

                return (
                  <button
                    key={optionId}
                    type="button"
                    onClick={() => {
                      setAgentId(optionId);
                      setIsAgentMenuOpen(false);
                    }}
                    className="
                      flex w-full items-center gap-2.5 px-3 py-2.5 text-left
                      transition-colors
                      hover:bg-white/[0.06]
                    "
                  >
                    <span
                      className="
                        flex size-7 shrink-0 items-center justify-center
                        rounded-lg
                      "
                      style={{ background: `${option.color}26` }}
                    >
                      <OptionIcon
                        className="size-3.5"
                        style={{ color: option.color }}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">
                        {option.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {AGENT_ROLES[optionId]}
                      </span>
                    </span>
                    {optionId === agentId && (
                      <CircleCheck
                        className="size-4 shrink-0"
                        style={{ color: option.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat history. Compact: it covers the thread. Expanded: it docks
            on the left instead, rendered above the panel padding. */}
        {isHistoryOpen && !showDockedHistory && (
          <div className="holo-glass absolute inset-0 z-[72] flex flex-col">
            {historyPanel}
          </div>
        )}

        {/* Wrapper positions the jump-to-latest pill over the thread. */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="scrollbar-minimal flex flex-1 flex-col overflow-y-auto"
          >
            {showTree && currentActivity && (
              <button
                type="button"
                onClick={() =>
                  setSelectedActivityId(currentActivity.activity.id)
                }
                className="mx-3 mt-3 mb-1 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                style={{
                  borderColor: `${agent.color}40`,
                  background: `linear-gradient(135deg, ${agent.color}1f, ${agent.color}0a)`,
                }}
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${agent.color}33` }}
                >
                  <Play
                    className="size-3.5 fill-current"
                    style={{ color: agent.color }}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="max-w-[120px] truncate">
                      {currentActivity.objective.title}
                    </span>
                    <ChevronRight className="size-2.5 shrink-0" />
                  </p>
                  <p className="truncate text-xs font-semibold text-foreground">
                    {currentActivity.activity.name}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium"
                  style={{ background: `${agent.color}26`, color: agent.color }}
                >
                  En progreso
                </span>
              </button>
            )}

            {showTree && project && (
              <div className="pt-2">
                <div
                  className="mx-3 mb-2 overflow-hidden rounded-xl border"
                  style={{
                    borderColor: `${agent.color}26`,
                    background: `linear-gradient(135deg, ${agent.color}0d, ${agent.color}05)`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsTreeOpen((prev) => !prev)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${agent.color}26` }}
                    >
                      <FolderKanban
                        className="size-3.5"
                        style={{ color: agent.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          Objetivos del Proyecto
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {completedActivities}/{totalActivities}
                        </span>
                      </div>
                      <div className="mt-1 h-1 w-full rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPercent}%`,
                            background: agent.color,
                          }}
                        />
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-200 ${
                        isTreeOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isTreeOpen && (
                    <div
                      className="space-y-1 border-t px-3 pb-3"
                      style={{ borderColor: `${agent.color}1a` }}
                    >
                      {project.objectives.map((objective) => {
                        const activities = objective.activities ?? [];
                        const done = activities.filter(
                          (a) => a.isCompleted
                        ).length;
                        const expanded = isObjectiveExpanded(objective);

                        return (
                          <div key={objective.id} className="pt-1.5">
                            <button
                              type="button"
                              onClick={() => toggleObjective(objective.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                                expanded
                                  ? 'bg-white/[0.06]'
                                  : 'hover:bg-white/[0.04]'
                              }`}
                            >
                              <Target
                                className="size-3.5 shrink-0"
                                style={{ color: agent.color }}
                              />
                              <span className="flex-1 truncate text-left text-[11px] font-medium text-foreground/90">
                                {objective.title}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {done}/{activities.length}
                              </span>
                              <ChevronDown
                                className={`size-3 text-muted-foreground transition-transform duration-200 ${
                                  expanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {expanded && (
                              <div
                                className="ml-4 space-y-0.5 border-l py-1 pl-2.5"
                                style={{ borderColor: `${agent.color}26` }}
                              >
                                {activities.map((activity) => {
                                  const isActive =
                                    activity.id === activeActivityId;

                                  return (
                                    <button
                                      key={activity.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedActivityId(activity.id)
                                      }
                                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
                                      style={
                                        isActive && !activity.isCompleted
                                          ? {
                                              background: `${agent.color}1a`,
                                              boxShadow: `${agent.color}33 0px 0px 0px 1px inset`,
                                            }
                                          : undefined
                                      }
                                    >
                                      {activity.isCompleted ? (
                                        <CircleCheck className="size-3.5 text-green-400" />
                                      ) : (
                                        <Play
                                          className="size-3.5 fill-current"
                                          style={{ color: agent.color }}
                                        />
                                      )}
                                      <span
                                        className={`flex-1 truncate text-left text-[11px] ${
                                          activity.isCompleted
                                            ? 'text-muted-foreground line-through'
                                            : 'font-medium text-foreground'
                                        }`}
                                      >
                                        {activity.name}
                                      </span>
                                      {activity.isCompleted ? (
                                        <span className="text-[9px] text-green-400/70">
                                          Completada
                                        </span>
                                      ) : isActive ? (
                                        <span
                                          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                                          style={{
                                            background: `${agent.color}26`,
                                            color: agent.color,
                                          }}
                                        >
                                          Activa
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages / empty state */}
            {messages.length === 0 && !isSending ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div
                  className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${agent.color}33, ${agent.color}0d)`,
                  }}
                >
                  <AgentIcon
                    className="size-8"
                    style={{ color: agent.color }}
                  />
                </div>
                <h4 className="mb-2 font-semibold text-foreground">
                  ¡Hola! Qué gusto saludarte
                </h4>
                <p className="mb-5 max-w-[260px] text-sm text-muted-foreground">
                  ¿En qué te ayudo hoy? Dime qué prefieres y yo te ayudo.
                </p>
                <div className="flex w-full max-w-[280px] flex-col gap-2">
                  {WELCOME_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => void sendMessage(option)}
                      disabled={isSending}
                      className="rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-40"
                      style={{
                        borderColor: `${agent.color}33`,
                        color: agent.color,
                        backgroundColor: `${agent.color}14`,
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 p-4">
                {messages.map((message) => {
                  const messageAgent = AGENTS[message.agent];
                  const MessageIcon = messageAgent.icon;

                  const hasCode = messageHasCode(message.text);

                  return message.role === 'user' ? (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[80%] min-w-0 rounded-2xl rounded-br-sm bg-holo-surface2 px-4 py-2.5 text-foreground">
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
                          {message.text}
                        </p>
                        <span className="mt-1 block text-[10px] text-muted-foreground/60">
                          {message.time}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex justify-start">
                      <div
                        className={`holo-glass relative min-w-0 rounded-2xl rounded-bl-sm px-4 py-2.5 ${
                          hasCode ? 'w-full max-w-[96%]' : 'max-w-[80%]'
                        }`}
                        style={{ borderColor: `${messageAgent.color}26` }}
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <MessageIcon
                            className="size-3"
                            style={{ color: messageAgent.color }}
                          />
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: messageAgent.color }}
                          >
                            {messageAgent.name}
                          </span>
                        </div>
                        <AgentRevealedContent
                          text={message.text}
                          accent={messageAgent.color}
                          active={message.id === revealingId}
                          onRevealTick={handleRevealTick}
                        />
                        <span className="mt-1 block text-[10px] text-muted-foreground/60">
                          {message.time}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex justify-start">
                    <div
                      className="holo-glass rounded-2xl rounded-bl-sm px-4 py-3"
                      style={{ borderColor: `${agent.color}26` }}
                    >
                      <div className="mb-2 flex items-center gap-1.5">
                        <AgentIcon
                          className="size-3"
                          style={{ color: agent.color }}
                        />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: agent.color }}
                        >
                          {agent.name}
                        </span>
                      </div>
                      <div
                        className="agent-thinking"
                        style={
                          { '--agent-color': agent.color } as CSSProperties
                        }
                        aria-live="polite"
                      >
                        <span aria-hidden className="agent-thinking__spinner" />
                        <span className="agent-thinking__label text-xs font-medium">
                          {THINKING_STEPS[thinkingStep]}…
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrolled away from the latest turn: offer the way back, and say
              how many replies landed while they were reading above. */}
          {!isAtBottom && messages.length > 0 && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              aria-label={
                unreadCount > 0
                  ? `Ir al último mensaje (${unreadCount} sin leer)`
                  : 'Ir al último mensaje'
              }
              className="
                absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center
                gap-1.5 rounded-full py-1.5 pr-2.5 pl-2 text-xs font-semibold
                shadow-lg transition-transform
                hover:scale-105
                active:scale-95
              "
              style={{
                backgroundColor: agent.color,
                color: 'rgb(8, 12, 22)',
                boxShadow: `0 8px 20px -8px ${agent.color}`,
              }}
            >
              <ArrowDown className="size-3.5" />
              {unreadCount > 0 && (
                <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Upgrade notice: replaces the composer once the allowance is spent */}
        {quotaNotice ? (
          <div className="p-3">
            <div
              className="rounded-2xl border p-4 text-center"
              style={{
                borderColor: `${LAUNCHER_COLOR}40`,
                background: `linear-gradient(135deg, ${LAUNCHER_COLOR}1f, ${LAUNCHER_COLOR}08)`,
              }}
            >
              <div
                className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl"
                style={{ background: `${LAUNCHER_COLOR}26` }}
              >
                <Sparkles
                  className="size-5"
                  style={{ color: LAUNCHER_COLOR }}
                />
              </div>
              <h4 className="mb-1.5 text-sm font-semibold text-foreground">
                {quotaNotice.title}
              </h4>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                {quotaNotice.body}
              </p>
              {quotaNotice.primary && (
                <Link
                  href={quotaNotice.primary.href}
                  className="
                    flex w-full items-center justify-center rounded-xl px-4
                    py-2.5 text-sm font-semibold transition-transform
                    hover:scale-[1.02]
                  "
                  style={{
                    backgroundColor: LAUNCHER_COLOR,
                    color: 'rgb(8, 12, 22)',
                  }}
                >
                  {quotaNotice.primary.label}
                </Link>
              )}
              {quotaNotice.secondary && (
                <Link
                  href={quotaNotice.secondary.href}
                  className="
                    mt-2.5 block text-xs font-medium text-muted-foreground
                    underline-offset-4 hover:underline
                  "
                >
                  {quotaNotice.secondary.label}
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Composer */
          <div className="space-y-2.5 p-3">
            <div className="scrollbar-minimal flex gap-2 overflow-x-auto px-1 pb-1">
              {QUICK_ACTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void sendMessage(chip)}
                  disabled={isSending}
                  className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.03] disabled:opacity-40"
                  style={{
                    borderColor: `${agent.color}33`,
                    color: agent.color,
                    backgroundColor: `${agent.color}14`,
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(draft.trim());
                  }
                }}
                placeholder={
                  isSending
                    ? `${agent.name} está pensando...`
                    : 'Escribe tu mensaje...'
                }
                aria-label="Mensaje de chat"
                className="flex-1 rounded-xl border bg-holo-surface2/60 px-4 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none"
                style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
              />
              <button
                type="button"
                onClick={() => void sendMessage(draft.trim())}
                disabled={!draft.trim() || isSending}
                aria-label="Enviar mensaje"
                className="flex size-10 items-center justify-center rounded-xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor: agent.color,
                  color: 'rgb(8, 12, 22)',
                }}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Every side and corner is a grab edge, so the panel is resized by
          dragging it rather than by a toggle. In the pop-out window the same
          gesture resizes the window itself. Full-window mode and the
          full-screen sheet have nothing to resize. */}
      {!isFullWindow &&
        RESIZE_EDGES.map((edge) => (
          <div
            key={edge}
            role="separator"
            aria-label={RESIZE_HANDLES[edge].label}
            onPointerDown={handleResizeStart(edge)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            className={`
              absolute z-[80] touch-none ${RESIZE_HANDLES[edge].className}
              ${hasPanelRect || isPoppedOut ? 'block' : 'hidden md:block'}
            `}
          />
        ))}

      {/* Corner hint: the only visible sign that the panel can be resized. */}
      {!isFullWindow && (
        <span
          aria-hidden
          className={`
            pointer-events-none absolute right-1.5 bottom-1.5 z-[79] size-2.5
            rounded-tl-sm border-r-2 border-b-2 border-white/25
            ${hasPanelRect || isPoppedOut ? 'block' : 'hidden md:block'}
          `}
        />
      )}
    </div>
  );

  // Popped out: the chat renders inside the always-on-top window instead of
  // the page, so it stays visible while the user works in other apps.
  //
  // Otherwise it always portals to the main document's body — never
  // conditionally on `isExpanded` — so expanding and collapsing never
  // remounts the subtree and loses scroll position or focus. A route that
  // mounts this widget inside a transformed/glass ancestor would otherwise
  // trap it in a local stacking context, where no z-index value could ever
  // climb above the site header.
  return pipWindow
    ? createPortal(panel, pipWindow.document.body)
    : createPortal(panel, document.body);
}

export default AgentChatWidget;
