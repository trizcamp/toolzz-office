import { useState, useRef, useEffect } from "react";
import { Plus, Send, Search, MessageSquare, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMembers } from "@/hooks/useMembers";
import { useConversations, useDirectMessages } from "@/hooks/useDirectMessages";
import { useAuth } from "@/hooks/useAuth";
import MemberProfileDialog from "@/components/MemberProfileDialog";

export default function MessagesPage() {
  const { user } = useAuth();
  const { members } = useMembers();
  const { conversations, createConversation } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [colleagueSearch, setColleagueSearch] = useState("");
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useDirectMessages(selectedConvId);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherUser = (conv: any) => {
    const otherId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
    return members.find((m) => m.id === otherId);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = getOtherUser(conv);
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMembers = members.filter((m) => {
    if (m.id === user?.id) return false;
    if (!colleagueSearch) return true;
    return (m.name + " " + m.surname).toLowerCase().includes(colleagueSearch.toLowerCase());
  });

  const handleStartConversation = async (memberId: string) => {
    const conv = await createConversation.mutateAsync(memberId);
    setSelectedConvId(conv.id);
    setNewConvOpen(false);
    setColleagueSearch("");
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !selectedConvId) return;
    setMessageInput("");
    await sendMessage.mutateAsync(text);
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherUser = selectedConv ? getOtherUser(selectedConv) : null;

  return (
    <div className="flex h-full">
      {/* Sidebar - Conversations List */}
      <div className="w-64 border-r border-border flex flex-col bg-sidebar shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Colleagues / New Conversation */}
        <div className="px-3 py-2">
          <button
            onClick={() => setNewConvOpen(true)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Colegas</span>
            <span className="ml-auto text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {members.filter((m) => m.id !== user?.id).length}
            </span>
          </button>
        </div>

        {/* Conversations */}
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mensagens diretas</span>
          <button onClick={() => setNewConvOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-2">
            {filteredConversations.map((conv) => {
              const other = getOtherUser(conv);
              if (!other) return null;
              const isActive = selectedConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={other.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{(other.name || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary/70 border-2 border-sidebar" />
                  </div>
                  <span className="truncate">{other.name} {other.surname?.charAt(0)}.</span>
                </button>
              );
            })}
            {filteredConversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conversa ainda</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConv && otherUser ? (
          <>
            {/* Header */}
            <div className="h-12 px-4 flex items-center gap-3 border-b border-border shrink-0">
              <button onClick={() => setProfileMemberId(otherUser.id)}>
                <Avatar className="w-7 h-7">
                  <AvatarImage src={otherUser.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{(otherUser.name || "?")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
              <button onClick={() => setProfileMemberId(otherUser.id)} className="text-sm font-medium text-foreground hover:underline">
                {otherUser.name} {otherUser.surname}
              </button>
              <div className="w-2 h-2 rounded-full bg-primary/70" />
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3 max-w-2xl mx-auto">
                {/* Welcome banner */}
                <div className="text-center py-8 space-y-2">
                  <Avatar className="w-16 h-16 mx-auto">
                    <AvatarImage src={otherUser.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">{(otherUser.name || "?")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold text-foreground">{otherUser.name} {otherUser.surname}</h3>
                  <p className="text-xs text-muted-foreground">Este é o início da sua conversa com <strong>{otherUser.name}</strong>.</p>
                </div>

                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  const sender = isMe ? null : otherUser;
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      {!isMe && (
                        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                          <AvatarImage src={sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">{(sender?.name || "?")[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          {msg.text}
                        </div>
                        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMe ? "text-right" : ""}`}>
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="flex gap-2 max-w-2xl mx-auto">
                <Input
                  placeholder={`Enviar mensagem para ${otherUser.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1 h-10"
                />
                <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm">Selecione uma conversa ou inicie uma nova</p>
            <Button variant="outline" size="sm" onClick={() => setNewConvOpen(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Nova conversa
            </Button>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar colega</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Buscar colega..."
            value={colleagueSearch}
            onChange={(e) => setColleagueSearch(e.target.value)}
            className="h-9"
          />
          <ScrollArea className="max-h-64">
            <div className="space-y-0.5">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleStartConversation(m.id)}
                  className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm hover:bg-surface-hover transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{(m.name || "?")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm text-foreground">{m.name} {m.surname}</p>
                    <p className="text-[10px] text-muted-foreground">{m.email}</p>
                  </div>
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum colega encontrado</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <MemberProfileDialog
        memberId={profileMemberId}
        open={!!profileMemberId}
        onOpenChange={(open) => !open && setProfileMemberId(null)}
      />
    </div>
  );
}
