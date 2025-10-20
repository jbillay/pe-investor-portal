-- CreateEnum
CREATE TYPE "public"."PluginStatus" AS ENUM ('UPLOADED', 'INSTALLED', 'FAILED', 'UNINSTALLED');

-- CreateTable
CREATE TABLE "public"."plugins" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "license" TEXT,
    "status" "public"."PluginStatus" NOT NULL DEFAULT 'UPLOADED',
    "manifest" JSONB NOT NULL,
    "filePath" TEXT NOT NULL,
    "zipPath" TEXT,
    "installedAt" TIMESTAMP(3),
    "installedBy" TEXT,
    "uninstalledAt" TIMESTAMP(3),
    "uninstalledBy" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plugins_pluginId_key" ON "public"."plugins"("pluginId");

-- CreateIndex
CREATE INDEX "plugins_pluginId_idx" ON "public"."plugins"("pluginId");

-- CreateIndex
CREATE INDEX "plugins_status_idx" ON "public"."plugins"("status");

-- CreateIndex
CREATE INDEX "plugins_installedBy_idx" ON "public"."plugins"("installedBy");

-- AddForeignKey
ALTER TABLE "public"."plugins" ADD CONSTRAINT "plugins_installedBy_fkey" FOREIGN KEY ("installedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plugins" ADD CONSTRAINT "plugins_uninstalledBy_fkey" FOREIGN KEY ("uninstalledBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
