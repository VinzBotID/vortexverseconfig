import { handleUpload } from '@vercel/blob/client';
import { checkPass } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!checkPass(clientPayload)) throw new Error('Password salah');
        return { addRandomSuffix: true, maximumSizeInBytes: 200 * 1024 * 1024 };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
