

# Ajustes: Logo na Sidebar + Calendario Estilo Planner

---

## 1. Logo Toolzz na Sidebar

**Arquivo:** `src/components/AppSidebar.tsx`

- Copiar a imagem `imagem_2026-02-16_003022262.png` para `src/assets/toolzz-logo.png`
- Substituir o `<div>` com a letra "T" por uma tag `<img>` importando a logo
- Manter o mesmo tamanho (w-8 h-8 rounded-lg)
- Quando colapsado, mostrar apenas o icone; quando expandido, mostrar icone + "Toolzz Office"

---

## 2. Calendario Estilo Huly Planner (3 paineis)

**Arquivo:** `src/pages/CalendarPage.tsx` (reescrever)

Layout em 3 paineis lado a lado, inspirado na referencia image-15:

### Painel Esquerdo (sidebar do calendario)
- Titulo "Planner"
- Filtros: Unplanned, Planned, All (com contadores)
- Mini calendario mensal compacto com navegacao mes anterior/proximo
- Dias da semana abreviados (Dom, Seg, Ter...), dia atual destacado com circulo azul

### Painel Central (tarefas do dia)
- Titulo dinamico baseado no filtro selecionado (ex: "Unplanned")
- Input "+ Adicionar item" no topo
- Lista de tarefas e reunioes agendadas para o dia selecionado
- Cada item mostra: tipo (icone), titulo, ID da tarefa vinculada

### Painel Direito (agenda horaria)
- Header "Schedule: Today" com navegacao de dias (< Today: seg, 16 >)
- Colunas de dias (Today Segunda-feira, 17 Terca-feira, 18 Quarta-feira)
- Grid de horarios (00:00 ate 23:00) com linhas horizontais
- Linha vermelha indicando hora atual
- Eventos/reunioes posicionados no horario correto como blocos coloridos

### Dados
- Reutilizar `mockTasks` e `mockMeetings` existentes
- Mini calendario usa `date-fns` (ja instalado) para calculos

---

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/assets/toolzz-logo.png` | Nova imagem (copiar do upload) |
| `src/components/AppSidebar.tsx` | Trocar placeholder por imagem real da logo |
| `src/pages/CalendarPage.tsx` | Reescrever com layout 3 paineis estilo Huly Planner |

