
## Corrigir criacao e sincronizacao de documentos entre Tarefas e Documentos

### Problemas Identificados

1. **Documentos duplicados massivos**: O `useEffect` no `TaskDetailPanel` que auto-cria documentos esta disparando repetidamente, gerando 28 documentos orfaos "Sem titulo" no banco de dados.
2. **Race condition**: A logica de auto-criacao nao possui protecao contra execucoes multiplas (sem flag `isCreating`, sem verificacao de `createDocument.isPending`).
3. **Documentos duplicados por tarefa**: A tarefa TOZ-7 tem 3 documentos vinculados ao mesmo `task_id`.

### Solucao

#### 1. Limpeza do banco de dados
- Deletar todos os 28 documentos orfaos ("Sem titulo" sem `task_id`).
- Remover documentos duplicados por tarefa, mantendo apenas o que esta referenciado no campo `document_id` da tarefa.

#### 2. Corrigir `TaskDetailPanel.tsx` - Prevenir duplicatas
- Adicionar guard `createDocument.isPending` no `useEffect` para evitar chamadas multiplas.
- Adicionar um `useRef` como flag de "ja tentou criar" para prevenir re-execucao.
- Verificar no banco se ja existe documento com `task_id` antes de criar um novo.

#### 3. Garantir que `DocumentsPage.tsx` funciona corretamente
- O fluxo de criacao via modal "Novo Documento" ja esta implementado e funcional.
- Ao criar um documento vinculado a uma tarefa, o sistema ja abre em fullscreen e salva no banco.
- A sidebar ja lista todos os documentos (tarefas e independentes) com badges do `display_id`.

### Detalhes Tecnicos

**`TaskDetailPanel.tsx`** - Corrigir auto-criacao:
```typescript
const creatingRef = useRef(false);

useEffect(() => {
  if (localDocId || !task.id || creatingRef.current || createDocument.isPending) return;
  creatingRef.current = true;
  
  // Check if document already exists for this task
  supabase.from("documents").select("id").eq("task_id", task.id).limit(1).single()
    .then(({ data }) => {
      if (data) {
        setLocalDocId(data.id);
        supabase.from("tasks").update({ document_id: data.id }).eq("id", task.id);
      } else {
        createDocument.mutate({ title: task.title, icon: "📋", type: "spec", task_id: task.id }, {
          onSuccess: (doc) => {
            setLocalDocId(doc.id);
            supabase.from("tasks").update({ document_id: doc.id }).eq("id", task.id);
          },
          onError: () => { creatingRef.current = false; }
        });
      }
    });
}, [task.id]);
```

**Limpeza SQL** (via migration ou insert tool):
```sql
-- Deletar documentos orfaos sem task_id
DELETE FROM document_blocks WHERE document_id IN (
  SELECT id FROM documents WHERE task_id IS NULL
);
DELETE FROM documents WHERE task_id IS NULL;

-- Deletar documentos duplicados por task_id (manter o referenciado pela tarefa)
DELETE FROM document_blocks WHERE document_id IN (
  SELECT d.id FROM documents d
  JOIN tasks t ON d.task_id = t.id
  WHERE d.id != t.document_id
);
DELETE FROM documents d
USING tasks t
WHERE d.task_id = t.id AND d.id != t.document_id;
```

### Resultado Esperado
- Ao abrir uma tarefa, o documento e criado apenas uma vez e fica disponivel tanto na tarefa quanto no modulo Documentos.
- Ao criar um documento pelo modulo Documentos vinculado a uma tarefa, ele abre em fullscreen e aparece na sidebar.
- Nenhum documento duplicado sera criado.
