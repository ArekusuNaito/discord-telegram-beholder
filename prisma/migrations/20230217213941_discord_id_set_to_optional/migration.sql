-- CreateTable
CREATE TABLE "User" (
    "telegramId" INTEGER NOT NULL,
    "discordId" INTEGER,
    "telegramUsername" TEXT DEFAULT '<PENDING>',

    CONSTRAINT "User_pkey" PRIMARY KEY ("telegramId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
