-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'EXPIRED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "group_member_status" AS ENUM ('PENDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "appleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL,
    "priceUSD" DECIMAL(10,2) NOT NULL,
    "appleProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "appleTransactionId" TEXT NOT NULL,
    "appleOriginalTransactionId" TEXT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "group_member_status" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupMemberId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_appleProductId_key" ON "plans"("appleProductId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_ownerId_key" ON "groups"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_appleTransactionId_key" ON "subscriptions"("appleTransactionId");

-- CreateIndex
CREATE INDEX "subscriptions_groupId_idx" ON "subscriptions"("groupId");

-- CreateIndex
CREATE INDEX "subscriptions_status_expiresAt_idx" ON "subscriptions"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_userId_key" ON "group_members"("userId");

-- CreateIndex
CREATE INDEX "group_members_groupId_status_idx" ON "group_members"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_links_token_key" ON "invite_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invite_links_groupMemberId_key" ON "invite_links"("groupMemberId");

-- CreateIndex
CREATE INDEX "invite_links_token_idx" ON "invite_links"("token");

-- CreateIndex
CREATE INDEX "invite_links_groupId_isActive_idx" ON "invite_links"("groupId", "isActive");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
