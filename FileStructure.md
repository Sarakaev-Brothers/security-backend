# Backend Architecture Overview

## Project Structure

    src/
    ├── main.ts
    ├── app.module.ts
    │
    ├── common/                                    # Shared utilities
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts         # @CurrentUser() to get user from request
    │   │   └── public.decorator.ts               # @Public() to bypass auth guard
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts                 # JWT authentication guard
    │   │   └── subscription-active.guard.ts      # Active subscription check
    │   ├── interceptors/
    │   │   ├── logging.interceptor.ts            # Request logging
    │   │   └── transform.interceptor.ts          # Response transformation
    │   ├── filters/
    │   │   └── http-exception.filter.ts          # Global error handler
    │   └── utils/
    │       ├── date.utils.ts                     # Date utilities
    │       └── crypto.utils.ts                   # Token generation
    │
    ├── config/                                    # Configuration
    │   ├── config.module.ts
    │   ├── app.config.ts                         # General application settings
    │   ├── database.config.ts                    # Prisma configuration
    │   ├── jwt.config.ts                         # JWT configuration
    │   └── apple.config.ts                       # Apple API credentials
    │
    ├── database/                                  # Prisma setup
    │   ├── database.module.ts
    │   ├── prisma.service.ts                     # Prisma Client wrapper
    │   └── seeds/
    │       └── plans.seed.ts                     # Subscription plan seeds
    │
    ├── modules/
    │
    │   ├── auth/                                 # Authentication (Apple Sign-In)
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts                # POST /auth/apple
    │   │   ├── auth.service.ts                   # Authentication logic
    │   │   ├── strategies/
    │   │   │   └── jwt.strategy.ts               # JWT strategy for Passport
    │   │   └── dto/
    │   │       ├── apple-sign-in.dto.ts          # { identityToken, authorizationCode }
    │   │       └── auth-response.dto.ts          # { accessToken, user }
    │
    │   ├── users/                                # Users
    │   │   ├── users.module.ts
    │   │   ├── users.controller.ts               # GET /users/me, PATCH /users/me
    │   │   ├── users.service.ts                  # findById, findByAppleId, create, update
    │   │   ├── users.repository.ts               # Prisma queries for User
    │   │   └── dto/
    │   │       ├── create-user.dto.ts            # { email, appleId }
    │   │       ├── update-user.dto.ts            # { email? }
    │   │       └── user-response.dto.ts          # Public user data
    │
    │   ├── plans/                                # Subscription plans (static)
    │   │   ├── plans.module.ts
    │   │   ├── plans.controller.ts               # GET /plans, GET /plans/:id
    │   │   ├── plans.service.ts                  # getAll, getById
    │   │   ├── plans.repository.ts               # Prisma queries for Plan
    │   │   └── dto/
    │   │       └── plan-response.dto.ts          # { id, name, maxMembers, priceUSD }
    │
    │   ├── groups/                               # Groups
    │   │   ├── groups.module.ts
    │   │   ├── groups.controller.ts
    │   │   │   # GET /groups/my
    │   │   │   # POST /groups
    │   │   │   # DELETE /groups/:id
    │   │   │   # DELETE /groups/:id/members/:userId
    │   │   ├── groups.service.ts
    │   │   ├── groups.repository.ts
    │   │   └── guards/
    │   │       └── group-owner.guard.ts
    │
    │   ├── subscriptions/                        # Subscriptions (Apple IAP)
    │   │   ├── subscriptions.module.ts
    │   │   ├── subscriptions.controller.ts
    │   │   │   # POST /subscriptions/verify
    │   │   │   # GET /subscriptions/my
    │   │   ├── subscriptions.service.ts
    │   │   ├── subscriptions.repository.ts
    │   │   └── services/
    │   │       └── apple-iap.service.ts
    │
    │   ├── group-members/
    │   │   ├── group-members.module.ts
    │   │   ├── group-members.controller.ts
    │   │   ├── group-members.service.ts
    │   │   ├── group-members.repository.ts
    │   │   └── dto/
    │
    │   ├── invites/
    │   │   ├── invites.module.ts
    │   │   ├── invites.controller.ts
    │   │   ├── invites.service.ts
    │   │   ├── invites.repository.ts
    │   │   └── dto/
    │
    │   ├── webhooks/
    │   │   ├── webhooks.module.ts
    │   │   ├── webhooks.controller.ts
    │   │   ├── webhooks.service.ts
    │   │   └── handlers/
    │
    │   └── access/
    │       ├── access.module.ts
    │       ├── access.service.ts
    │       └── guards/
    │
    └── test/
        ├── unit/
        └── e2e/

------------------------------------------------------------------------

## Key Files and Their Roles

### Auth Flow (Apple Sign‑In)

``` ts
async signInWithApple(identityToken: string) {
  const appleUser = await this.verifyAppleToken(identityToken);

  let user = await this.usersService.findByAppleId(appleUser.sub);

  if (!user) {
    user = await this.usersService.create({
      email: appleUser.email,
      appleId: appleUser.sub,
    });
  }

  const accessToken = this.jwtService.sign({ sub: user.id });

  return { accessToken, user };
}
```

------------------------------------------------------------------------

### Purchase Flow

``` ts
async verifyPurchase(userId: string, transactionId: string, planId: string) {

  const transaction = await this.appleIapService.verifyTransaction(transactionId);

  const group = await this.groupsService.createGroup(userId, planId);

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

------------------------------------------------------------------------

### Access Check

``` ts
async checkUserAccess(userId: string): Promise<boolean> {

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

------------------------------------------------------------------------

## Module Dependencies

    app.module
     ├ ConfigModule
     ├ DatabaseModule
     ├ AuthModule → UsersModule
     ├ GroupsModule → UsersModule, PlansModule
     ├ SubscriptionsModule → GroupsModule, PlansModule
     ├ GroupMembersModule → GroupsModule, UsersModule
     ├ InvitesModule → GroupsModule, GroupMembersModule
     ├ WebhooksModule → SubscriptionsModule
     └ AccessModule
