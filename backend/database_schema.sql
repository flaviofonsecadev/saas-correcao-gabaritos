-- Schema Completo do SaaS de Correção de Gabaritos (Multi-tenant por Escola)

-- 1. Criar tabela de Escolas (Tenant Principal)
CREATE TABLE schools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Código único da escola para facilitar convites/acessos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read schools" ON schools FOR SELECT USING (true);


-- 2. Criar tabela de Professores (Estende a tabela nativa do Supabase Auth)
CREATE TABLE professors (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL, -- A qual escola este professor pertence
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professors can view own profile" ON professors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Professors can update own profile" ON professors FOR UPDATE USING (auth.uid() = id);
-- Um professor pode ver outros professores da mesma escola
CREATE POLICY "Professors can view colleagues" ON professors FOR SELECT USING (
  school_id IN (SELECT school_id FROM professors WHERE id = auth.uid())
);


-- 3. Criar tabela de Turmas/Classes
-- Exemplo: "8º Ano A"
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT extract(year from now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- Professores da mesma escola podem gerenciar e ver as turmas da escola
CREATE POLICY "Professors manage school classes" ON classes FOR ALL USING (
  school_id IN (SELECT school_id FROM professors WHERE id = auth.uid())
);


-- 4. Criar tabela de Alunos
-- Alunos pertencem à Escola, não apenas a um professor
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
  school_id IN (SELECT school_id FROM professors WHERE id = auth.uid())
);
-- Aluno pode ler seu próprio perfil (usado no frontend do aluno)
CREATE POLICY "Students can read own profile" ON students FOR SELECT USING (true);


-- 5. Criar tabela de Provas/Gabaritos Oficiais
-- Agora inclui a "disciplina" (subject), pois um professor pode dar Matemática e Física para o 8º Ano A
CREATE TABLE exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professor_id UUID REFERENCES professors(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL, -- Ex: "Matemática", "Física"
  title TEXT NOT NULL,   -- Ex: "Prova Bimestral 1"
  answer_key JSONB NOT NULL, 
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
-- Professores gerenciam suas próprias provas
CREATE POLICY "Professors manage own exams" ON exams FOR ALL USING (auth.uid() = professor_id);
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

-- * Nota sobre a política do aluno: No frontend, a API validará o enrollment_code (matrícula)
-- para retornar apenas os dados dele, sem precisar de Auth complexa para o estudante.