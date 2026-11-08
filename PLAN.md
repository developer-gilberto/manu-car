# Plano de execução: Manu Car (app de manutenção do carro em React Native)

## Decisões principais

- **Expo, não React Native puro.** Para um app pessoal com notificações locais, o Expo resolve tudo com menos atrito, e o EAS Build gera o APK/IPA sem configurar Xcode ou Android Studio.
- **Sem backend no MVP.** Tudo local em SQLite. Backend só aumenta a superfície de erro e não agrega nada para uso pessoal. Se quiser sincronizar depois, a camada de dados isolada permite isso.
- **O ponto mais traiçoeiro é o lembrete por km.** O celular não sabe a quilometragem do carro, então notificação por km só funciona se o app *estimar* a data a partir do uso médio e você atualizar o odômetro de vez em quando (Fases 2 e 4).

---

## Como usar com o OpenCode

1. Crie a pasta do projeto e coloque o `AGENTS.md` (arquivo separado, junto com este) na raiz. O OpenCode lê esse arquivo automaticamente.
2. Rode o OpenCode e use o modo **Plan** (Tab) para ele revisar o plano; depois use o modo **Build**.
3. Peça **uma fase por vez**. Não mande "faça tudo": o resultado fica pior e difícil de revisar.
4. Entre as fases, revise o diff e rode o app antes de seguir.

---

## Modelo de dados

| Tabela | Campos |
|---|---|
| `vehicles` | id, name, plate?, odometerKm, odometerUpdatedAt |
| `odometer_readings` | id, vehicleId, km, readAt |
| `maintenance_items` | id, vehicleId, name, intervalKm?, intervalMonths?, lastDoneKm?, lastDoneAt?, notifyEnabled, archived |
| `maintenance_logs` | id, itemId, doneAt, km, costCents?, notes? |

Dinheiro sempre em **centavos (inteiro)**, nunca float.

**Itens pré-cadastrados (editáveis):** óleo do motor, filtro de óleo, filtro de ar, filtro de combustível, filtro de cabine, correia dentada, velas, pastilhas de freio, fluido de freio, líquido de arrefecimento, rodízio de pneus, alinhamento/balanceamento, bateria.

Os intervalos padrão são só sugestão genérica. **O manual do seu carro manda**, e a UI deve avisar isso.

---

## Fases

### Fase 0: Setup

- Criar projeto Expo com TypeScript e Expo Router.
- Configurar ESLint, Prettier, Jest, `strict: true`, aliases de import.
- Criar estrutura de pastas e scripts (`lint`, `typecheck`, `test`).
- **Aceite:** `npm run typecheck && npm run lint && npm test` passam; app abre numa tela "Olá".

**Prompt:**

```
Leia o AGENTS.md. Execute APENAS a Fase 0 (Setup) do PLAN.md.
Antes de codar, me mostre em poucas linhas o que vai fazer.
Crie o projeto Expo com TypeScript e Expo Router, configure ESLint,
Prettier, Jest (com @testing-library/react-native), tsconfig strict
e aliases de import, e crie a estrutura de pastas do AGENTS.md.
Adicione os scripts lint, typecheck e test no package.json.
Critério de aceite: typecheck, lint e test passam e o app abre numa
tela simples. Ao terminar, faça o commit (Conventional Commits) e pare.
```

### Fase 1: Camada de dados

- Schema Drizzle + migrations + inicialização do banco no boot.
- Repositórios: `VehicleRepository`, `MaintenanceItemRepository`, `LogRepository`, `OdometerRepository`.
- Seed dos itens padrão ao criar um veículo.
- **Aceite:** testes de repositório passam (CRUD completo, seed correto).

**Prompt:**

```
Execute APENAS a Fase 1 (Camada de dados) do PLAN.md.
Implemente o schema Drizzle com as 4 tabelas do modelo de dados,
migrations, inicialização do banco no boot e os 4 repositórios em
src/data/repositories/. Dinheiro em centavos (inteiro), datas em ISO
8601 UTC. Ao criar um veículo, faça o seed dos itens padrão listados
no plano. Escreva testes de CRUD para cada repositório e para o seed.
Telas NÃO acessam o banco diretamente. Rode typecheck, lint e testes,
faça o commit e pare.
```

### Fase 2: Regras de domínio (a mais importante)

Funções puras em `src/domain/`, com testes unitários pesados:

- `calcNextDue(item, vehicle)`: próximo vencimento por km e por data (vale o que vencer primeiro).
- `calcStatus(item, vehicle, now)`: `ok` | `atencao` (≥ 80% do intervalo consumido) | `vencido`.
- `calcAvgKmPerDay(readings)`: média móvel dos últimos 90 dias, com fallback se houver poucos dados.
- `estimateDueDate(item, vehicle, avgKmPerDay)`: converte "faltam X km" em data estimada.

**Aceite:** casos de borda cobertos: sem leituras, sem intervalo de km, só por tempo, odômetro que diminuiu (rejeitar), item nunca feito, média de km/dia igual a zero.

**Prompt:**

```
Execute APENAS a Fase 2 (Regras de domínio) do PLAN.md.
Crie funções puras em src/domain/ (sem imports de React, Expo ou
banco): calcNextDue, calcStatus, calcAvgKmPerDay e estimateDueDate,
com tipos estritos e sem any. Antes de implementar, liste TODOS os
casos de borda que pretende testar e me mostre. Depois escreva os
testes primeiro e implemente até passarem. Casos obrigatórios: sem
leituras de odômetro, item sem intervalo de km, item só por tempo,
odômetro que diminuiu (rejeitar com erro tipado), item nunca feito,
média de km/dia zero ou negativa, e virada de mês/ano nas datas.
Rode typecheck, lint e testes, faça o commit e pare.
```

### Fase 3: Telas

1. **Home:** lista de itens ordenada por urgência, com badge de status e "faltam X km / Y dias".
2. **Detalhe do item:** histórico de execuções e botão "Marcar como feito" (pede km, data, custo, observação).
3. **Atualizar odômetro:** modal rápido, acessível da Home.
4. **Cadastro/edição de item** e de veículo (validação com zod).
5. **Configurações:** notificações, exportar/importar.

**Aceite:** fluxo manual completo: criar veículo → atualizar km → marcar manutenção → status muda.

**Prompt:**

```
Execute APENAS a Fase 3 (Telas) do PLAN.md. UI em português do Brasil.
Implemente Home, Detalhe do item, modal de atualizar odômetro,
cadastro/edição de item e de veículo, e Configurações (apenas o
esqueleto, notificações e backup vêm depois). Use react-hook-form +
zod para validação. Telas só usam os repositórios e as funções de
src/domain/. Mostre um aviso visível de que os intervalos padrão são
genéricos e o manual do carro prevalece. Inclua estados vazios.
Rode typecheck, lint e testes, faça o commit e pare para eu testar
o fluxo completo manualmente.
```

### Fase 4: Notificações

- Pedir permissão no momento certo (não no primeiro boot).
- Agendar notificação local na data de vencimento/estimada de cada item.
- **Reagendar tudo** quando: odômetro muda, item é marcado como feito, item é editado.
- Lembrete semanal fixo: "Atualize a quilometragem do carro".
- Canal Android configurado; permissão negada tratada com aviso claro na UI.

**Aceite:** teste manual em dispositivo real (notificações não são confiáveis em emulador); testes unitários da função que gera o plano de agendamento.

**Prompt:**

```
Execute APENAS a Fase 4 (Notificações) do PLAN.md.
Separe em duas partes: (1) uma função PURA que recebe itens, veículo
e data atual e devolve a lista de notificações a agendar (com testes
unitários); (2) o módulo que aplica esse plano com expo-notifications,
cancelando tudo e reagendando. Reagendar quando: odômetro muda, item
é marcado como feito, item é editado. Adicionar lembrete semanal
"Atualize a quilometragem do carro". Configurar canal Android. Pedir
permissão apenas quando o usuário ativar lembretes, e tratar
permissão negada com aviso e atalho para as configurações do sistema.
Rode typecheck, lint e testes, faça o commit e me diga o que preciso
testar no celular real.
```

### Fase 5: Acabamento

- Exportar/importar backup em JSON (validado com zod, sem sobrescrever dados às cegas).
- Modo escuro, estados vazios, tratamento de erro.
- Ícone e splash.

**Aceite:** exportar → limpar app → importar restaura tudo.

**Prompt:**

```
Execute APENAS a Fase 5 (Acabamento) do PLAN.md.
Implemente exportar/importar backup em JSON com schema zod versionado
(campo schemaVersion). Na importação: validar tudo antes de gravar,
mostrar um resumo do que será importado, pedir confirmação e gravar
numa única transação (tudo ou nada). Adicione modo escuro, tratamento
de erros com mensagens úteis e configure ícone e splash. Escreva
testes para export/import (incluindo arquivo inválido e versão
desconhecida). Rode typecheck, lint e testes, faça o commit e pare.
```

### Fase 6: Build

- Configurar `eas.json` e gerar APK de teste (perfil `preview`).

**Aceite:** app instalado no celular funcionando offline.

**Prompt:**

```
Execute APENAS a Fase 6 (Build) do PLAN.md.
Configure o eas.json com um perfil preview que gere APK, ajuste
app.json (nome, package/bundle id, versão, permissões mínimas) e me
passe os comandos exatos para rodar o build. Não rode comandos que
exijam login na minha conta Expo, apenas me diga quais são. Confirme
que nenhuma permissão desnecessária (ex.: internet, localização) foi
adicionada além do necessário para notificações.
```

---

## Avisos sinceros

- **Notificações em Android moderno:** fabricantes como Xiaomi e Samsung matam processos em segundo plano. Notificações *agendadas* geralmente sobrevivem, mas teste no seu aparelho real e, se falhar, libere o app da otimização de bateria.
- **Revise a Fase 2 com lupa.** Se a lógica de vencimento estiver errada, o app inteiro mente para você. É onde a IA mais costuma errar casos de borda sutis.
- **Não confie nos intervalos padrão.** Correia dentada, por exemplo, varia muito entre motores (e alguns usam corrente, que nem tem troca periódica).
- **Faça backup do backup.** Como o app é 100% offline, se você desinstalar sem exportar, perde tudo. Considere lembrar de exportar o JSON de tempos em tempos.
