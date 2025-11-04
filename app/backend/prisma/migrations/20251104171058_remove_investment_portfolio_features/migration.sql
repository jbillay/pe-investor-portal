/*
  Warnings:

  - You are about to drop the `capital_call_investors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `capital_calls` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `communications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `distribution_investors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `distributions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `funds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `investments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `valuations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."capital_call_investors" DROP CONSTRAINT "capital_call_investors_capitalCallId_fkey";

-- DropForeignKey
ALTER TABLE "public"."capital_call_investors" DROP CONSTRAINT "capital_call_investors_investmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."capital_calls" DROP CONSTRAINT "capital_calls_fundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."communications" DROP CONSTRAINT "communications_fundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."distribution_investors" DROP CONSTRAINT "distribution_investors_distributionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."distribution_investors" DROP CONSTRAINT "distribution_investors_investmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."distributions" DROP CONSTRAINT "distributions_fundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_capitalCallId_fkey";

-- DropForeignKey
ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_distributionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_fundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."investments" DROP CONSTRAINT "investments_fundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."investments" DROP CONSTRAINT "investments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."valuations" DROP CONSTRAINT "valuations_fundId_fkey";

-- DropTable
DROP TABLE "public"."capital_call_investors";

-- DropTable
DROP TABLE "public"."capital_calls";

-- DropTable
DROP TABLE "public"."communications";

-- DropTable
DROP TABLE "public"."distribution_investors";

-- DropTable
DROP TABLE "public"."distributions";

-- DropTable
DROP TABLE "public"."documents";

-- DropTable
DROP TABLE "public"."funds";

-- DropTable
DROP TABLE "public"."investments";

-- DropTable
DROP TABLE "public"."valuations";
