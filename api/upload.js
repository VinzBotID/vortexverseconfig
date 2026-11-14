import crypto from "node:crypto";

import {
  readManifest,
  writeManifest,
  saveBlob,
  cleanFileName,
  isAdmin,
  json,
  errorMessage
} from "./_lib.js";

export const config = {
  runtime: "nodejs"
};

const MAX_CONFIG_SIZE = 3 * 1024 * 1024;
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

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
    const form = await request.formData();

    const title = String(
      form.get("title") || ""
    ).trim();

    const file = form.get("file");
    const image = form.get("image");

    if (!title) {
      return json({
        error: "Nama config wajib diisi."
      }, 400);
    }

    if (
      !file ||
      typeof file.arrayBuffer !== "function" ||
      file.size < 1
    ) {
      return json({
        error: "File config wajib dipilih."
      }, 400);
    }

    if (file.size > MAX_CONFIG_SIZE) {
      return json({
        error: "Ukuran config maksimal 3 MB."
      }, 400);
    }

    if (
      image &&
      typeof image.arrayBuffer === "function" &&
      image.size > 0
    ) {
      if (!String(image.type).startsWith("image/")) {
        return json({
          error: "Thumbnail harus berupa file gambar."
        }, 400);
      }

      if (image.size > MAX_IMAGE_SIZE) {
        return json({
          error: "Ukuran thumbnail maksimal 1 MB."
        }, 400);
      }
    }

    const id = crypto.randomUUID();

    const fileName = cleanFileName(file.name);

    const fileBlob = await saveBlob(
      `vortex-config/files/${id}-${fileName}`,
      await file.arrayBuffer(),
      file.type || "application/octet-stream"
    );

    let imageUrl = null;

    if (
      image &&
      typeof image.arrayBuffer === "function" &&
      image.size > 0
    ) {
      const ext = (image.name || "image")
        .split(".")
        .pop()
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 8) || "img";

      const imageBlob = await saveBlob(
        `vortex-config/images/${id}.${ext}`,
        await image.arrayBuffer(),
        image.type
      );

      imageUrl = imageBlob.url;
    }

    const items = await readManifest();

    const newItem = {
      id,
      title: title.slice(0, 80),
      fileName,
      fileUrl: fileBlob.url,
      imageUrl,
      createdAt: new Date().toISOString()
    };

    items.unshift(newItem);

    await writeManifest(items);

    return json({
      success: true,
      item: newItem
    });

  } catch (error) {
    return json({
      error: errorMessage(error)
    }, 500);
  }
}
