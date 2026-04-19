# SaaS Correção de Gabaritos (OMR) 📝🤖

Uma plataforma completa de Software as a Service (SaaS) construída para professores, escolas e alunos. O sistema utiliza **Inteligência Artificial (Visão Computacional)** para corrigir gabaritos de provas de múltipla escolha a partir de fotos tiradas por smartphones, eliminando a necessidade de scanners caros ou correções manuais exaustivas.

---

## 🏗️ Arquitetura do Projeto

Este projeto utiliza uma arquitetura moderna e de baixo custo, ideal para startups e MVPs:

- **Frontend:** [Next.js](https://nextjs.org/) (React) + Tailwind CSS
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Motor OMR (Visão Computacional):** [OpenCV](https://opencv.org/) (Python)
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL + RLS Multi-Tenant)

### Funcionalidades
* **Multi-Tenant (Múltiplas Escolas):** O professor pode pertencer e alternar entre várias escolas (ex: "Escola Estadual" e "Colégio Particular").
* **Dashboard do Professor:** Criação de turmas, provas (com disciplinas) e gabaritos.
* **Motor OMR:** Alinha a imagem automaticamente a partir de 4 marcadores (fiducial marks), corrigindo inclinação e perspectiva do celular, para validar as "bolinhas" marcadas.
* **Portal do Aluno:** O aluno acessa `/aluno` apenas com o seu **Código de Matrícula** para ver as notas de todas as matérias em um só lugar.

---

## 🚀 Como Rodar o Projeto Localmente na sua Máquina

O repositório é dividido em dois diretórios principais: `/frontend` e `/backend`. Você precisará rodar ambos para o sistema funcionar de ponta a ponta.

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (v18+)
- [Python](https://www.python.org/downloads/) (v3.10+)
- Uma conta gratuita no [Supabase](https://supabase.com)

---

### Passo 1: Configurar o Banco de Dados (Supabase)

1. Crie um projeto no **Supabase**.
2. Vá em **SQL Editor** no painel do Supabase.
3. Copie o conteúdo do arquivo `backend/database_schema.sql` deste repositório e clique em **Run**.
4. *(Opcional)* Pegue suas chaves de API:
   - A **Project URL** e a **Anon Key** (para o Frontend).
   - A **Service Role Key** (para o Backend, que burla as RLS para gravar os resultados da IA).

---

### Passo 2: Rodando o Backend (API FastAPI + OpenCV)

O backend é responsável por receber as imagens do frontend e processar o reconhecimento óptico (OMR).

1. Abra um terminal e navegue para a pasta `backend`:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual (VENV):
   - **No Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **No Mac/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Instale as dependências. Você pode usar o arquivo de requisitos ou instalar pacote por pacote:

   **Opção A (Recomendada):**
   ```bash
   pip install -r requirements.txt
   ```

   **Opção B (Se ocorrer erro no requirements):**
   ```bash
   pip install fastapi uvicorn opencv-python-headless numpy pydantic python-multipart python-dotenv supabase imutils
   ```

4. Configure as variáveis de ambiente:
   - Duplique o arquivo `.env.example` e renomeie para `.env`.
   - Substitua as chaves com os dados do seu projeto Supabase.

5. Inicie o servidor local:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   > A API estará rodando em `http://localhost:8000`.

---

### Passo 3: Rodando o Frontend (Next.js)

O frontend contém a interface do professor, o gerador de PDF do gabarito e o portal do aluno.

1. Abra um **NOVO** terminal e navegue para a pasta `frontend`:
   ```bash
   cd frontend
   ```

2. Instale as dependências do Node:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Duplique o arquivo `.env.local.example` e renomeie para `.env.local`.
   - Cole as suas chaves do Supabase (URL e Anon Key).

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   > O site estará rodando em `http://localhost:3000`.

---

## 🗺️ Guia de Telas (Rotas do App)

| URL | Descrição |
| :--- | :--- |
| `/` | **Home / Ferramenta OMR:** Tela rápida para fazer o upload de uma foto da prova e testar o OpenCV. |
| `/dashboard` | **Painel do Professor:** Onde o professor cria escolas, turmas, provas e acompanha os resultados. |
| `/template` | **Gerador de Gabaritos:** Layout A4 perfeito com marcadores fiduciais para ser impresso/salvo em PDF e distribuído aos alunos. |
| `/login` | **Autenticação:** Criação de conta de Professor (integrado ao Auth do Supabase). |
| `/aluno` | **Portal do Aluno:** Login sem senha, utilizando apenas a Matrícula, para visualizar o boletim completo. |

---

## 💡 Dicas de Desenvolvimento

- **Gerar o Gabarito em PDF:** Acesse `/template` e use o atalho nativo do navegador (`Ctrl+P` ou `Cmd+P`). O CSS (`@media print`) garante que apenas o layout de leitura A4 seja impresso sem os botões e sem as bordas de margem, o que é crucial para a precisão do OpenCV.
- **PoC OpenCV:** O script `backend/omr_engine.py` já está usando Visão Computacional real! Ele localiza a folha através das bordas (Canny), corta, faz a correção de perspectiva, isola as bolinhas do template (divididas em duas colunas) e calcula a densidade de pixels brancos para descobrir se a bolinha foi preenchida ou deixada em branco.