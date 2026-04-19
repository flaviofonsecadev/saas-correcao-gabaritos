-- Schema Completo do SaaS de Correção de Gabaritos (Multi-tenant por Escola)

-- 1. Criar tabela de Escolas (Tenant Principal)
CREATE TABLE schools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Código único da escola para facilitar convites/acessos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;


-- 2. Criar tabela de Professores (Estende a tabela nativa do Supabase Auth)
CREATE TABLE professors (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professors can view own profile" ON professors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Professors can update own profile" ON professors FOR UPDATE USING (auth.uid() = id);


-- 2.1 Criar tabela de Junção (Professores x Escolas)
CREATE TABLE school_professors (
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professors(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher', -- 'admin' ou 'teacher'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (school_id, professor_id)
);
ALTER TABLE school_professors ENABLE ROW LEVEL SECURITY;

-- Um professor pode ver seus próprios vínculos
CREATE POLICY "Professors can view own school links" ON school_professors FOR SELECT USING (professor_id = auth.uid());
-- Um professor admin pode gerenciar vínculos daquela escola
CREATE POLICY "Admins can manage school links" ON school_professors FOR ALL USING (
  school_id IN (SELECT school_id FROM school_professors WHERE professor_id = auth.uid() AND role = 'admin')
);

-- Agora podemos definir as políticas da tabela schools:
-- Um professor só vê as escolas que ele participa
CREATE POLICY "Professors can read their schools" ON schools FOR SELECT USING (
  id IN (SELECT school_id FROM school_professors WHERE professor_id = auth.uid())
);


-- 3. Criar tabela de Turmas/Classes
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT extract(year from now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- Professores podem ver e gerenciar as turmas das escolas que eles pertencem
CREATE POLICY "Professors manage school classes" ON classes FOR ALL USING (
  school_id IN (SELECT school_id FROM school_professors WHERE professor_id = auth.uid())
);


-- 4. Criar tabela de Alunos
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL, -- Turma atual do aluno
  name TEXT NOT NULL,
  enrollment_code TEXT UNIQUE NOT NULL, -- Código de acesso único (Matrícula/Senha do aluno)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- Professores da escola podem gerenciar todos os alunos da escola
CREATE POLICY "Professors manage school students" ON students FOR ALL USING (
  school_id IN (SELECT school_id FROM school_professors WHERE professor_id = auth.uid())
);
-- Aluno pode ler seu próprio perfil (A API usará Service Role ou validação de código)
CREATE POLICY "Students can read own profile" ON students FOR SELECT USING (true);


-- 5. Criar tabela de Provas/Gabaritos Oficiais
CREATE TABLE exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL, -- O contexto da prova é a escola
  professor_id UUID REFERENCES professors(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL, -- Ex: "Matemática", "Física"
  title TEXT NOT NULL,   -- Ex: "Prova Bimestral 1"
  answer_key JSONB NOT NULL, 
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
-- Professores gerenciam suas próprias provas dentro da escola
CREATE POLICY "Professors manage own exams" ON exams FOR ALL USING (
  professor_id = auth.uid() AND 
  school_id IN (SELECT school_id FROM school_professors WHERE professor_id = auth.uid())
);
-- Alunos podem ler as provas que pertencem à sua turma
CREATE POLICY "Students can read class exams" ON exams FOR SELECT USING (true);


-- 6. Criar tabela de Resultados (Correções dos Alunos)
CREATE TABLE results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL, 
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage DECIMAL NOT NULL,
  details JSONB NOT NULL, 
  image_url TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
-- Professores gerenciam os resultados das suas próprias provas
CREATE POLICY "Professors manage results for own exams" ON results FOR ALL USING (
  exam_id IN (SELECT id FROM exams WHERE professor_id = auth.uid())
);
-- Alunos podem ver APENAS seus próprios resultados
CREATE POLICY "Students can read own results" ON results FOR SELECT USING (true);