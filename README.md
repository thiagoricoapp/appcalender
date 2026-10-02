# AppCalender — Rotina

Aplicativo web para construir hábitos e acompanhar a própria evolução.

## O que já existe
- Hoje: hábitos do dia, progresso e sequência.
- Calendário: visão mensal do histórico.
- Hábitos: criação, acompanhamento e exclusão.
- Notas: diário pessoal com salvamento automático.
- Configurações: temas, mensagens motivacionais e limpeza de dados locais.
- Conta: perfil local com nome e e-mail opcional.
- Layout responsivo para desktop e celular.

## Dados
A primeira versão usa `localStorage`, portanto os dados ficam no navegador/dispositivo atual. Não há login ou banco de dados ainda.

## Próxima evolução
Autenticação, banco de dados, sincronização entre dispositivos, edição de hábitos, metas por frequência, estatísticas, conquistas e PWA.

## Hábitos avançados
Cada hábito pode ter:
- Frequência diária, dias específicos ou meta semanal.
- Horário.
- Meta com unidade.
- Categoria.
- Edição e exclusão.
- Página individual de evolução.
- Sequência atual e melhor sequência.
- Consistência dos últimos 30 dias.
- Total de conclusões.
- Histórico visual dos últimos 30 dias.


## V3 — visual e arquitetura
A interface foi redesenhada com foco em desktop, tema escuro profissional, microinterações e navegação responsiva. O projeto também inclui uma base preparada para Supabase:
- `supabase-client.js` para URL + chave publicável.
- `supabase-schema.sql` com perfis, hábitos, conclusões, notas e configurações.
- RLS por usuário nas tabelas.

O app continua funcionando em modo local até as credenciais e o login do Supabase serem configurados.
