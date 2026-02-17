
# Plano: Agente de voz IA funcional na Home

## Resumo

Reverter o card de IA da Home ao layout original (botao de microfone central, titulo "Conversar com IA", botoes "Via texto" e "Via voz") e implementar um agente de voz funcional usando Lovable AI. O agente de voz escuta o usuario via microfone do navegador, transcreve a fala, envia para a edge function `ai-chat` existente e responde por voz sintetizada. Quando o usuario descreve uma tarefa, o agente cria automaticamente no board.

## Layout do Card (como na imagem de referencia)

```text
+---------------------------+
|                            |
|      [ Mic Button ]        |
|   (circulo grande, clicavel)|
|                            |
|    Conversar com IA        |
|  Clique para falar ou digite|
|                            |
| [Via texto]   [Via voz]    |
+---------------------------+
```

## Fluxo do Agente de Voz

1. Usuario clica em "Via voz" -- abre um dialog de conversa por voz
2. O usuario clica no botao de microfone para falar
3. A fala e capturada via Web Speech API (SpeechRecognition nativo do navegador)
4. O texto transcrito e enviado para a edge function `ai-chat` (ja existente, com tool calling para criar tarefas)
5. A resposta da IA e exibida na tela e falada via Web Speech Synthesis (TTS nativo do navegador)
6. Se o usuario descrever uma tarefa, o `ai-chat` usa tool calling para criar no board automaticamente
7. Confirmacao visual e sonora da criacao da tarefa

## Alteracoes

### 1. `src/pages/Home.tsx`
- Remover o iframe embed do Toolzz e o listener de postMessage
- Restaurar o layout original com:
  - Botao de microfone circular grande no centro do card
  - Titulo "Conversar com IA" e subtitulo "Clique para falar ou digite"
  - Dois botoes: "Via texto" (abre ToolzzChatDialog) e "Via voz" (abre novo VoiceAgentDialog)
- Adicionar estado `voiceOpen` para controlar o dialog de voz

### 2. `src/components/VoiceAgentDialog.tsx` (novo)
- Dialog modal para conversa por voz com a IA
- Componentes:
  - Historico de mensagens (usuario e assistente) com suporte a Markdown
  - Botao de microfone central com animacao de "ouvindo" (pulse)
  - Indicador de status: "Ouvindo...", "Processando...", "Falando..."
- Funcionalidades:
  - **Captura de voz**: Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) com `lang: "pt-BR"`
  - **Envio para IA**: Chamada a `supabase.functions.invoke("ai-chat")` com o texto transcrito, passando `boardId`
  - **Resposta por voz**: Web Speech Synthesis (`speechSynthesis.speak()`) com voz em portugues
  - **Criacao de tarefas**: Funciona identicamente ao chat de texto -- a edge function `ai-chat` ja tem tool calling para `create_task`
  - Exibicao de confirmacao quando tarefa e criada (titulo + display_id)
  - Botao para parar de ouvir ou cancelar a fala da IA

### 3. `supabase/config.toml`
- Adicionar entry para `ai-chat` sem verificacao de JWT (ja e publico mas precisa estar no config)

### 4. Edge function `ai-chat` -- sem alteracoes
- A edge function existente ja suporta:
  - Receber mensagens e boardId
  - Tool calling para criar tarefas
  - Integracao com GitHub para bugs
  - Retorno de tarefas criadas

## Detalhes tecnicos

### Web Speech API (reconhecimento de voz)
```text
- SpeechRecognition nativo do navegador (Chrome, Edge, Safari)
- Configuracao: lang="pt-BR", continuous=false, interimResults=true
- Fallback: se nao suportado, exibir toast informando incompatibilidade
```

### Web Speech Synthesis (TTS)
```text
- speechSynthesis.speak() nativo
- Voz em pt-BR (seleciona automaticamente a melhor disponivel)
- Cancelavel quando usuario interrompe
```

### Fluxo de dados
```text
Microfone -> SpeechRecognition -> texto -> ai-chat edge function -> resposta + tarefas criadas -> SpeechSynthesis + UI
```

## Arquivos alterados

| Arquivo | Acao |
|---|---|
| `src/pages/Home.tsx` | Reverter layout do card, remover iframe, adicionar botao "Via voz" |
| `src/components/VoiceAgentDialog.tsx` | Novo -- dialog de conversa por voz com IA |
| `supabase/config.toml` | Adicionar config da funcao `ai-chat` |
