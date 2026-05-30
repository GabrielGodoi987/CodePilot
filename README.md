# CodePilot 💻

Uma aplicação voltada para empresas recrutamento de desenvolvedores

## Ideia 💡

Uma plataforma onde:

- recruiter cria entrevista
- candidato responde desafios
- sistema executa testes automaticamente
- IA analisa código e dá feedback técnico

## Vamos usar

- Nest.js => Para o backend ou express
- PostgresSQl => Para acesso a dados
- Redis
- Docker

## Tecnologia frotend

- Next.js
- TailwindCss
- React query

---

## Básicas

- login JWT
- empresas
- candidatos
- desafios
- submissão de código

## Intermediárias

- execução de código em container Docker isolado
- fila com BullMQ
- websocket para status em tempo real

## Avançadas

- IA avaliando legibilidade
- score técnico
- anti-plágio
- métricas de performance

---

## Habilidades a ser demonstradas

- arquitetura backend
- filas
- processamento assíncrono
- segurança
- execução sandbox
- SQL
- autenticação
- RBAC
- design system
- clean architecture

## Entitidades da aplicação

- recruiter cria entrevista -> Recruiter belongs to a company
- candidato responde desafios -> Candidate from company or candidate with an account?
- sistema executa testes automaticamente -> Testar código na plataforma? Como isso seria?
- IA analisa código e dá feedback técnico -> Como fazer isso?

## Entities

### User

- name
- email
- password
- role -> Enum(interviewee)
- rate -> Baseado na quantidade de aprovações que conseguiu na plataforma
- interviews -> todas as entrevistas que realizou

### Company

- name
- rate -> Baseado na quantidade de aprovações
- openInterviews[]
- interviews[]
- members: CompanyMember[]

## CompanyMember

- id
- companyId
- userId
- role(Interviwer, tech lead, recruiter)

### Interview

- position
- level
- rawData -> Coluna jsonB com anotações ou algo relacionado a isso
- companyId
- interviewerId -> ID do entrevistador
- intervieweeId -> Id do entrevistado
- interviewDate -> Data da entrevista
- interviewTime -> Quanto tempo vai durar em minutos

-> Interview pode ter um ou vários challenges, um challenge pode estar em uma ou várias interviews, ou seja muitos para muitos

## InterviewFeedback

- id
- interviewId
- authorId
- technicalScore
- communicationScore
- strengths
- weaknesses
- finalNotes
- recommendation

## InterviewChallenge

- id
- interviewId
- challengeId
- order
- maxScore
- required -> boolean

## Chanlenge

- level
- title
- description
- expectation jsonB -> jsonB com todos os requirements do desafio
- pontuation -> A pontuação mais alta é a que promove mais e pode ser selecionado e contratado

## TestCase

- id
- challengeId
- title
- input jsonB
- expectedOutput jsonB
- isHidden
- weight
- executionOrder
- timeoutInMs
- memoryLimitInMb
- createdAt
- updatedAt

## SubmissionTestResult

- id
- submissionId
- testCaseId
- passed
- executionTime
- memoryUsage
- stdout
- stderr
- score

## ChallengeSubmission

- id
- challengeId
- interviewId
- candidateId
- language
- sourceCode
- executionResult jsonB
- aiFeedback jsonB
- score
- status -> pending, running, approved, failed
- submittedAt

### Notifications -> Emite notifications todas as vezes que algo importante acontece

Usuário aprovado? Envia notification;
Usuário reprovado? Envia notification;
Entrevistas abertas? Envia notification com base nas preferências do usuário(Tiramos a base nas últimas entrevistas)

## enums

### InterviewStatus

- scheduled
- in_progress
- completed
- approved
- rejected
- canceled

# MVP - Codepilot

- é possível criar um usuário
- é possível criar uma company
- É possível criar e agendar uma interview
