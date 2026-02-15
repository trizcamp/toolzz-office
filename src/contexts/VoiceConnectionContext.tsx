import React, { createContext, useContext, useReducer, type ReactNode } from "react";

export type RoomType = "voice" | "text" | "hybrid";

export interface MockUser {
  id: string;
  name: string;
  avatar: string;
  isSpeaking?: boolean;
}

export interface Room {
  id: string;
  name: string;
  category: string;
  type: RoomType;
  connectedUsers: MockUser[];
}

interface VoiceState {
  connectedRoom: Room | null;
  isMuted: boolean;
  isDeafened: boolean;
  currentUser: MockUser;
}

type VoiceAction =
  | { type: "CONNECT"; room: Room }
  | { type: "DISCONNECT" }
  | { type: "TOGGLE_MUTE" }
  | { type: "TOGGLE_DEAFEN" };

const currentUser: MockUser = {
  id: "me",
  name: "Você",
  avatar: "",
};

function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case "CONNECT":
      return { ...state, connectedRoom: action.room, isMuted: false, isDeafened: false };
    case "DISCONNECT":
      return { ...state, connectedRoom: null, isMuted: false, isDeafened: false };
    case "TOGGLE_MUTE":
      return { ...state, isMuted: !state.isMuted };
    case "TOGGLE_DEAFEN":
      return { ...state, isDeafened: !state.isDeafened, isMuted: !state.isDeafened ? true : state.isMuted };
    default:
      return state;
  }
}

const initialState: VoiceState = {
  connectedRoom: null,
  isMuted: false,
  isDeafened: false,
  currentUser,
};

interface VoiceContextValue extends VoiceState {
  connect: (room: Room) => void;
  disconnect: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
}

const VoiceConnectionContext = createContext<VoiceContextValue | null>(null);

export function VoiceConnectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(voiceReducer, initialState);

  const value: VoiceContextValue = {
    ...state,
    connect: (room) => dispatch({ type: "CONNECT", room }),
    disconnect: () => dispatch({ type: "DISCONNECT" }),
    toggleMute: () => dispatch({ type: "TOGGLE_MUTE" }),
    toggleDeafen: () => dispatch({ type: "TOGGLE_DEAFEN" }),
  };

  return (
    <VoiceConnectionContext.Provider value={value}>
      {children}
    </VoiceConnectionContext.Provider>
  );
}

export function useVoiceConnection() {
  const ctx = useContext(VoiceConnectionContext);
  if (!ctx) throw new Error("useVoiceConnection must be used within VoiceConnectionProvider");
  return ctx;
}

// ---- Mock data ----

const mockUsers: MockUser[] = [
  { id: "1", name: "Beatriz F.", avatar: "" },
  { id: "2", name: "João S.", avatar: "" },
  { id: "3", name: "Rafael M.", avatar: "", isSpeaking: true },
  { id: "4", name: "Amanda L.", avatar: "" },
  { id: "5", name: "Thiago M.", avatar: "" },
];

export const mockRooms: Room[] = [
  { id: "r1", name: "Lobby", category: "Geral", type: "hybrid", connectedUsers: [mockUsers[0], mockUsers[1], mockUsers[2]] },
  { id: "r2", name: "Avisos", category: "Geral", type: "text", connectedUsers: [] },
  { id: "r3", name: "Daily", category: "Produto", type: "voice", connectedUsers: [mockUsers[3], mockUsers[4]] },
  { id: "r4", name: "Sprint Review", category: "Produto", type: "hybrid", connectedUsers: [] },
  { id: "r5", name: "Backlog", category: "Produto", type: "text", connectedUsers: [] },
  { id: "r6", name: "Sessão 1:1", category: "Mentoria", type: "voice", connectedUsers: [mockUsers[0]] },
  { id: "r7", name: "Design", category: "Equipes", type: "hybrid", connectedUsers: [mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]] },
  { id: "r8", name: "Engenharia", category: "Equipes", type: "voice", connectedUsers: [mockUsers[0], mockUsers[1]] },
];

export const mockMessages = [
  { id: "m1", userId: "1", userName: "Beatriz F.", text: "Bom dia pessoal! Alguém viu o deploy de ontem?", time: "09:12" },
  { id: "m2", userId: "2", userName: "João S.", text: "Vi sim, passou tudo nos testes 🎉", time: "09:14" },
  { id: "m3", userId: "3", userName: "Rafael M.", text: "Ótimo! Vou revisar a PR do módulo de relatórios agora.", time: "09:15" },
  { id: "m4", userId: "4", userName: "Amanda L.", text: "Pessoal, a daily começa em 15 min. Entrem na sala de voz!", time: "09:30" },
  { id: "m5", userId: "5", userName: "Thiago M.", text: "Já estou lá 👍", time: "09:31" },
];
