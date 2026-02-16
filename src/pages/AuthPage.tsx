import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import toolzzLogo from "@/assets/toolzz-logo.png";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
        setMode("login");
      }
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(email, password, name);
      setLoading(false);
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
        setMode("login");
      }
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <img src={toolzzLogo} alt="Toolzz" className="w-12 h-12 mx-auto rounded-xl" />
          <h1 className="text-xl font-semibold text-foreground">Toolzz Office</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" && "Entre na sua conta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "forgot" && "Recuperar senha"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label className="text-xs">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label className="text-xs">Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          <Button type="submit" className="w-full btn-gradient" disabled={loading}>
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>

        <div className="text-center space-y-2 text-sm">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground transition-colors">
                Esqueceu a senha?
              </button>
              <p className="text-muted-foreground">
                Não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="text-foreground hover:underline">
                  Criar conta
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-muted-foreground">
              Já tem conta?{" "}
              <button onClick={() => setMode("login")} className="text-foreground hover:underline">
                Entrar
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar ao login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
