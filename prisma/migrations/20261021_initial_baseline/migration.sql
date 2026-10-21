-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ThreatLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ConfirmationVote" AS ENUM ('CONFIRM', 'FALSE_REPORT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'COMMUNITY_LEADER', 'POLICE', 'ADMIN');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ROBBERY', 'KIDNAPPING', 'ACCIDENT', 'FLOOD', 'FIRE', 'MISSING_PERSON', 'SUSPICIOUS_ACTIVITY', 'ROAD_BLOCK', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'VERIFIED', 'CRITICAL', 'RESPONDING', 'RESOLVED', 'FALSE');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "SOSStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "GuardianSessionStatus" AS ENUM ('ACTIVE', 'STOPPED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EvidenceCaptureType" AS ENUM ('PHOTO', 'VIDEO', 'AUDIO', 'LOCATION', 'NOTE');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING', 'UPLOADING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "GuardianInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmergencyResponderStatus" AS ENUM ('NOTIFIED', 'VIEWED', 'RESPONDING', 'ARRIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SafeJourneyStatus" AS ENUM ('ACTIVE', 'CHECKED_IN', 'OVERDUE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('GUARDIAN', 'COMMUNITY', 'POLICE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('ACTIVE', 'MONITORING', 'RESPONDING', 'SAFE', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "confirmedReports" INTEGER NOT NULL DEFAULT 0,
    "falseReports" INTEGER NOT NULL DEFAULT 0,
    "verifiedReports" INTEGER NOT NULL DEFAULT 0,
    "evidenceUploads" INTEGER NOT NULL DEFAULT 0,
    "preferredArea" TEXT,
    "preferredLocalGovernment" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "channel" TEXT,
    "videoUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "IncidentType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "area" TEXT,
    "localGovernment" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "threatScore" INTEGER NOT NULL DEFAULT 0,
    "threatLevel" "ThreatLevel" NOT NULL DEFAULT 'LOW',
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "incidentId" TEXT,
    "emergencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confirmation" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "userId" TEXT,
    "vote" "ConfirmationVote" NOT NULL DEFAULT 'CONFIRM',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "relation" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "videoUrl" TEXT,
    "message" TEXT,
    "status" "SOSStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianTimelineEvent" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "GuardianSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "guardianModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "batteryLevel" INTEGER,
    "networkStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianLocation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianSessionTimeline" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianSessionTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyEvidence" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "EvidenceCaptureType" NOT NULL,
    "fileUrl" TEXT,
    "publicId" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "batteryLevel" INTEGER,
    "networkStatus" TEXT,
    "mode" TEXT,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianInvitation" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "receiverPhone" TEXT NOT NULL,
    "receiverName" TEXT,
    "relation" TEXT,
    "status" "GuardianInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianAcknowledgement" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyResponder" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guardianContactId" TEXT,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT,
    "status" "EmergencyResponderStatus" NOT NULL DEFAULT 'NOTIFIED',
    "viewedAt" TIMESTAMP(3),
    "respondingAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyResponder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "batteryLevel" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "destination" TEXT NOT NULL,
    "startAddress" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "SafeJourneyStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeJourneyTimeline" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeJourneyTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeJourneyLocation" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeJourneyLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "pushStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "pushAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "pushSentAt" TIMESTAMP(3),
    "incidentId" TEXT,
    "journeyId" TEXT,
    "emergencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "battery" INTEGER,
    "network" TEXT,
    "guardianMode" BOOLEAN NOT NULL DEFAULT false,
    "silentSOS" BOOLEAN NOT NULL DEFAULT false,
    "safeJourney" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guardianSessionId" TEXT,
    "ownsGuardianSession" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmergencySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyTimeline" (
    "id" TEXT NOT NULL,
    "emergencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Evidence_incidentId_idx" ON "Evidence"("incidentId");

-- CreateIndex
CREATE INDEX "Evidence_emergencyId_idx" ON "Evidence"("emergencyId");

-- CreateIndex
CREATE INDEX "Confirmation_incidentId_idx" ON "Confirmation"("incidentId");

-- CreateIndex
CREATE INDEX "Confirmation_userId_idx" ON "Confirmation"("userId");

-- CreateIndex
CREATE INDEX "OtpCode_phone_idx" ON "OtpCode"("phone");

-- CreateIndex
CREATE INDEX "GuardianTimelineEvent_alertId_idx" ON "GuardianTimelineEvent"("alertId");

-- CreateIndex
CREATE INDEX "GuardianLocation_sessionId_idx" ON "GuardianLocation"("sessionId");

-- CreateIndex
CREATE INDEX "GuardianSessionTimeline_sessionId_idx" ON "GuardianSessionTimeline"("sessionId");

-- CreateIndex
CREATE INDEX "EmergencyEvidence_sessionId_idx" ON "EmergencyEvidence"("sessionId");

-- CreateIndex
CREATE INDEX "GuardianInvitation_senderId_idx" ON "GuardianInvitation"("senderId");

-- CreateIndex
CREATE INDEX "GuardianInvitation_receiverId_idx" ON "GuardianInvitation"("receiverId");

-- CreateIndex
CREATE INDEX "GuardianInvitation_receiverPhone_idx" ON "GuardianInvitation"("receiverPhone");

-- CreateIndex
CREATE INDEX "GuardianInvitation_status_idx" ON "GuardianInvitation"("status");

-- CreateIndex
CREATE INDEX "GuardianAcknowledgement_sessionId_idx" ON "GuardianAcknowledgement"("sessionId");

-- CreateIndex
CREATE INDEX "EmergencyResponder_sessionId_idx" ON "EmergencyResponder"("sessionId");

-- CreateIndex
CREATE INDEX "EmergencyResponder_guardianContactId_idx" ON "EmergencyResponder"("guardianContactId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyResponder_sessionId_guardianContactId_key" ON "EmergencyResponder"("sessionId", "guardianContactId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedLocation_userId_key" ON "SharedLocation"("userId");

-- CreateIndex
CREATE INDEX "SafeJourneyTimeline_journeyId_idx" ON "SafeJourneyTimeline"("journeyId");

-- CreateIndex
CREATE INDEX "SafeJourneyLocation_journeyId_idx" ON "SafeJourneyLocation"("journeyId");

-- CreateIndex
CREATE INDEX "SafeJourneyLocation_createdAt_idx" ON "SafeJourneyLocation"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_emergencyId_channel_key" ON "Notification"("userId", "emergencyId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE INDEX "EmergencyTimeline_emergencyId_idx" ON "EmergencyTimeline"("emergencyId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES "EmergencySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianContact" ADD CONSTRAINT "GuardianContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSAlert" ADD CONSTRAINT "SOSAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianTimelineEvent" ADD CONSTRAINT "GuardianTimelineEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SOSAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianSession" ADD CONSTRAINT "GuardianSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLocation" ADD CONSTRAINT "GuardianLocation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GuardianSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianSessionTimeline" ADD CONSTRAINT "GuardianSessionTimeline_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GuardianSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyEvidence" ADD CONSTRAINT "EmergencyEvidence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GuardianSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianInvitation" ADD CONSTRAINT "GuardianInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianInvitation" ADD CONSTRAINT "GuardianInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianAcknowledgement" ADD CONSTRAINT "GuardianAcknowledgement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GuardianSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyResponder" ADD CONSTRAINT "EmergencyResponder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GuardianSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedLocation" ADD CONSTRAINT "SharedLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeJourney" ADD CONSTRAINT "SafeJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeJourneyTimeline" ADD CONSTRAINT "SafeJourneyTimeline_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SafeJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeJourneyLocation" ADD CONSTRAINT "SafeJourneyLocation_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SafeJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySession" ADD CONSTRAINT "EmergencySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySession" ADD CONSTRAINT "EmergencySession_guardianSessionId_fkey" FOREIGN KEY ("guardianSessionId") REFERENCES "GuardianSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyTimeline" ADD CONSTRAINT "EmergencyTimeline_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES "EmergencySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prevent multiple active Guardian Sessions for the same user.
CREATE UNIQUE INDEX IF NOT EXISTS "GuardianSession_one_active_per_user"
ON "GuardianSession" ("userId")
WHERE "status" = 'ACTIVE' AND "userId" IS NOT NULL;