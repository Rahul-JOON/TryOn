import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

const rollbackSchema = z.object({
  fileUrl: z.string().url(),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = rollbackSchema.parse(body);

    // Extract file key from URL for deletion
    const fileKey = validatedData.fileUrl.split('/').pop();

    if (!fileKey) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Delete file from uploadthing
    const utapi = new UTApi();
    await utapi.deleteFiles([fileKey]);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (error) {
    console.error("Failed to delete file:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}