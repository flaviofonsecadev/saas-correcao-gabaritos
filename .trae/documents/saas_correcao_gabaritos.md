# Plano: SaaS para Correção de Gabaritos de Provas

## Resumo
Este plano descreve a arquitetura, tecnologias e viabilidade para a criação de um SaaS focado em professores, cujo objetivo é automatizar a correção de gabaritos de provas de múltipla escolha. A pesquisa priorizou **ferramentas open-source e infraestrutura de baixo custo** (ou tiers gratuitos) ideais para validar um Mínimo Produto Viável (MVP).

## Análise do Estado Atual
O projeto será construído do zero. O principal desafio técnico é garantir que o sistema consiga ler as marcações dos alunos com precisão, mesmo quando as imagens forem fotos tiradas por smartphones (problemas de perspectiva, rotação e iluminação). Soluções comerciais costumam ser caras, mas o ecossistema open-source de Visão Computacional (OMR - Optical Mark Recognition) evoluiu bastante.

## Alternativas Mais Viáveis e de Baixo Custo (Pesquisa)

### 1. Motor de Correção (Visão Computacional)
Para o núcleo do sistema (ler as bolinhas pintadas no papel), a melhor tecnologia é **Python com OpenCV**:
- **OMRChecker:** Uma biblioteca Python open-source muito popular no GitHub (mais de 1k estrelas). É rápida, precisa e já resolve os maiores problemas (rotação e correção de perspectiva se a imagem vier da câmera do celular).
- **pyOMR:** Outra alternativa sólida em Python.
- **Decisão Técnica:** Utilizar Python e OpenCV para o processamento de imagens (OMR). É a escolha mais madura, com vasta documentação e totalmente gratuita.

### 2. Stack Tecnológico (SaaS)
Para construir a plataforma ao redor do motor de correção, propomos uma stack moderna e extremamente econômica:

* **Frontend (Interface do Professor):** 
  * **Next.js (React) + Tailwind CSS.** Permite criar interfaces rápidas e modernas.
  * **Hospedagem:** Vercel (Gratuito para MVPs, excelente performance).
* **Backend (API de Processamento):**
  * **FastAPI (Python).** Framework extremamente rápido, moderno e que se integra nativamente com as bibliotecas de processamento de imagem (OpenCV).
  * **Hospedagem:** VPS Econômica (ex: Hetzner Cloud, DigitalOcean Droplet ou Render). *Nota:* O processamento de imagens é pesado, logo, funções serverless (como as da AWS Lambda ou Vercel) podem falhar por limite de tempo/memória. Uma VPS de ~$5 a ~$10 por mês é a opção mais segura e barata.
* **Banco de Dados, Autenticação e Storage:**
  * **Supabase.** Alternativa open-source ao Firebase. O tier gratuito é incrivelmente generoso (até 50.000 usuários ativos mensais, 500MB de banco PostgreSQL, 1GB de Storage para as fotos das provas). Ele gerencia login, senhas e armazenamento de arquivos, economizando semanas de desenvolvimento.

### 3. Modelo de Negócios / Monetização (Sugestão)
- **Freemium:** X correções gratuitas por mês.
- **Assinatura (SaaS):** Plano mensal/anual acessível para correções ilimitadas e relatórios avançados de desempenho da turma.

## Mudanças Propostas / Arquitetura
1. **Geração do Gabarito (Frontend):** O professor cria uma prova (ex: 20 questões com 4 alternativas). O sistema gera um PDF padronizado com os "marcadores" de alinhamento (fiduciary marks - essenciais para o OpenCV entender a folha).
2. **Captura e Upload (Frontend/Mobile):** O professor imprime, os alunos preenchem. O professor tira uma foto com o celular ou escaneia e faz o upload na plataforma.
3. **Processamento (Backend):** A imagem é enviada para o servidor FastAPI. O script OpenCV alinha a imagem, identifica quais "bolinhas" estão preenchidas mais escuras (thresholding) e compara com o gabarito oficial (cadastrado pelo professor).
4. **Resultados (Banco de Dados):** O sistema salva a nota do aluno no Supabase e o professor visualiza as estatísticas instantaneamente no Dashboard (Next.js).

## Suposições e Decisões
- **Foco em Dispositivos Móveis (Responsividade):** O professor precisará tirar fotos pelo celular, portanto, a interface web deve ser PWA (Progressive Web App) ou perfeitamente responsiva para facilitar o upload direto da câmera.
- **Processamento no Servidor:** Tentativas de fazer OMR diretamente no navegador do usuário (via JavaScript/WebAssembly) geralmente resultam em baixa precisão e lentidão em celulares antigos. Fazer o processamento no backend garante confiabilidade.

## Passos de Implementação (Roadmap)

### Fase 1: Prova de Conceito (OMR)
- [ ] Configurar ambiente Python e instalar OpenCV.
- [ ] Desenhar o template do gabarito em branco (com marcadores nos cantos para alinhamento).
- [ ] Desenvolver o script de correção que recebe uma foto, alinha a folha e identifica as respostas corretas.

### Fase 2: Infraestrutura Backend
- [ ] Criar projeto FastAPI.
- [ ] Criar endpoint `/upload` que recebe a imagem, aciona o script OMR e retorna a pontuação (JSON).
- [ ] Integrar Supabase (Autenticação JWT e armazenamento de resultados).

### Fase 3: Desenvolvimento Frontend (SaaS)
- [ ] Criar projeto Next.js + TailwindCSS.
- [ ] Desenvolver fluxo de Autenticação (Login/Cadastro com Supabase).
- [ ] Desenvolver Dashboard do Professor (Listagem de Turmas e Provas).
- [ ] Desenvolver tela de Geração de Gabaritos em PDF.
- [ ] Desenvolver tela de Upload de Fotos e exibição de notas.

### Fase 4: Testes e Deploy
- [ ] Realizar testes de estresse (fotos com sombra, fotos tortas, amassados).
- [ ] Fazer deploy do Frontend na Vercel.
- [ ] Fazer deploy do Backend em uma VPS de baixo custo (Hetzner / DigitalOcean).
- [ ] Configurar domínios e certificados SSL.
