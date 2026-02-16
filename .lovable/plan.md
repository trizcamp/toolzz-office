
# Plano: Substituir botao de voz pelo embed do agente Toolzz

## Resumo

Substituir o botao "Via voz" e o botao central de microfone pelo iframe embed do agente de voz Toolzz, mantendo o botao "Via texto" para o chat existente. O embed de voz fica embutido diretamente no card de IA da Home, com redimensionamento automatico via postMessage.

## Alteracoes

### 1. `src/pages/Home.tsx`

- Remover o estado `isListening` e toda a logica do botao de microfone central
- Remover o botao "Via voz"
- Substituir a area central (botao de microfone + animacao) pelo iframe embed do agente Toolzz:
  ```
  src="https://admin.toolzz.ai/emb-voice/c9214171-8ceb-4f61-9dc1-8e3dffbb21c4"
  ```
- Adicionar um `useEffect` para escutar mensagens `window.postMessage` do tipo `VOICE_EMBED_SIZE` e ajustar dinamicamente as dimensoes do iframe
- Manter o botao "Via texto" funcionando normalmente abrindo o `ToolzzChatDialog`
- O iframe tera `allow="microphone"` e fundo transparente
- Manter a prop `boardId` sendo passada ao `ToolzzChatDialog`

### 2. Layout do card

O card de IA ficara com esta estrutura:

```text
+---------------------------+
|                           |
|   [iframe embed voice]    |
|   (redimensionavel)       |
|                           |
+---------------------------+
|  [Via texto]              |
+---------------------------+
```

- O iframe ocupa a area central do card onde antes ficava o botao de microfone
- Apenas o botao "Via texto" permanece abaixo
- O card mantem `lg:row-span-2` para manter a altura

## Detalhes tecnicos

- O iframe usa `id="chatbotVoiceIframe"` para o listener de redimensionamento
- O `useEffect` com `window.addEventListener('message', ...)` escuta eventos `VOICE_EMBED_SIZE` e atualiza width/height via ref do iframe
- Cleanup do listener no return do useEffect
- Nenhuma alteracao em edge functions ou banco de dados
- O comportamento de criacao de tarefas pelo chat de texto permanece inalterado

## Arquivos alterados

| Arquivo | Acao |
|---|---|
| `src/pages/Home.tsx` | Remover logica de microfone, adicionar iframe embed + listener de resize, manter apenas botao "Via texto" |
