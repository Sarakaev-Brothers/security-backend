-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "currentKeyVersion" INTEGER,
ADD COLUMN     "membersHash" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dhPublicKey" TEXT;

-- CreateTable
CREATE TABLE "group_keys" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_keys_groupId_version_idx" ON "group_keys"("groupId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "group_keys_groupId_userId_version_key" ON "group_keys"("groupId", "userId", "version");

-- AddForeignKey
ALTER TABLE "group_keys" ADD CONSTRAINT "group_keys_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_keys" ADD CONSTRAINT "group_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
