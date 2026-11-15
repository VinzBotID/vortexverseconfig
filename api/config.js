import {
  readManifest,
  json,
  errorMessage
} from "./_lib.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler() {
  try {
    const items = await readManifest();

    const publicItems = items.map(({
      id,
      title,
      category,
      fileName,
      fileUrl,
      imageUrl,
      createdAt
    }) => ({
      id,
      title,
      category: category || "lainnya",
      fileName,
      fileUrl,
      imageUrl,
      createdAt
    }));

    return json({
      items: publicItems
    });

  } catch (error) {
    return json({
      error: errorMessage(error)
    }, 500);
  }
}
