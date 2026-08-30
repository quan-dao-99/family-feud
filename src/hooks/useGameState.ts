import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Question, FastMoneyQuestion, FastMoneyState, SyncAction } from '../types/game';

import { DEFAULT_QUESTIONS, DEFAULT_FAST_MONEY_QUESTIONS } from '../data/defaultQuestions';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'chungsuc_state_v1';
const QUESTIONS_STORAGE_KEY = 'chungsuc_questions_v1';
const FM_QUESTIONS_STORAGE_KEY = 'chungsuc_fm_questions_v1';
const BROADCAST_CHANNEL_NAME = 'chungsuc_sync_channel';

export const createInitialFastMoney = (questions: FastMoneyQuestion[]): FastMoneyState => ({
  player1: {
    name: 'Người chơi 1',
    entries: questions.slice(0, 5).map(() => ({
      answer: '',
      points: 0,
      revealedAnswer: false,
      revealedPoints: false,
    })),
    timer: 20,
    timerActive: false,
    totalPoints: 0,
  },
  player2: {
    name: 'Người chơi 2',
    entries: questions.slice(0, 5).map(() => ({
      answer: '',
      points: 0,
      revealedAnswer: false,
      revealedPoints: false,
    })),
    timer: 25,
    timerActive: false,
    totalPoints: 0,
  },
  activePlayer: 1,
  questions: questions.slice(0, 5),
  isCompleted: false,
  wonGrandPrize: false,
});

export function useGameState() {
  // Load questions from local storage or defaults
  const loadSavedQuestions = (): { questions: Question[]; fmQuestions: FastMoneyQuestion[] } => {
    try {
      const q = localStorage.getItem(QUESTIONS_STORAGE_KEY);
      const fm = localStorage.getItem(FM_QUESTIONS_STORAGE_KEY);
      return {
        questions: q ? JSON.parse(q) : DEFAULT_QUESTIONS,
        fmQuestions: fm ? JSON.parse(fm) : DEFAULT_FAST_MONEY_QUESTIONS,
      };
    } catch {
      return { questions: DEFAULT_QUESTIONS, fmQuestions: DEFAULT_FAST_MONEY_QUESTIONS };
    }
  };

  const initialData = loadSavedQuestions();

  const getInitialState = (): GameState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure questions are valid
        if (parsed.questions && parsed.questions.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }

    const firstQuestion = initialData.questions[0];
    return {
      teams: {
        teamA: { id: 'teamA', name: 'ĐỘI ĐỎ', score: 0, color: '#ef4444' },
        teamB: { id: 'teamB', name: 'ĐỘI XANH', score: 0, color: '#3b82f6' },
      },
      currentRoundIndex: 0,
      questions: initialData.questions,
      activeQuestionId: firstQuestion ? firstQuestion.id : '',
      revealedAnswers: [],
      strikes: 0,
      strikeOverlay: { visible: false, count: 0 },
      roundBank: 0,
      controllingTeam: null,
      fastMoney: createInitialFastMoney(initialData.fmQuestions),
      soundEnabled: true,
      buzzerWinner: null,
      buzzerLocked: false,
    };
  };

  const [state, setState] = useState<GameState>(getInitialState);
  const stateRef = useRef<GameState>(state);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Keep stateRef synchronized
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Broadcast state changes or actions across tabs (BroadcastChannel) and across LAN devices (WebSocket)
  const broadcastAction = useCallback((action: SyncAction) => {
    // 1. Cross-tab on same device
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(action);
      } catch {}
    }
    // 2. Cross-device over LAN (WebSocket)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(action));
      } catch (e) {
        console.error('[GameSync WS] Send error:', e);
      }
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  // Sync sounds state with soundManager
  useEffect(() => {
    soundManager.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  // Unified action dispatcher for incoming sync messages
  const handleSyncAction = useCallback((action: SyncAction) => {
    if (!action) return;

    switch (action.type) {
      case 'SYNC_STATE':
        setState(action.state);
        break;
      case 'REVEAL_ANSWER':
        setState((prev) => {
          if (prev.revealedAnswers.includes(action.answerId)) return prev;
          const currentQ = prev.questions[prev.currentRoundIndex];
          const ans = currentQ?.answers.find((a) => a.id === action.answerId);
          const pts = ans ? ans.points * (currentQ?.multiplier || 1) : 0;
          soundManager.playDing();
          return {
            ...prev,
            revealedAnswers: [...prev.revealedAnswers, action.answerId],
            roundBank: prev.roundBank + pts,
          };
        });
        break;
      case 'HIDE_ANSWER':
        setState((prev) => {
          const currentQ = prev.questions[prev.currentRoundIndex];
          const ans = currentQ?.answers.find((a) => a.id === action.answerId);
          const pts = ans ? ans.points * (currentQ?.multiplier || 1) : 0;
          return {
            ...prev,
            revealedAnswers: prev.revealedAnswers.filter((id) => id !== action.answerId),
            roundBank: Math.max(0, prev.roundBank - pts),
          };
        });
        break;
      case 'REVEAL_ALL':
        setState((prev) => {
          const currentQ = prev.questions[prev.currentRoundIndex];
          if (!currentQ) return prev;
          soundManager.playDing();
          const allIds = currentQ.answers.map((a) => a.id);
          const totalPts = currentQ.answers.reduce(
            (sum, a) => sum + a.points * currentQ.multiplier,
            0
          );
          return {
            ...prev,
            revealedAnswers: allIds,
            roundBank: totalPts,
          };
        });
        break;
      case 'HIDE_ALL':
        setState((prev) => ({
          ...prev,
          revealedAnswers: [],
          roundBank: 0,
        }));
        break;
      case 'ADD_STRIKE':
        soundManager.playStrike();
        setState((prev) => ({
          ...prev,
          strikes: Math.min(3, prev.strikes + (action.count || 1)),
          strikeOverlay: { visible: true, count: action.count || 1 },
        }));
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            strikeOverlay: { ...prev.strikeOverlay, visible: false },
          }));
        }, 1400);
        break;
      case 'CLEAR_STRIKES':
        setState((prev) => ({
          ...prev,
          strikes: 0,
          strikeOverlay: { visible: false, count: 0 },
        }));
        break;
      case 'AWARD_BANK':
        soundManager.playFanfare();
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore
        }
        setState((prev) => ({
          ...prev,
          teams: {
            ...prev.teams,
            [action.team]: {
              ...prev.teams[action.team],
              score: prev.teams[action.team].score + prev.roundBank,
            },
          },
          roundBank: 0,
          strikes: 0,
          controllingTeam: null,
        }));
        break;
      case 'SET_ROUND':
        setState((prev) => {
          const newIndex = action.roundIndex;
          const newQ = prev.questions[newIndex];
          return {
            ...prev,
            currentRoundIndex: newIndex,
            activeQuestionId: newQ ? newQ.id : '',
            revealedAnswers: [],
            strikes: 0,
            strikeOverlay: { visible: false, count: 0 },
            roundBank: 0,
            controllingTeam: null,
          };
        });
        break;
      case 'UPDATE_TEAM_NAME':
        setState((prev) => ({
          ...prev,
          teams: {
            ...prev.teams,
            [action.team]: {
              ...prev.teams[action.team],
              name: action.name,
            },
          },
        }));
        break;
      case 'UPDATE_TEAM_SCORE':
        setState((prev) => ({
          ...prev,
          teams: {
            ...prev.teams,
            [action.team]: {
              ...prev.teams[action.team],
              score: action.score,
            },
          },
        }));
        break;
      case 'SET_CONTROLLING_TEAM':
        setState((prev) => ({
          ...prev,
          controllingTeam: action.team,
        }));
        break;
      case 'TRIGGER_BUZZER':
        soundManager.playBuzzer();
        setState((prev) => ({
          ...prev,
          buzzerWinner: action.team,
          buzzerLocked: true,
        }));
        break;
      case 'RESET_BUZZER':
        setState((prev) => ({
          ...prev,
          buzzerWinner: null,
          buzzerLocked: false,
        }));
        break;
      case 'UPDATE_FAST_MONEY':
        setState((prev) => ({
          ...prev,
          fastMoney: action.fastMoney,
        }));
        break;
      case 'UPDATE_QUESTIONS':
        setState((prev) => {
          const nextQuestions = action.questions;
          const firstQ = nextQuestions[0];
          return {
            ...prev,
            questions: nextQuestions,
            activeQuestionId: firstQ ? firstQ.id : '',
            currentRoundIndex: 0,
            revealedAnswers: [],
            strikes: 0,
            roundBank: 0,
            fastMoney: action.fastMoneyQuestions
              ? createInitialFastMoney(action.fastMoneyQuestions)
              : prev.fastMoney,
          };
        });
        break;
      case 'RESET_GAME':
        setState((prev) => {
          const firstQ = prev.questions[0];
          return {
            ...prev,
            teams: {
              teamA: { ...prev.teams.teamA, score: 0 },
              teamB: { ...prev.teams.teamB, score: 0 },
            },
            currentRoundIndex: 0,
            activeQuestionId: firstQ ? firstQ.id : '',
            revealedAnswers: [],
            strikes: 0,
            strikeOverlay: { visible: false, count: 0 },
            roundBank: 0,
            controllingTeam: null,
            buzzerWinner: null,
            buzzerLocked: false,
            fastMoney: createInitialFastMoney(prev.fastMoney.questions),
          };
        });
        break;
    }
  }, []);

  // Set up Broadcast Channel for same-device cross-tab communication
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent<SyncAction>) => {
          handleSyncAction(event.data);
        };
      }
    } catch {}

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [handleSyncAction]);

  // Set up WebSocket for real-time Cross-Device LAN synchronization (Phone <-> TV)
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: number | undefined;

    const connectWs = () => {
      if (typeof window === 'undefined') return;
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws-sync`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[GameSync] Connected to LAN Game Server');
          if (stateRef.current) {
            ws.send(JSON.stringify({ type: 'SYNC_STATE', state: stateRef.current }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const action = JSON.parse(event.data);
            handleSyncAction(action);
          } catch (err) {
            console.error('[GameSync] Error parsing message:', err);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimeout = window.setTimeout(connectWs, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (isMounted) {
          reconnectTimeout = window.setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [handleSyncAction]);

  // Action methods
  const revealAnswer = useCallback((answerId: string) => {
    setState((prev) => {
      if (prev.revealedAnswers.includes(answerId)) return prev;
      const currentQ = prev.questions[prev.currentRoundIndex];
      const ans = currentQ?.answers.find((a) => a.id === answerId);
      const pts = ans ? ans.points * (currentQ?.multiplier || 1) : 0;
      soundManager.playDing();
      return {
        ...prev,
        revealedAnswers: [...prev.revealedAnswers, answerId],
        roundBank: prev.roundBank + pts,
      };
    });
    broadcastAction({ type: 'REVEAL_ANSWER', answerId });
  }, [broadcastAction]);

  const hideAnswer = useCallback((answerId: string) => {
    setState((prev) => {
      const currentQ = prev.questions[prev.currentRoundIndex];
      const ans = currentQ?.answers.find((a) => a.id === answerId);
      const pts = ans ? ans.points * (currentQ?.multiplier || 1) : 0;
      return {
        ...prev,
        revealedAnswers: prev.revealedAnswers.filter((id) => id !== answerId),
        roundBank: Math.max(0, prev.roundBank - pts),
      };
    });
    broadcastAction({ type: 'HIDE_ANSWER', answerId });
  }, [broadcastAction]);

  const revealAll = useCallback(() => {
    setState((prev) => {
      const currentQ = prev.questions[prev.currentRoundIndex];
      if (!currentQ) return prev;
      soundManager.playDing();
      const allIds = currentQ.answers.map((a) => a.id);
      const totalPts = currentQ.answers.reduce(
        (sum, a) => sum + a.points * currentQ.multiplier,
        0
      );
      return {
        ...prev,
        revealedAnswers: allIds,
        roundBank: totalPts,
      };
    });
    broadcastAction({ type: 'REVEAL_ALL' });
  }, [broadcastAction]);

  const hideAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      revealedAnswers: [],
      roundBank: 0,
    }));
    broadcastAction({ type: 'HIDE_ALL' });
  }, [broadcastAction]);

  const addStrike = useCallback((count: number = 1) => {
    soundManager.playStrike();
    setState((prev) => ({
      ...prev,
      strikes: Math.min(3, prev.strikes + count),
      strikeOverlay: { visible: true, count },
    }));
    broadcastAction({ type: 'ADD_STRIKE', count });
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        strikeOverlay: { ...prev.strikeOverlay, visible: false },
      }));
    }, 1400);
  }, [broadcastAction]);

  const clearStrikes = useCallback(() => {
    setState((prev) => ({
      ...prev,
      strikes: 0,
      strikeOverlay: { visible: false, count: 0 },
    }));
    broadcastAction({ type: 'CLEAR_STRIKES' });
  }, [broadcastAction]);

  const awardBank = useCallback((team: 'teamA' | 'teamB') => {
    soundManager.playFanfare();
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
    setState((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [team]: {
          ...prev.teams[team],
          score: prev.teams[team].score + prev.roundBank,
        },
      },
      roundBank: 0,
      strikes: 0,
      controllingTeam: null,
    }));
    broadcastAction({ type: 'AWARD_BANK', team });
  }, [broadcastAction]);

  const setRound = useCallback((roundIndex: number) => {
    setState((prev) => {
      const newQ = prev.questions[roundIndex];
      return {
        ...prev,
        currentRoundIndex: roundIndex,
        activeQuestionId: newQ ? newQ.id : '',
        revealedAnswers: [],
        strikes: 0,
        strikeOverlay: { visible: false, count: 0 },
        roundBank: 0,
        controllingTeam: null,
      };
    });
    broadcastAction({ type: 'SET_ROUND', roundIndex });
  }, [broadcastAction]);

  const updateTeamName = useCallback((team: 'teamA' | 'teamB', name: string) => {
    setState((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [team]: { ...prev.teams[team], name },
      },
    }));
    broadcastAction({ type: 'UPDATE_TEAM_NAME', team, name });
  }, [broadcastAction]);

  const updateTeamScore = useCallback((team: 'teamA' | 'teamB', score: number) => {
    setState((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [team]: { ...prev.teams[team], score },
      },
    }));
    broadcastAction({ type: 'UPDATE_TEAM_SCORE', team, score });
  }, [broadcastAction]);

  const setControllingTeam = useCallback((team: 'teamA' | 'teamB' | null) => {
    setState((prev) => ({
      ...prev,
      controllingTeam: team,
    }));
    broadcastAction({ type: 'SET_CONTROLLING_TEAM', team });
  }, [broadcastAction]);

  const triggerBuzzer = useCallback((team: 'teamA' | 'teamB') => {
    soundManager.playBuzzer();
    setState((prev) => ({
      ...prev,
      buzzerWinner: team,
      buzzerLocked: true,
    }));
    broadcastAction({ type: 'TRIGGER_BUZZER', team });
  }, [broadcastAction]);

  const resetBuzzer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      buzzerWinner: null,
      buzzerLocked: false,
    }));
    broadcastAction({ type: 'RESET_BUZZER' });
  }, [broadcastAction]);

  const updateFastMoney = useCallback((fastMoney: FastMoneyState) => {
    setState((prev) => ({
      ...prev,
      fastMoney,
    }));
    broadcastAction({ type: 'UPDATE_FAST_MONEY', fastMoney });
  }, [broadcastAction]);

  const updateQuestions = useCallback(
    (questions: Question[], fastMoneyQuestions?: FastMoneyQuestion[]) => {
      try {
        localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
        if (fastMoneyQuestions) {
          localStorage.setItem(FM_QUESTIONS_STORAGE_KEY, JSON.stringify(fastMoneyQuestions));
        }
      } catch {
        // Ignore
      }

      setState((prev) => {
        const firstQ = questions[0];
        return {
          ...prev,
          questions,
          activeQuestionId: firstQ ? firstQ.id : '',
          currentRoundIndex: 0,
          revealedAnswers: [],
          strikes: 0,
          roundBank: 0,
          fastMoney: fastMoneyQuestions
            ? createInitialFastMoney(fastMoneyQuestions)
            : prev.fastMoney,
        };
      });
      broadcastAction({ type: 'UPDATE_QUESTIONS', questions, fastMoneyQuestions });
    },
    [broadcastAction]
  );

  const resetGame = useCallback(() => {
    setState((prev) => {
      const firstQ = prev.questions[0];
      return {
        ...prev,
        teams: {
          teamA: { ...prev.teams.teamA, score: 0 },
          teamB: { ...prev.teams.teamB, score: 0 },
        },
        currentRoundIndex: 0,
        activeQuestionId: firstQ ? firstQ.id : '',
        revealedAnswers: [],
        strikes: 0,
        strikeOverlay: { visible: false, count: 0 },
        roundBank: 0,
        controllingTeam: null,
        buzzerWinner: null,
        buzzerLocked: false,
        fastMoney: createInitialFastMoney(prev.fastMoney.questions),
      };
    });
    broadcastAction({ type: 'RESET_GAME' });
  }, [broadcastAction]);

  const toggleSound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }, []);

  return {
    state,
    revealAnswer,
    hideAnswer,
    revealAll,
    hideAll,
    addStrike,
    clearStrikes,
    awardBank,
    setRound,
    updateTeamName,
    updateTeamScore,
    setControllingTeam,
    triggerBuzzer,
    resetBuzzer,
    updateFastMoney,
    updateQuestions,
    resetGame,
    toggleSound,
  };
}
