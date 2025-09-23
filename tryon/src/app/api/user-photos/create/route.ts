import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../prisma";
import { z } from "zod";

const createUserPhotoSchema = z.object({
  fileUrl: z.string().url(),
  profileType: z.enum(["front", "left", "right", "back"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserPhotoSchema.parse(body);

    // Create UserPhoto record in database
    const userPhoto = await prisma.userPhoto.create({
      data: {
        userId: session.user.id,
        photoUrl: validatedData.fileUrl,
        profiletype: validatedData.profileType,
      },
    });

    return NextResponse.json({
      success: true,
      userPhotoId: userPhoto.id,
      message: "User photo record created successfully"
    });

  } catch (error) {
    console.error("Failed to create user photo record:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user photo record" },
      { status: 500 }
    );
  }
}