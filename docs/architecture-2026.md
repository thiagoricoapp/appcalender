# Revisão de infraestrutura — 2026

## Diagnóstico

O projeto atual é funcional como PWA estático, mas o frontend ainda está concentrado em um único arquivo JavaScript. A revisão encontrou que esse formato facilitou regressões de integração entre funções, eventos, renderização e modais. A prioridade passa a ser tornar regressões detectáveis antes de publicar.

## Estado atual

Frontend: HTML/CSS/JavaScript no GitHub Pages.
Backend: Supabase Auth, Postgres e Realtime.
Persistência local: localStorage como cache/UI local.
Instalação: manifest + service worker + ícones PNG 192/512.
Qualidade: validação estrutural + Playwright E2E no GitHub Actions.
Segurança: RLS por usuário, índices de FK, CSP parcial via meta tag, publishable key no frontend.

## Arquitetura alvo

```
UI/components
    ↓
application/use-cases
    ↓
domain (habit rules, streaks, schedules)
    ↓
data services
    ├── local cache / outbox
    └── Supabase
```

A UI não deve conhecer diretamente detalhes de Postgres. Regras de hábito ficam em funções de domínio testáveis. Operações de leitura/escrita ficam em serviços. Sincronização usa uma fila local (outbox) para que uma ação feita offline não seja perdida.

## Stack recomendada para a próxima migração

- Vite 8 + React + TypeScript.
- Componentes reutilizáveis e acessíveis com shadcn/ui/Base UI.
- Zustand apenas para estado local de interface; estado remoto com TanStack Query.
- Zod para validar dados vindos de formulários, localStorage e backend.
- Supabase JS tipado com o `database.types.ts` gerado do banco.
- vite-plugin-pwa/Workbox para lifecycle e atualizações do service worker.
- Playwright para fluxos críticos.
- Lighthouse CI para evitar regressões de performance, acessibilidade e PWA.
- Figma como fonte visual; Tabler Icons permanece apropriado para o sistema de ícones.

## Modelo de qualidade

Cada alteração deve passar por:

1. validação de estrutura e sintaxe;
2. testes E2E de navegação, criação, edição, conclusão, notas, configurações e calendário;
3. build de produção;
4. auditoria Lighthouse;
5. revisão de segurança;
6. deploy somente depois das verificações.

## Dados e sincronização

O modelo atual funciona para uso online, mas ainda precisa de uma camada de outbox para robustez offline.

A evolução prevista é:

```
ação do usuário
   ↓
atualização otimista local
   ↓
outbox persistida
   ↓
sincronização Supabase
   ↓
confirmação/remediação de conflito
```

Cada operação deve possuir um identificador idempotente e uma política explícita para retry.

## Segurança

Manter RLS em todas as tabelas de usuário. Evitar regras como `auth.uid() = user_id` sem a otimização `(select auth.uid())` em tabelas grandes. Indexar colunas de filtro/FK usadas pelos endpoints.

O Supabase Advisor ainda aponta que a proteção contra senhas comprometidas está desativada. Esse recurso deve ser habilitado nas configurações de Auth do projeto.

GitHub Actions deve continuar usando permissões mínimas e ações fixadas em SHA completo.

## Referências estudadas

- PWABuilder PWA Starter — starter de PWA com Vite/TypeScript e abordagem de produção.
- Playwright — testes E2E, isolamento, traces, screenshots e integração com GitHub Actions.
- Lighthouse CI — auditoria contínua de performance, acessibilidade, SEO, PWA e budgets.
- shadcn/ui — componentes como fonte no próprio projeto; Base UI é a base padrão para novos projetos a partir de julho de 2026.
- Exemplos de habit trackers modernos usam React/TypeScript, Vite/Next, Supabase, Zustand, Zod, testes e PWA como combinação recorrente.
