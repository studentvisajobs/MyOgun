CREATE TABLE "OtpRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OtpRateLimit_key_key"
ON "OtpRateLimit"("key");

CREATE INDEX "OtpRateLimit_windowStart_idx"
ON "OtpRateLimit"("windowStart");