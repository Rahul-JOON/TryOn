-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "height" TEXT,
ADD COLUMN     "shoulder" TEXT,
ADD COLUMN     "waist" TEXT;

-- CreateTable
CREATE TABLE "public"."UserPhoto" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "profiletype" TEXT,
    "isPrimary" BOOLEAN DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Platform" (
    "id" SERIAL NOT NULL,
    "platformName" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClothingCategory" (
    "id" SERIAL NOT NULL,
    "categoryType" TEXT NOT NULL,
    "parentCategoryId" INTEGER,
    "description" TEXT,

    CONSTRAINT "ClothingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClothingItem" (
    "id" SERIAL NOT NULL,
    "platformId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "productUrl" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "itemImages" JSONB,
    "scrapedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ClothingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedImage" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT,
    "clothingItemId" INTEGER,
    "userPhotoId" INTEGER,

    CONSTRAINT "GeneratedImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GenerationRequest" (
    "requestId" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "userPhotoId" INTEGER,
    "requestType" TEXT,
    "status" TEXT,
    "resultImageUrl" TEXT,
    "processingMetadata" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "processingTimeSeconds" DECIMAL(8,2),

    CONSTRAINT "GenerationRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "subscriptionId" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "planType" TEXT,
    "monthlyPrice" DECIMAL(8,2),
    "generationsLimit" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("subscriptionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_platformName_key" ON "public"."Platform"("platformName");

-- CreateIndex
CREATE UNIQUE INDEX "ClothingCategory_categoryType_key" ON "public"."ClothingCategory"("categoryType");

-- CreateIndex
CREATE UNIQUE INDEX "ClothingItem_productUrl_key" ON "public"."ClothingItem"("productUrl");

-- AddForeignKey
ALTER TABLE "public"."UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClothingCategory" ADD CONSTRAINT "ClothingCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "public"."ClothingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClothingItem" ADD CONSTRAINT "ClothingItem_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "public"."Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClothingItem" ADD CONSTRAINT "ClothingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ClothingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedImage" ADD CONSTRAINT "GeneratedImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedImage" ADD CONSTRAINT "GeneratedImage_clothingItemId_fkey" FOREIGN KEY ("clothingItemId") REFERENCES "public"."ClothingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedImage" ADD CONSTRAINT "GeneratedImage_userPhotoId_fkey" FOREIGN KEY ("userPhotoId") REFERENCES "public"."UserPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GenerationRequest" ADD CONSTRAINT "GenerationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GenerationRequest" ADD CONSTRAINT "GenerationRequest_userPhotoId_fkey" FOREIGN KEY ("userPhotoId") REFERENCES "public"."UserPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
