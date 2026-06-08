/**
 * meetingStore.tsx  (v2 — Step 2 wired)
 *
 * Extends the Step 1 store with:
 *   - setJoining / setLive / setError states
 *   - appendTranscriptLine  (for real Vexa segments)
 *   - registerVexaHandlers  (hooks inject join/leave functions)
 *   - startMeeting / stopMeeting now call the real Vexa handlers
 *
 * Demo simulation is preserved behind a DEMO_MODE flag so we can
 * toggle it during development without Vexa running.
 */

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TranscriptLine {
  id:          string;
  speaker:     'You' | 'Them';
  text:        string;
  timestampMs: number;
}

export interface AiOutput {
  openWith:  string | null;
  betweenUs: string | null;
  say:       string | null;
}

export interface StrategicTag {
  label: string;
  type:  'buyer' | 'risk' | 'opportunity' | 'neutral';
}

export interface ProspectData {
  name: string;
  domain: string;
  objective?: string;
}

export type CallPhase = 'cold' | 'discovery' | 'pitch' | 'objection';

export interface StrategicBrief {
  prospectProfile:  string | null;
  signalAssessment: string | null;
  approach:         string | null;
  webIntel:         string[] | null;
  tags:             StrategicTag[];
}

export type TacticalAction = 'transition' | 'discovery' | 'takeover' | 'slowdown';

// ─── State ───────────────────────────────────────────────────────────────────

interface MeetingState {
  isLive:         boolean;
  isJoining:      boolean;
  meetingUrl:     string;
  transcript:     TranscriptLine[];
  aiOutput:       AiOutput;
  strategicBrief: StrategicBrief | null;
  isStreaming:    boolean;
  isThinking:     boolean;
  error:          string | null;
  prospectData:   ProspectData | null;
  currentPhase:   CallPhase;
}

const INITIAL_STATE: MeetingState = {
  isLive:         false,
  isJoining:      false,
  meetingUrl:     '',
  transcript:     [],
  aiOutput:       { openWith: null, betweenUs: null, say: null },
  strategicBrief: null,
  isStreaming:    false,
  isThinking:     false,
  error:          null,
  prospectData:   null,
  currentPhase:   'cold',
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_MEETING_URL';     url:       string }
  | { type: 'SET_LIVE';            live:      boolean }
  | { type: 'SET_JOINING';         joining:   boolean }
  | { type: 'SET_ERROR';           error:     string | null }
  | { type: 'APPEND_TRANSCRIPT';   line:      TranscriptLine }
  | { type: 'SET_AI_OUTPUT';       output:    Partial<AiOutput> }
  | { type: 'CLEAR_SAY' }
  | { type: 'SET_STRATEGIC_BRIEF'; brief:     Partial<StrategicBrief> }
  | { type: 'SET_STREAMING';       streaming: boolean }
  | { type: 'SET_THINKING';        thinking:  boolean }
  | { type: 'SET_PROSPECT_DATA';   data:      ProspectData | null }
  | { type: 'SET_CALL_PHASE';      phase:     CallPhase }
  | { type: 'RESET' };

function reducer(state: MeetingState, action: Action): MeetingState {
  switch (action.type) {
    case 'SET_MEETING_URL':
      return { ...state, meetingUrl: action.url, error: null };
    case 'SET_LIVE':
      return { ...state, isLive: action.live, isJoining: false };
    case 'SET_JOINING':
      return { ...state, isJoining: action.joining, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.error, isJoining: false };
    case 'APPEND_TRANSCRIPT':
      return { ...state, transcript: [...state.transcript, action.line] };
    case 'SET_AI_OUTPUT':
      return { ...state, aiOutput: { ...state.aiOutput, ...action.output } };
    case 'CLEAR_SAY':
      return { ...state, aiOutput: { ...state.aiOutput, say: null }, isStreaming: true };
    case 'SET_STRATEGIC_BRIEF':
      return {
        ...state,
        strategicBrief: {
          ...(state.strategicBrief ?? {
            prospectProfile: null, signalAssessment: null,
            approach: null, webIntel: null, tags: [],
          }),
          ...action.brief,
        },
      };
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.streaming };
    case 'SET_THINKING':
      return { ...state, isThinking: action.thinking };
    case 'SET_PROSPECT_DATA':
      return { ...state, prospectData: action.data };
    case 'SET_CALL_PHASE':
      return { ...state, currentPhase: action.phase };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface VexaHandlers {
  joinAndStream:  () => Promise<void>;
  leaveAndStop:   () => Promise<void>;
}

interface MeetingStore extends MeetingState {
  // Actions
  setMeetingUrl:         (url: string) => void;
  setLive:               (live: boolean) => void;
  setJoining:            (joining: boolean) => void;
  setError:              (err: string | null) => void;
  appendTranscriptLine:  (line: TranscriptLine) => void;
  setAiOutput:           (output: Partial<AiOutput>) => void;
  setStrategicBrief:     (brief: Partial<StrategicBrief>) => void;
  setStreaming:          (streaming: boolean) => void;
  setThinking:           (thinking: boolean) => void;
  setProspectData:       (data: ProspectData | null) => void;
  setCallPhase:          (phase: CallPhase) => void;
  startMeeting:          () => void;
  stopMeeting:           () => void;
  fireOverride:          (action: TacticalAction) => Promise<void>;
  registerVexaHandlers:  (handlers: VexaHandlers) => void;
}

const MeetingContext = createContext<MeetingStore | null>(null);

// ─── Demo data (active when NEXT_PUBLIC_DEMO_MODE=true) ───────────────────────

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const DEMO_TRANSCRIPT: Omit<TranscriptLine, 'id' | 'timestampMs'>[] = [
  { speaker: 'Them', text: "Hey, thanks for making time. So we're a 40-person shop, mostly remediation work…" },
  { speaker: 'You',  text: "Yeah, of course. Tell me — is remediation the core, or is that just where you started?" },
  { speaker: 'Them', text: "It started there, but honestly we want to pivot more into advisory. The margins are better." },
  { speaker: 'You',  text: "That makes sense. Most groups like yours aren't purely remediation shops — the advisory angle is where the leverage is." },
  { speaker: 'Them', text: "Exactly. We've had a few advisory engagements but they were one-offs. Nothing systematic." },
];

const DEMO_AI: AiOutput = {
  openWith:  "Appreciate you being direct about where you're headed. Before we dive in — what does a win look like for you in the next 6 months?",
  betweenUs: "She's not a distressed buyer. She's a specialist provider building leverage. Don't sell — position.",
  say:       "Yeah, that makes sense. Most groups like yours aren't purely remediation shops — the ones that figure out the advisory motion early end up owning the relationship long-term. Is it a capacity problem or a positioning problem that's slowing the shift?",
};

const DEMO_BRIEF: StrategicBrief = {
  prospectProfile:  "40-person cybersecurity firm, currently remediation-heavy. Actively seeking a pivot toward advisory/consulting to improve margins. Likely in growth phase with recurring revenue below $10M ARR. Decision-maker is operationally sharp, values directness.",
  signalAssessment: "She is not in distress — she is in transition. The advisory ambition signals strategic intent, not desperation. This is a leverage conversation, not a pain-point sale.",
  approach:         "Position yourself as the enabler of her advisory pivot, not as another vendor. Avoid feature-talking. Ask about the one engagement that almost became systematic — that's the unlock.",
  webIntel: [
    "Company posted 2 advisory-focused job listings in Q1 2026 — signal of strategic hiring.",
    "CEO spoke at SecureWorld Houston in March: emphasized 'shifting from firefighting to architecture'.",
    "No recent funding rounds — self-funded growth, so ROI sensitivity will be high.",
  ],
  tags: [
    { label: 'Strategic Buyer',  type: 'buyer' },
    { label: 'Advisory Pivot',   type: 'opportunity' },
    { label: 'ROI Sensitive',    type: 'risk' },
    { label: 'Self-funded',      type: 'neutral' },
  ],
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Vexa handlers are injected by the useVexaTranscript hook after mount
  const vexaHandlers = useRef<VexaHandlers | null>(null);
  const simTimers    = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearSimTimers = useCallback(() => {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
  }, []);

  // ── Primitive actions ─────────────────────────────────────────────────────

  const setMeetingUrl = useCallback((url: string) => {
    dispatch({ type: 'SET_MEETING_URL', url });
  }, []);

  const setLive = useCallback((live: boolean) => {
    dispatch({ type: 'SET_LIVE', live });
  }, []);

  const setJoining = useCallback((joining: boolean) => {
    dispatch({ type: 'SET_JOINING', joining });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const appendTranscriptLine = useCallback((line: TranscriptLine) => {
    dispatch({ type: 'APPEND_TRANSCRIPT', line });
  }, []);

  const setStreaming = useCallback((streaming: boolean) => {
    dispatch({ type: 'SET_STREAMING', streaming });
  }, []);

  const setThinking = useCallback((thinking: boolean) => {
    dispatch({ type: 'SET_THINKING', thinking });
  }, []);

  const setProspectData = useCallback((data: ProspectData | null) => {
    dispatch({ type: 'SET_PROSPECT_DATA', data });
  }, []);

  const setAiOutput = useCallback((output: Partial<AiOutput>) => {
    dispatch({ type: 'SET_AI_OUTPUT', output });
  }, []);

  const setStrategicBrief = useCallback((brief: Partial<StrategicBrief>) => {
    dispatch({ type: 'SET_STRATEGIC_BRIEF', brief });
  }, []);

  const setCallPhase = useCallback((phase: CallPhase) => {
    dispatch({ type: 'SET_CALL_PHASE', phase });
  }, []);

  const registerVexaHandlers = useCallback((handlers: VexaHandlers) => {
    vexaHandlers.current = handlers;
  }, []);

  // ── startMeeting ──────────────────────────────────────────────────────────

  const startMeeting = useCallback(() => {
    if (IS_DEMO) {
      // ── Demo mode — simulate bots ──
      dispatch({ type: 'SET_JOINING', joining: true });

      // Simulate "joining" delay then go live
      const t0 = setTimeout(() => {
        dispatch({ type: 'SET_LIVE',     live:    true });
        dispatch({ type: 'SET_THINKING', thinking: true });
        dispatch({ type: 'SET_STREAMING', streaming: true });

        DEMO_TRANSCRIPT.forEach((line, i) => {
          const t = setTimeout(() => {
            dispatch({
              type: 'APPEND_TRANSCRIPT',
              line: { ...line, id: `demo-${i}`, timestampMs: Date.now() },
            });
          }, 800 + i * 1400);
          simTimers.current.push(t);
        });

        // Inject AI output after transcript starts flowing
        const t1 = setTimeout(() => {
          dispatch({ type: 'SET_AI_OUTPUT', output: DEMO_AI });
          dispatch({ type: 'SET_STREAMING', streaming: false });
        }, 3500);

        // Inject strategic brief after a "research" delay
        const t2 = setTimeout(() => {
          dispatch({ type: 'SET_STRATEGIC_BRIEF', brief: DEMO_BRIEF });
          dispatch({ type: 'SET_THINKING', thinking: false });
        }, 5500);

        simTimers.current.push(t1, t2);
      }, 1200);

      simTimers.current.push(t0);
    } else {
      // ── Real mode — delegate to useVexaTranscript hook ──
      if (!vexaHandlers.current) {
        console.error('[MeetingStore] Vexa handlers not registered yet.');
        return;
      }
      void vexaHandlers.current.joinAndStream();
    }
  }, []);

  // ── stopMeeting ───────────────────────────────────────────────────────────

  const stopMeeting = useCallback(() => {
    clearSimTimers();
    if (!IS_DEMO && vexaHandlers.current) {
      void vexaHandlers.current.leaveAndStop();
    }
    dispatch({ type: 'RESET' });
  }, [clearSimTimers]);

  // ── fireOverride ──────────────────────────────────────────────────────────

  const fireOverride = useCallback(async (action: TacticalAction) => {
    dispatch({ type: 'CLEAR_SAY' });
    dispatch({ type: 'SET_STREAMING', streaming: true });

    // Get last 30 seconds of transcript for context
    const cutoff = Date.now() - 30_000;
    const recentLines = state.transcript
      .filter((l) => l.timestampMs >= cutoff)
      .map((l) => `${l.speaker}: ${l.text}`)
      .join('\n');

    try {
      const res = await fetch('/api/ai/override', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ 
          action, 
          recentTranscript: recentLines,
          prospectData: state.prospectData 
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
        dispatch({ type: 'SET_AI_OUTPUT', output: { say: streamedText } });
      }

      dispatch({ type: 'SET_STREAMING', streaming: false });
    } catch {
      // Fallback to inline
      const FALLBACKS: Record<TacticalAction, string> = {
        transition: "Here's what I'm hearing — you've got the expertise, you just haven't systematized the hand-off yet. What if we mapped that motion together today?",
        discovery:  "Two questions: One — what was the last engagement where you thought 'this should've been advisory but wasn't'? Two — what would have to be true for your team to close an advisory deal without you in the room?",
        takeover:   "I want to hear more from you on this. What does the ideal version of your practice look like 18 months from now?",
        slowdown:   "Actually — let me pause on that for a second, because I think there's something important here worth unpacking before we move on.",
      };
      dispatch({ type: 'SET_AI_OUTPUT',  output: { say: FALLBACKS[action] } });
      dispatch({ type: 'SET_STREAMING',  streaming: false });
    }
  }, [state.transcript]);

  return (
    <MeetingContext.Provider
      value={{
        ...state,
        setMeetingUrl,
        setLive,
        setJoining,
        setError,
        appendTranscriptLine,
        setAiOutput,
        setStrategicBrief,
        setStreaming,
        setThinking,
        setProspectData,
        setCallPhase,
        startMeeting,
        stopMeeting,
        fireOverride,
        registerVexaHandlers,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMeetingStore(): MeetingStore {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeetingStore must be used within <MeetingProvider>');
  return ctx;
}
