# Relatório de Auditoria de Banco de Dados e Infraestrutura NAP

**Data:** Setembro 2026
**Módulo:** Camada de Dados (PostgreSQL + Drizzle)

## A. O que está correto
- **Isolamento de Domínios:** O banco já demonstra uma clara separação lógica de módulos (CRM, IPAM, Helpdesk, Field Service, Faturas, WABA).
- **Trilha de Auditoria Inicial:** Já existem tabelas desenhadas para rastreabilidade, como `helpdesk_audit` e `ipam_audit`.
- **Uso de ORM (Drizzle):** A estrutura está mapeada via Drizzle, permitindo tipagem no backend e geração de migrations automatizadas.
- **Campos de Controle:** A maioria das tabelas principais possui `created_at` e `updated_at`.

## B. Problemas encontrados
1. **Tipagem Crítica Incorreta (Foreign Keys):** Múltiplas tabelas estão definindo chaves estrangeiras utilizando o tipo `serial` (ex: `clienteId: serial('cliente_id').references(...)`). O tipo `serial` instrui o PostgreSQL a criar uma *sequence* autoincremental, o que é um erro semântico grave para uma Foreign Key, podendo corromper o banco no momento do *insert*. O correto é utilizar `integer`.
   - Afeta: `faturas`, `conversas`, `mensagens`, `work_orders`, `work_order_tasks`, `work_order_evidence`, `helpdesk_assignments`, `ipam_reservations`.
2. **Tipagem Financeira:** A tabela `faturas` armazena `valor` como `varchar(50)`. Valores financeiros jamais devem ser strings ou floating point, pois quebram operações matemáticas do banco e cálculos de BSS/ERP.
3. **Tipagem de Datas:** Datas essenciais como `vencimento` na tabela `faturas` e `criadoEm` em `atendimentos` estão como `varchar`.
4. **Falta de Índices Estratégicos:** O Drizzle schema não declara índices para colunas altamente consultadas, como `faturas.cliente_id`, `faturas.status`, `faturas.vencimento` e `mensagens.conversa_id`. Isso fará o sistema colapsar via *Full Table Scans* quando atingir volume.
5. **Auditoria Quebrada:** Nas tabelas `helpdesk_audit` e `ipam_audit`, a coluna `actor_id` é `varchar` em vez de uma Foreign Key (`integer`) referenciando `users.id`.
6. **Unique Constraints Faltantes:** Não existem constraints robustas para evitar duplicação (ex: `linha_digitavel` ou uma combinação única de `provedor_id` + `waba_message_id`).
7. **Ausência de Soft Delete:** Registros como clientes e conversas não possuem marcação de `deleted_at`, o que pode acarretar em deleção permanente acidental (violação da instrução de não apagar transações e históricos).

## C. Riscos

| Risco | Classificação | Impacto |
| :--- | :---: | :--- |
| Corrupção de Inserts (Foreign Keys como Serial) | **CRÍTICO** | Inserções em `conversas`, `faturas` e `work_orders` podem falhar catastroficamente no Postgres em produção ao tentar incrementar a sequence em vez de aceitar o ID referenciado. |
| Perda de Precisão e Inconsistência Financeira | **ALTO** | Valores em `varchar` impossibilitam uso da função `SUM()`, agregações, relatórios financeiros e cálculos de D-3/D+7 eficientes diretamente no SQL. |
| Lentidão Severa (N+1 e Table Scan) | **ALTO** | Sem paginação otimizada e índices nas tabelas `mensagens` e `faturas`, o NAP vai travar a CPU do banco (100%) quando atingir a marca de dezenas de milhares de registros. |
| Inconsistência Relacional (Auditoria) | **MÉDIO** | `actor_id` (varchar) aceita dados lixo que quebram o rastreio da LGPD e não permite JOIN com a tabela `users`. |

## D. Correções recomendadas
1. Corrigir todas as declarações de `serial` em Foreign Keys para `integer`.
2. Migrar `faturas.valor` para `numeric(15,2)`.
3. Migrar `faturas.vencimento` e `atendimentos.criadoEm` para `date` e `timestamp`.
4. Adicionar índices (`indexes`) nas entidades de consulta intensiva.
5. Adicionar `deleted_at` para Soft Delete em tabelas estratégicas (Clientes, Faturas).
6. Implementar validações (Check Constraints) para Status das Faturas (`pendente`, `pago`, `vencido`).

## E. Alterações necessárias no schema (`src/db/schema.ts`)
- Substituir `serial('...').references(...)` por `integer('...').references(...)`.
- Alterar as declarações de tipo: `varchar` -> `numeric`, `date`, `timestamp` onde apropriado.
- Adicionar os blocos `(table) => { return { idx_...: index('...').on(table....) } }` ao final de cada tabela no Drizzle.

## F. Alterações necessárias no backend (`server/`)
- Mapear corretamente as tipagens Drizzle resultantes na leitura/gravação das APIs (especialmente em `reguaRoutes.ts`, `crmRoutes.ts`, e `waba.ts`).
- Atualizar conversores de datas, já que as colunas pararão de devolver strings isoladas e passarão a trafegar objetos `Date` via driver do Postgres.

## G. Alterações necessárias no deploy
- Nenhuma alteração imediata de arquitetura, mas o comando `npx drizzle-kit migrate` (ou similar) precisará ser incluído/homologado no `deploy.sh` após a criação da migration.

## H. Alterações necessárias no backup
- Rotina de pg_dump passará a ter volume maior (devido aos índices), mas dentro da margem de infraestrutura atual (Zabbix monitorando).

## I. Impacto das alterações
- **Downtime Planejado:** Ocorrerá bloqueio na tabela (`LOCK`) temporário no banco para o cast (ALTER COLUMN TYPE) de `varchar` para `numeric` ou `date`.
- O código precisará garantir a conversão caso alguma string malformada já exista no banco (ex: "R$ 99,90" precisará de script de *cleanup* para "99.90" antes da migration rodar).

## J. Plano de migration

1. **FASE 1 - Refatoração Tipográfica Crítica (Foreign Keys):** Criaremos a Migration corrigindo todos os `serial()` que apontam como `references()` para usarem `integer()`.
2. **FASE 2 - Normalização Financeira e de Datas:** Tratamento e cast explícito de `faturas.valor` (para Numeric) e `faturas.vencimento` (para Date).
3. **FASE 3 - Performance e Segurança (Índices e Constraints):** Aplicação dos índices em `faturas.vencimento` (essencial para a Régua CRON) e `mensagens.conversa_id`.

---
*Assinado:* **Nap Copilot - SecureCoder Agent**
