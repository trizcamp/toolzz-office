
# Plano: Integrar Chatbot Toolzz com Criacao de Tarefas

## Resumo

Quando o usuario pedir para criar uma tarefa no chat "Via texto", o sistema vai:
1. Enviar a mensagem para o agente Toolzz (API externa) e receber a resposta estruturada (User Story, Criterios de Aceite, Dados da Tarefa)
2. Internamente, enviar essa resposta para a edge function `ai-chat` que usa a IA do Lovable para extrair os dados estruturados (titulo, descricao, prioridade, tipo) e criar a tarefa no banco
3. A edge function `task-created` ja existente gera automaticamente o documento de backlog
4. Na tela, exibir apenas uma mensagem confirmando a criacao da tarefa (sem mostrar o conteudo bruto do agente Toolzz)

## Fluxo

```text
Usuario digita mensagem
        |
        v
API Toolzz (kratos) retorna resposta estruturada
        |
        v
[Internamente] Detecta se a resposta contem dados de tarefa
        |
        v
Chama edge function "ai-chat" passando o conteudo do Toolzz
como contexto para extrair dados e criar a tarefa + documento
        |
        v
Exibe na tela: "Tarefa criada com sucesso! [titulo] - [display_id]"
```

## Detalhes Tecnicos

### 1. Atualizar `ToolzzChatDialog.tsx`

- Apos receber a resposta da API Toolzz, verificar se o conteudo contem indicadores de criacao de tarefa (palavras-chave como "User Story", "Criterios de Aceite", "Dados da Tarefa", "Prioridade")
- Se detectado, chamar a edge function `ai-chat` passando o conteudo como mensagem de usuario com instrucao para criar a tarefa
- O componente precisa receber o `boardId` como prop (usar o primeiro board disponivel do usuario)
- Mostrar na tela apenas a confirmacao: "Tarefa [display_id] criada com sucesso!"
- Se nao for uma tarefa, exibir a resposta normalmente

### 2. Atualizar `Home.tsx`

- Passar o `boardId` do primeiro board do usuario para o `ToolzzChatDialog`
- Importar `useBoards` para obter os boards

### 3. Edge function `ai-chat` (sem alteracao)

- Ja possui toda a logica de tool calling para criar tarefas
- Ja chama `task-created` para gerar o documento automaticamente
- Apenas sera chamada pelo frontend com o conteudo do Toolzz como contexto

### 4. Edge function `task-created` (sem alteracao)

- Ja cria o documento de backlog com blocos estruturados (titulo, descricao, criterios de aceite, notas tecnicas)

## Alteracoes necessarias

| Arquivo | Acao |
|---|---|
| `src/components/ToolzzChatDialog.tsx` | Adicionar logica de deteccao de tarefa + chamada a `ai-chat` + prop `boardId` |
| `src/pages/Home.tsx` | Passar `boardId` para o dialog |

Nenhuma migracao SQL ou nova edge function necessaria - toda a infraestrutura ja existe.
