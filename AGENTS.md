# Projeto: Manu Car (lembretes de manutenção veicular)

## Objetivo
App mobile pessoal que lembra o usuário de manutenções do carro
(óleo, correia dentada, filtros etc.) por quilometragem e/ou tempo.
O plano completo por fases está em PLAN.md. Execute UMA fase por vez
e pare ao final de cada uma.

## Stack (não adicionar dependências fora desta lista sem perguntar)
- Expo (SDK mais recente estável) + React Native + TypeScript (strict)
- Expo Router (navegação)
- expo-sqlite + Drizzle ORM (persistência local)
- expo-notifications (notificações locais)
- Zustand (estado de UI): dados vêm do banco
- date-fns (datas, locale pt-BR)
- zod (validação de formulários e import/export)
- react-hook-form + @hookform/resolvers
- Jest + @testing-library/react-native
- ESLint + Prettier

## Regras
- Idioma da UI: português do Brasil.
- TypeScript strict, proibido `any`.
- Lógica de negócio em funções puras em `src/domain/`, sem imports de React/Expo.
- Acesso a dados somente via `src/data/repositories/`.
- Telas não falam com o banco diretamente.
- Datas armazenadas em ISO 8601 (UTC); exibir em horário local.
- Dinheiro em centavos (inteiro), nunca float.
- Ao final de cada fase: rodar `tsc --noEmit`, `eslint`, `jest` e corrigir tudo.
- Um commit por fase, mensagem em formato Conventional Commits.
- Não fazer requisições de rede. O app é 100% offline.
- Intervalos de manutenção padrão são genéricos; a UI deve avisar que o manual do carro prevalece.

## Estrutura
src/
  app/            (rotas Expo Router)
  components/
  domain/         (regras puras + testes)
  data/
    db/           (schema, migrations)
    repositories/
  notifications/
  store/
  utils/
