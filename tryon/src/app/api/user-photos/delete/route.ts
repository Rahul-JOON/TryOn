import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../prisma";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

const deletePhotoSchema = z.object({
  photoId: z.number(),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = deletePhotoSchema.parse(body);

    // Get the photo to verify ownership and get file URL
    const photo = await prisma.userPhoto.findUnique({
      where: {
        id: validatedData.photoId,
        userId: session.user.id, // Ensure user owns the photo
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Extract file key from URL for deletion
    const fileKey = photo.photoUrl.split('/').pop();

    // Delete from database and uploadthing in sequence
    await prisma.userPhoto.delete({
      where: { id: validatedData.photoId },
    });

    // Delete file from uploadthing
    if (fileKey) {
      try {
        const utapi = new UTApi();
        await utapi.deleteFiles([fileKey]);
      } catch (error) {
        console.error('Failed to delete file from uploadthing:', error);
        // Don't fail the request if file deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully"
    });

  } catch (error) {
    console.error("Failed to delete photo:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}