# BolãoCorp — Sistema de Gerenciamento de Bolão Corporativo

Sistema administrativo completo para gerenciamento de bolões esportivos corporativos.
Construído com Next.js 15 App Router, TypeScript, TailwindCSS e Prisma ORM.

---

## Stack

| Tecnologia  | Uso                                      |
|-------------|------------------------------------------|
| Next.js 15  | App Router, Server Actions, API Routes   |
| TypeScript  | Tipagem completa, zero any explícito     |
| Tailwind    | Design system inspirado no Sicredi       |
| Prisma ORM  | Acesso ao banco, tipagem automática      |
| PostgreSQL  | Banco (Supabase recomendado)             |
| Recharts    | Gráfico de distribuição de pontos        |
| pdf-lib     | Geração de PDF do ranking                |
| PapaParse   | Parsing de arquivos CSV                  |

---

## Funcionalidades

- Dashboard com cards, top 5 e gráfico
- Ranking com drawer lateral e exportação PDF
- Importação CSV com preview, validação e histórico
- CRUD completo de Participantes e Jogos
- Registro de resultado com recálculo automático
- Regras de pontuação configuráveis (recalcula tudo ao salvar)
- Integração esportiva com arquitetura ISportsProvider desacoplada

---

## Instalação

### 1. Instalar dependências

\`\`\`bash
npm install
\`\`\`

### 2. Configurar ambiente

\`\`\`bash
cp .env.example .env
# Edite DATABASE_URL com sua connection string PostgreSQL
\`\`\`

### 3. Gerar o Prisma Client e migrar o banco

\`\`\`bash
npx prisma generate
npx prisma migrate dev --name init
\`\`\`

### 4. Rodar em desenvolvimento

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:3000

---

## Estrutura de Pastas

\`\`\`
bolao-corporativo/
├── app/
│   ├── api/sports/sync/        # API Route — sincronização esportiva
│   ├── dashboard/              # Visão geral
│   ├── ranking/                # Classificação completa
│   ├── import/                 # Upload e histórico de CSV
│   ├── participants/           # CRUD participantes
│   ├── matches/                # CRUD jogos + resultados
│   ├── rules/                  # Regras de pontuação
│   ├── sync/                   # Sincronização com APIs
│   ├── layout.tsx              # Layout global com sidebar
│   └── globals.css             # Design system (paleta Sicredi)
├── components/
│   ├── ui/index.tsx            # Button, Input, Modal, Drawer, Table...
│   ├── layout/sidebar.tsx      # Navegação lateral
│   └── features/               # Componentes por funcionalidade
├── lib/
│   ├── actions.ts              # Todas as Server Actions
│   ├── pdf.ts                  # Geração de PDF
│   ├── prisma.ts               # Cliente singleton
│   └── utils.ts                # Helpers e cálculo de pontos
├── services/
│   └── sports-provider.ts      # ISportsProvider + Mock + API-Football
├── types/index.ts
└── prisma/schema.prisma
\`\`\`

---

## Formato do CSV

| Coluna           | Obrigatório | Exemplo              |
|-----------------|-------------|----------------------|
| Nome (ou Name)  | Sim         | João da Silva        |
| Email           | Sim         | joao@empresa.com.br  |
| Brasil x França | Sim         | 2x1                  |
| Alemanha x Japão| Sim         | 0x0                  |

Os cabeçalhos de jogo devem conter os nomes dos times separados por "x", "-" ou "vs".

---

## Provider Esportivo

Troque o provider via .env sem alterar código:

\`\`\`env
SPORTS_PROVIDER=api-football
API_FOOTBALL_KEY=sua_chave
\`\`\`

Para criar um novo provider, implemente \`ISportsProvider\` em \`services/sports-provider.ts\`.

---

## Regras de Pontuação (padrão)

| Situação         | Pontos |
|-----------------|--------|
| Placar exato    | 3      |
| Vencedor certo  | 1      |
| Empate certo    | 1      |
| Erro            | 0      |

Configurável em \`/rules\`. Salvar recalcula toda a classificação automaticamente.
