export const runtime = "nodejs";

import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const channel = formData.get("channel") as string;
    const category = formData.get("category") as string;

    if (!file || !title) {
      return Response.json(
        { error: "Video file and title are required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "video",
              folder: "myogun/videos",
            },
            (error, result) => {
              if (error || !result) {
                reject(error);
              } else {
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id,
                });
              }
            }
          )
          .end(buffer);
      }
    );

    const video = await prisma.video.create({
      data: {
        title,
        description,
        channel,
        category,
        videoUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    });

    return Response.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}