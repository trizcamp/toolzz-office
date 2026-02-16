import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Users, MoreHorizontal, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMembers, useUserRoles } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user } = useAuth();
  const { members, currentMember, updateProfile } = useMembers();
  const { isAdmin, getRoleForUser, updateRole, deleteMember, inviteMember } = useUserRoles();

  const [activeTab, setActiveTab] = useState<"account" | "members">("account");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [searchMembers, setSearchMembers] = useState("");

  // Account fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("pt-BR");

  useEffect(() => {
    if (currentMember) {
      setFirstName(currentMember.name);
      setLastName(currentMember.surname);
      setPhone(currentMember.phone || "");
      setLanguage(currentMember.language || "pt-BR");
    }
  }, [currentMember]);

  const filteredMembers = members.filter(
    (m) => m.name.toLowerCase().includes(searchMembers.toLowerCase()) || m.email.toLowerCase().includes(searchMembers.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember.mutateAsync({
        email: inviteEmail,
        name: inviteName || inviteEmail.split("@")[0],
        role: inviteRole,
      });
      toast.success("Convite enviado com sucesso!");
      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("member");
    } catch (err: any) {
      toast.error(err.message || "Erro ao convidar membro");
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success("Membro removido");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover membro");
    }
  };

  const handleToggleRole = async (userId: string) => {
    const currentRole = getRoleForUser(userId);
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast.success(`Acesso alterado para ${newRole === "admin" ? "Administrador" : "Membro"}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar acesso");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        name: firstName,
        surname: lastName,
        phone,
        language,
      });
      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil");
    }
  };

  const tabs = [
    { id: "account" as const, label: "Minha conta", icon: User },
    { id: "members" as const, label: "Membros", icon: Users },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 h-[600px] flex">
        {/* Sidebar */}
        <div className="w-[200px] shrink-0 border-r border-border bg-sidebar p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 mb-3">Configurações</p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors",
                activeTab === tab.id ? "bg-accent/20 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "account" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Minha conta</h2>
                </div>
                <p className="text-sm text-muted-foreground">Altere as suas informações pessoais</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-semibold text-primary">
                  {firstName?.charAt(0)?.toUpperCase() || "U"}{lastName?.charAt(0)?.toUpperCase() || ""}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">Enviar imagem</Button>
                  <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">Remover imagem</Button>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nome</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sobrenome</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">E-mail</Label>
                <Input value={currentMember?.email || ""} readOnly className="opacity-60" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Celular</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button size="sm" className="btn-gradient" onClick={handleSaveProfile}>Salvar</Button>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Membros</h2>
                </div>
                <p className="text-sm text-muted-foreground">Gerencie membros e usuários e defina seu nível de acesso</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar membros..."
                    value={searchMembers}
                    onChange={(e) => setSearchMembers(e.target.value)}
                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                  />
                </div>
                {isAdmin && (
                  <Button size="sm" className="btn-gradient gap-1" onClick={() => setInviteOpen(true)}>
                    + Convidar
                  </Button>
                )}
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Membro</TableHead>
                      <TableHead className="text-xs">Acesso</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((m) => {
                      const role = getRoleForUser(m.id);
                      const isCurrentUser = m.id === user?.id;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {m.name} {m.surname ? `${m.surname}` : ""} {isCurrentUser && <span className="text-muted-foreground text-xs">(você)</span>}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{m.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {role === "admin" ? "ADMINISTRADOR" : "MEMBRO"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!isCurrentUser && isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleToggleRole(m.id)}>
                                    {role === "admin" ? "Tornar membro" : "Tornar administrador"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMember(m.id)}>
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Invite sub-dialog */}
              {inviteOpen && (
                <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
                  <h3 className="text-sm font-semibold text-foreground">Convidar membro</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">E-mail</Label>
                      <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Acesso</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                    <Button size="sm" className="btn-gradient" onClick={handleInvite} disabled={inviteMember.isPending}>
                      {inviteMember.isPending ? "Convidando..." : "Convidar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
