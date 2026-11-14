import {
  clearSessionCookie,
  json
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

  return json({
    success: true
  }, 200, {
    "Set-Cookie": clearSessionCookie()
  });
}
