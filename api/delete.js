import {
  readManifest,
  writeManifest,
  deleteBlob,
  isAdmin,
  json,
  errorMessage
} from "./_lib.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({
      error: "Method tidak diizinkan."
    }, 405);
  }

  if (!isAdmin(request)) {
    return json({
      error: "Silakan login sebagai admin."
    }, 401);
  }

  try {
    const { id } = await request.json();

    if (!id || typeof id !== "string") {
      return json({
        error: "ID config tidak valid."
      }, 400);
    }

    const items = await readManifest();

    const target = items.find(
      item => item.id === id
    );

    if (!target) {
      return json({
        error: "Config tidak ditemukan."
      }, 404);
    }

    await writeManifest(
      items.filter(item => item.id !== id)
    );

    await Promise.all([
      deleteBlob(target.fileUrl),
      deleteBlob(target.imageUrl)
    ]);

    return json({
      success: true
    });

  } catch (error) {
    return json({
      error: errorMessage(error)
    }, 500);
  }
}
