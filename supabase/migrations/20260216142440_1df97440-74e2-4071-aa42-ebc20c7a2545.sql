
-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.room_type AS ENUM ('voice', 'text', 'hybrid');
CREATE TYPE public.doc_type AS ENUM ('doc', 'spec', 'note');
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.block_type AS ENUM ('paragraph', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberedList', 'todoList', 'code', 'quote', 'callout', 'divider', 'toggle', 'image');

-- =====================================================
-- MEMBERS (profiles linked to auth.users)
-- =====================================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  surname TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  language TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read all members" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can update own profile" ON public.members FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Members can insert own profile" ON public.members FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER ROLES (separate table for security)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- AUTO-CREATE MEMBER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.members (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- First user gets admin role
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- BOARDS (centrais de tarefas)
-- =====================================================
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  icon TEXT DEFAULT '📋',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read boards" ON public.boards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert boards" ON public.boards FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update boards" ON public.boards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete boards" ON public.boards FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TYPE DEFINITIONS (custom task types per board)
-- =====================================================
CREATE TABLE public.type_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_classes TEXT NOT NULL DEFAULT 'bg-muted text-muted-foreground',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.type_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read type_definitions" ON public.type_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage type_definitions" ON public.type_definitions FOR ALL TO authenticated USING (true);

-- =====================================================
-- TASKS
-- =====================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL DEFAULT '',
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status public.task_status NOT NULL DEFAULT 'backlog',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  type TEXT DEFAULT 'feature',
  points INTEGER,
  delivery_date DATE,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  document_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

-- Auto-generate display_id
CREATE OR REPLACE FUNCTION public.generate_task_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN display_id ~ '^TOZ-[0-9]+$' 
    THEN CAST(substring(display_id from 5) AS INTEGER) 
    ELSE 0 END
  ), 0) + 1 INTO next_num FROM public.tasks;
  NEW.display_id := 'TOZ-' || next_num;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_task_display_id
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.display_id = '' OR NEW.display_id IS NULL)
  EXECUTE FUNCTION public.generate_task_display_id();

-- =====================================================
-- TASK ASSIGNEES
-- =====================================================
CREATE TABLE public.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage task_assignees" ON public.task_assignees FOR ALL TO authenticated USING (true);

-- =====================================================
-- TASK VOTES (Priority Poker)
-- =====================================================
CREATE TABLE public.task_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);
ALTER TABLE public.task_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage task_votes" ON public.task_votes FOR ALL TO authenticated USING (true);

-- =====================================================
-- DOCUMENTS
-- =====================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Sem título',
  icon TEXT DEFAULT '📄',
  type public.doc_type NOT NULL DEFAULT 'doc',
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete documents" ON public.documents FOR DELETE TO authenticated USING (true);

-- Add FK from tasks to documents
ALTER TABLE public.tasks ADD CONSTRAINT tasks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;

-- =====================================================
-- DOCUMENT BLOCKS
-- =====================================================
CREATE TABLE public.document_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  type public.block_type NOT NULL DEFAULT 'paragraph',
  content TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  checked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage document_blocks" ON public.document_blocks FOR ALL TO authenticated USING (true);

-- =====================================================
-- DOCUMENT COMMENTS
-- =====================================================
CREATE TABLE public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage document_comments" ON public.document_comments FOR ALL TO authenticated USING (true);

-- =====================================================
-- ROOMS (escritório virtual)
-- =====================================================
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  type public.room_type NOT NULL DEFAULT 'text',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update rooms" ON public.rooms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete rooms" ON public.rooms FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- MESSAGES (chat)
-- =====================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- MEETINGS
-- =====================================================
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  summary TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage meetings" ON public.meetings FOR ALL TO authenticated USING (true);

-- =====================================================
-- MEETING PARTICIPANTS
-- =====================================================
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(meeting_id, user_id)
);
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage meeting_participants" ON public.meeting_participants FOR ALL TO authenticated USING (true);

-- =====================================================
-- MEETING TRANSCRIPTS
-- =====================================================
CREATE TABLE public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage meeting_transcripts" ON public.meeting_transcripts FOR ALL TO authenticated USING (true);

-- =====================================================
-- MEETING TASKS (linking meetings to generated tasks)
-- =====================================================
CREATE TABLE public.meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  UNIQUE(meeting_id, task_id)
);
ALTER TABLE public.meeting_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage meeting_tasks" ON public.meeting_tasks FOR ALL TO authenticated USING (true);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_document_blocks_updated_at BEFORE UPDATE ON public.document_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ENABLE REALTIME for chat and tasks
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
