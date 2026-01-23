src/
├── main.ts
├── app.module.ts
│
├── common/                                    # Общие утилиты
│   ├── decorators/
│   │   ├── current-user.decorator.ts         # @CurrentUser() для получения юзера из request
│   │   └── public.decorator.ts               # @Public() для пропуска auth guard
│   ├── guards/
│   │   ├── jwt-auth.guard.ts                 # JWT authentication guard
│   │   └── subscription-active.guard.ts      # Проверка активной подписки
│   ├── interceptors/
│   │   ├── logging.interceptor.ts            # Логирование запросов
│   │   └── transform.interceptor.ts          # Трансформация ответов
│   ├── filters/
│   │   └── http-exception.filter.ts          # Глобальный обработчик ошибок
│   └── utils/
│       ├── date.utils.ts                     # Утилиты для работы с датами
│       └── crypto.utils.ts                   # Генерация токенов
│
├── config/                                    # Конфигурация
│   ├── config.module.ts
│   ├── app.config.ts                         # Общие настройки приложения
│   ├── database.config.ts                    # Настройки Prisma
│   ├── jwt.config.ts                         # Настройки JWT
│   └── apple.config.ts                       # Apple API credentials
│
├── database/                                  # Prisma setup
│   ├── database.module.ts
│   ├── prisma.service.ts                     # Prisma Client wrapper
│   └── seeds/
│       └── plans.seed.ts                     # Сиды для планов подписок
│
├── modules/
│   │
│   ├── auth/                                 # 🔐 Аутентификация (Apple Sign-In)
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts                # POST /auth/apple
│   │   ├── auth.service.ts                   # Логика аутентификации
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts               # JWT strategy для Passport
│   │   └── dto/
│   │       ├── apple-sign-in.dto.ts          # { identityToken, authorizationCode }
│   │       └── auth-response.dto.ts          # { accessToken, user }
│   │
│   ├── users/                                # 👤 Пользователи
│   │   ├── users.module.ts
│   │   ├── users.controller.ts               # GET /users/me, PATCH /users/me
│   │   ├── users.service.ts                  # findById, findByAppleId, create, update
│   │   ├── users.repository.ts               # Prisma запросы для User
│   │   └── dto/
│   │       ├── create-user.dto.ts            # { email, appleId }
│   │       ├── update-user.dto.ts            # { email? }
│   │       └── user-response.dto.ts          # Публичные данные юзера
│   │
│   ├── plans/                                # 📋 Планы подписок (статика)
│   │   ├── plans.module.ts
│   │   ├── plans.controller.ts               # GET /plans, GET /plans/:id
│   │   ├── plans.service.ts                  # getAll, getById
│   │   ├── plans.repository.ts               # Prisma запросы для Plan
│   │   └── dto/
│   │       └── plan-response.dto.ts          # { id, name, maxMembers, priceUSD }
│   │
│   ├── groups/                               # 👥 Группы
│   │   ├── groups.module.ts
│   │   ├── groups.controller.ts
│   │   │   # GET /groups/my                  → моя группа
│   │   │   # POST /groups                    → создание (только через покупку)
│   │   │   # DELETE /groups/:id              → удаление группы
│   │   │   # DELETE /groups/:id/members/:userId  → выгнать участника
│   │   ├── groups.service.ts
│   │   │   # getMyGroup(userId)
│   │   │   # createGroup(ownerId, planId)
│   │   │   # deleteGroup(groupId, ownerId)
│   │   │   # removeMember(groupId, memberId, ownerId)
│   │   ├── groups.repository.ts              # Prisma запросы
│   │   ├── dto/
│   │   │   ├── create-group.dto.ts           # { planId }
│   │   │   └── group-response.dto.ts         # С owner, plan, members, subscription
│   │   └── guards/
│   │       └── group-owner.guard.ts          # Проверка, что юзер — владелец группы
│   │
│   ├── subscriptions/                        # 💳 Подписки (Apple IAP)
│   │   ├── subscriptions.module.ts
│   │   ├── subscriptions.controller.ts
│   │   │   # POST /subscriptions/verify      → проверка покупки
│   │   │   # GET /subscriptions/my           → моя подписка
│   │   ├── subscriptions.service.ts
│   │   │   # verifyPurchase(userId, transactionId, planId)
│   │   │   # getMySubscription(userId)
│   │   │   # updateSubscription(id, data)
│   │   ├── subscriptions.repository.ts       # Prisma запросы
│   │   ├── dto/
│   │   │   ├── verify-purchase.dto.ts        # { transactionId, planId }
│   │   │   └── subscription-response.dto.ts  # { status, expiresAt, group }
│   │   └── services/
│   │       └── apple-iap.service.ts          # Работа с Apple API
│   │           # verifyTransaction(transactionId)
│   │           # getTransactionInfo(transactionId)
│   │
│   ├── group-members/                        # 👥 Участники групп
│   │   ├── group-members.module.ts
│   │   ├── group-members.controller.ts
│   │   │   # POST /group-members/leave       → выход из группы
│   │   │   # GET /group-members              → список участников моей группы
│   │   ├── group-members.service.ts
│   │   │   # getMembers(groupId)
│   │   │   # leaveMember(userId)
│   │   │   # createPendingMember(groupId)    → для инвайта
│   │   │   # activateMember(memberId, userId)
│   │   ├── group-members.repository.ts       # Prisma запросы
│   │   └── dto/
│   │       ├── member-response.dto.ts        # { user, status, joinedAt }
│   │       └── leave-group.dto.ts
│   │
│   ├── invites/                              # 🔗 Инвайт-ссылки
│   │   ├── invites.module.ts
│   │   ├── invites.controller.ts
│   │   │   # POST /invites                   → создать инвайт (владелец)
│   │   │   # POST /invites/:token/accept     → принять инвайт
│   │   │   # DELETE /invites/:id             → отозвать инвайт (владелец)
│   │   │   # GET /invites/my                 → мои инвайты (владелец)
│   │   ├── invites.service.ts
│   │   │   # createInvite(groupId, ownerId)
│   │   │   # acceptInvite(token, userId)
│   │   │   # revokeInvite(inviteId, ownerId)
│   │   │   # getMyInvites(groupId)
│   │   ├── invites.repository.ts             # Prisma запросы
│   │   └── dto/
│   │       ├── create-invite.dto.ts
│   │       ├── accept-invite.dto.ts          # { token }
│   │       └── invite-response.dto.ts        # { token, expiresAt, isActive }
│   │
│   ├── webhooks/                             # 🔔 Apple Server Notifications
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.controller.ts
│   │   │   # POST /webhooks/apple            → endpoint для Apple
│   │   ├── webhooks.service.ts
│   │   │   # handleNotification(payload)     → роутинг по типу события
│   │   ├── dto/
│   │   │   └── apple-notification.dto.ts     # Структура Apple webhook
│   │   └── handlers/
│   │       ├── renewal.handler.ts            # DID_RENEW → обновить expiresAt
│   │       ├── expiration.handler.ts         # EXPIRED → status = expired
│   │       └── refund.handler.ts             # REFUND → status = refunded
│   │
│   └── access/                               # ✅ Проверка доступа (runtime)
│       ├── access.module.ts
│       ├── access.service.ts
│       │   # checkUserAccess(userId)          → bool
│       │   # getUserSubscriptionStatus(userId) → SubscriptionStatus
│       └── guards/
│           └── subscription-active.guard.ts  # @UseGuards(SubscriptionActiveGuard)
│
└── test/
    ├── unit/
    └── e2e/

---

## 📝 Ключевые файлы и их роли

### 1. Auth Flow (Apple Sign-In)

**Файл:** `auth/auth.service.ts`

```typescript
async signInWithApple(identityToken: string) {
  // 1. Верифицировать токен через Apple
  const appleUser = await this.verifyAppleToken(identityToken);
  
  // 2. Найти или создать пользователя
  let user = await this.usersService.findByAppleId(appleUser.sub);
  if (!user) {
    user = await this.usersService.create({
      email: appleUser.email,
      appleId: appleUser.sub,
    });
  }
  
  // 3. Сгенерировать JWT
  const accessToken = this.jwtService.sign({ sub: user.id });
  
  return { accessToken, user };
}
```

---

### 2. Purchase Flow (Покупка подписки)

**Файл:** `subscriptions/subscriptions.service.ts`

```typescript
async verifyPurchase(userId: string, transactionId: string, planId: string) {
  // 1. Проверить транзакцию через Apple API
  const transaction = await this.appleIapService.verifyTransaction(transactionId);
  
  // 2. Создать группу
  const group = await this.groupsService.createGroup(userId, planId);
  
  // 3. Создать подписку
  const subscription = await this.subscriptionsRepo.create({
    groupId: group.id,
    appleTransactionId: transaction.transactionId,
    appleOriginalTransactionId: transaction.originalTransactionId,
    status: 'ACTIVE',
    expiresAt: new Date(transaction.expiresDate),
  });
  
  return { subscription, group };
}
```

---

### 3. Invite Flow (Приглашение)

**Файл:** `invites/invites.service.ts`

#### Создание инвайта

```typescript
async createInvite(groupId: string, ownerId: string) {
  // 1. Проверить владельца
  const group = await this.groupsService.getById(groupId);
  if (group.ownerId !== ownerId) {
    throw new ForbiddenException('Not group owner');
  }
  
  // 2. Проверить лимит слотов
  const membersCount = await this.groupMembersService.getCount(groupId);
  if (membersCount >= group.plan.maxMembers) {
    throw new BadRequestException('Group is full');
  }
  
  // 3. Создать pending слот
  const pendingMember = await this.groupMembersService.createPending(groupId);
  
  // 4. Создать инвайт-ссылку
  const invite = await this.invitesRepo.create({
    groupId,
    groupMemberId: pendingMember.id,
    token: generateToken(),
    expiresAt: addDays(new Date(), 7),
  });
  
  return invite;
}
```

#### Принятие инвайта

```typescript
async acceptInvite(token: string, userId: string) {
  // 1. Найти инвайт
  const invite = await this.invitesRepo.findByToken(token);
  if (!invite || !invite.isActive || invite.expiresAt < new Date()) {
    throw new BadRequestException('Invalid or expired invite');
  }
  
  // 2. Проверить, что юзер не в другой группе
  const existingMembership = await this.groupMembersService.findByUserId(userId);
  if (existingMembership) {
    throw new BadRequestException('Already in a group');
  }
  
  // 3. Активировать слот: pending → active
  await this.groupMembersService.activateMember(
    invite.groupMemberId,
    userId,
  );
  
  // 4. Пометить инвайт использованным
  await this.invitesRepo.markAsUsed(invite.id);
  
  return { success: true };
}
```

---

### 4. Access Check (Runtime проверка)

**Файл:** `access/access.service.ts`

```typescript
async checkUserAccess(userId: string): Promise<boolean> {
  // Один запрос к БД с include
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      groupMembership: {
        include: {
          group: {
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { expiresAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const subscription = user?.groupMembership?.group?.subscriptions[0];
  
  return (
    subscription?.status === 'ACTIVE' &&
    subscription.expiresAt > new Date()
  );
}
```

---

### 5. Webhook Handler (Apple Notifications)

**Файл:** `webhooks/webhooks.service.ts`

```typescript
async handleNotification(payload: AppleNotificationDto) {
  const { notificationType, data } = payload;
  
  switch (notificationType) {
    case 'DID_RENEW':
      await this.renewalHandler.handle(data);
      break;
    case 'EXPIRED':
      await this.expirationHandler.handle(data);
      break;
    case 'REFUND':
      await this.refundHandler.handle(data);
      break;
  }
}
```

**Файл:** `webhooks/handlers/renewal.handler.ts`

```typescript
async handle(data: any) {
  const subscription = await this.subscriptionsRepo.findByTransactionId(
    data.transactionId,
  );
  
  await this.subscriptionsRepo.update(subscription.id, {
    expiresAt: new Date(data.expiresDate),
  });
}
```

---

## 🔗 Зависимости между модулями

```
app.module
  ├── ConfigModule (global)
  ├── DatabaseModule (global)
  │
  ├── AuthModule
  │   └── imports: [UsersModule]
  │
  ├── UsersModule
  │
  ├── PlansModule
  │
  ├── GroupsModule
  │   └── imports: [UsersModule, PlansModule]
  │
  ├── SubscriptionsModule
  │   └── imports: [GroupsModule, PlansModule]
  │
  ├── GroupMembersModule
  │   └── imports: [GroupsModule, UsersModule]
  │
  ├── InvitesModule
  │   └── imports: [GroupsModule, GroupMembersModule]
  │
  ├── WebhooksModule
  │   └── imports: [SubscriptionsModule]
  │
  └── AccessModule
      └── imports: [] (использует только Prisma напрямую)
```

### Правила зависимостей

- ✅ **Однонаправленные зависимости**: модули верхнего уровня зависят от нижних
- ✅ **Нет циклических зависимостей**: чёткая иерархия
- ✅ **Shared logic в common/**: переиспользуемые guards, декораторы, утилиты
- ✅ **Repository Pattern**: изоляция Prisma от бизнес-логики

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка окружения

Создайте `.env`:

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/secure_yourself_db"
JWT_SECRET="your-secret-key"
APPLE_TEAM_ID="your-team-id"
APPLE_KEY_ID="your-key-id"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 3. Запуск БД

```bash
docker-compose up -d
```

### 4. Миграции и сиды

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 5. Запуск приложения

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

---

## 📚 Дополнительно

- [RESUME.md](./RESUME.md) — полное описание архитектуры
- [Prisma Schema](./prisma/schema.prisma) — схема базы данных
