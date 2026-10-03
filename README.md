# Rotina — hábitos & evolução

Aplicativo pessoal de hábitos com calendário, progresso, notas, autenticação e sincronização entre dispositivos.

## Arquitetura atual

- Frontend estático publicado no GitHub Pages.
- Supabase Auth + Postgres + Realtime para identidade e sincronização.
- PWA instalável em desktop e dispositivos móveis.
- Tabler Icons para iconografia consistente.
- Playwright para testes de fluxos críticos.
- Validação estrutural antes de cada deploy.
- GitHub Actions com ações fixadas por SHA e deploy bloqueado quando os testes falham.

## Funcionalidades

- Hoje: hábitos do dia, progresso e sequência.
- Calendário: visão mensal e marcação por data.
- Hábitos: criação, edição, frequência, horário, meta, categoria e ícone.
- Evolução: sequência atual, melhor sequência, taxa e histórico.
- Notas: quadro pessoal com salvamento e posição.
- Configurações: tema, motivação e instalação do app.
- Conta: perfil e encerramento de sessão.
- Sincronização por conta entre dispositivos.

## Banco e segurança

As tabelas principais são `profiles`, `habits`, `habit_completions`, `notes` e `user_settings`.

O RLS usa `(select auth.uid())` para evitar reavaliação por linha, e as chaves estrangeiras usadas nas consultas de usuário possuem índices. O Supabase também possui Realtime habilitado para as entidades do app.

A chave que fica no navegador deve ser somente a publishable key do Supabase. Nunca coloque `service_role` ou outra chave privilegiada no frontend.

## Qualidade

Execute:

```bash
npm install
npm run validate
npm run test:e2e
```

O teste E2E usa um modo de teste que só é aceito em `localhost`/\`127.0.0.1`, portanto não cria um bypass de autenticação no endereço público.

## Infraestrutura planejada

A próxima evolução estrutural é migrar o frontend para TypeScript + Vite e separar o código em componentes, domínio, acesso a dados e serviços. A arquitetura alvo também prevê estado de servidor com cache/invalidação, validação de entrada, observabilidade, feature flags e uma suíte maior de testes.

## Referências de arquitetura

Alguns repositórios estudados durante a revisão:

- PWABuilder PWA Starter: https://github.com/pwa-builder/pwa-starter
- Playwright Examples: https://github.com/microsoft/playwright-examples
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- shadcn/ui: https://github.com/shadcn-ui/ui
- exemplos de habit trackers modernos com React/TypeScript/Supabase: ver links no relatório desta revisão.
