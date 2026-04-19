# Plano: Arquitetura Multi-Tenant com Múltiplas Escolas por Professor

## Resumo
A arquitetura do banco de dados será refatorada para suportar a regra de negócio em que um professor é obrigado a criar ou entrar em uma escola, com o diferencial de que ele pode **pertencer a múltiplas escolas simultaneamente**.

## Análise do Estado Atual
No schema atual (`database_schema.sql`), a tabela `professors` possui uma coluna `school_id`, o que restringe cada professor a apenas uma única escola (relação 1:N). As políticas de RLS (Row Level Security) das tabelas filhas (`classes`, `students`) validam o acesso baseando-se nessa coluna única do professor.

## Mudanças Propostas

### 1. Refatoração do Schema SQL (`backend/database_schema.sql`)
- **Tabela `professors`:** 
  - Remover a coluna `school_id`. O professor passará a ser uma entidade independente.
- **Nova Tabela `school_professors` (Tabela de Junção / Pivot):**
  - Criar esta tabela com as colunas `school_id` (UUID) e `professor_id` (UUID).
  - Adicionar uma coluna `role` (ex: 'admin' para quem criou a escola, 'teacher' para quem foi convidado).
  - Chave primária composta `(school_id, professor_id)`.
- **Atualização das Políticas de Segurança (RLS):**
  - **`schools`:** Um professor só pode ver os dados das escolas nas quais está cadastrado na tabela `school_professors`.
  - **`classes` e `students`:** A verificação passará de `school_id IN (SELECT school_id FROM professors WHERE id = auth.uid())` para `school_id IN (SELECT school_id FROM school_professors WHERE professor_id = auth.uid())`.
  - **`exams` e `results`:** O RLS base (`professor_id = auth.uid()`) continuará funcionando, mas precisaremos adicionar um `school_id` na tabela `exams` para saber em qual contexto de escola aquela prova foi criada (isso impede que provas criadas na Escola A apareçam no painel quando o professor estiver visualizando a Escola B).

### 2. Implicações Futuras (Frontend)
*Embora este plano foque no banco de dados, a mudança dita como o frontend será construído a seguir:*
- **Fluxo de Onboarding:** Logo após o cadastro (`/login`), se o professor não tiver registros na tabela `school_professors`, ele será redirecionado para uma tela obrigatória de "Criar Escola" ou "Entrar em uma Escola com Código".
- **Seletor de Contexto:** No Dashboard do professor, haverá um *dropdown* (seletor) no cabeçalho permitindo que ele alterne entre as escolas (ex: "Colégio Estadual" 🔄 "Escola Particular"). As turmas, alunos e provas listadas serão filtradas com base na escola selecionada.

## Suposições e Decisões
- **Convites:** O `code` que já existe na tabela `schools` será a chave usada pelos professores para "Entrar em uma escola existente". Se o professor digitar o código de uma escola, ele é adicionado à `school_professors` daquela instituição.
- **Obrigatoriedade:** A obrigatoriedade de pertencer a uma escola será tratada principalmente no frontend. As RLS protegerão os dados, retornando arrays vazios se ele não pertencer a nenhuma escola.

## Passos de Verificação
1. Validar se o SQL atualizado compila sem erros (sem conflitos de chaves estrangeiras).
2. Revisar as políticas de RLS garantindo que um professor de uma escola não tenha acesso a turmas de outra escola que ele não leciona.