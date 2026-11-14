import {
  createSessionToken,
  sessionCookie,
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

  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return json({
        error: "ADMIN_PASSWORD belum diatur."
      }, 500);
    }

    if (
      typeof password !== "string" ||
      password !== adminPassword
    ) {
      return json({
        error: "Password admin salah."
      }, 401);
    }

    const token = createSessionToken();

    return json({
      success: true
    }, 200, {
      "Set-Cookie": sessionCookie(token)
    });

  } catch {
    return json({
      error: "Data login tidak valid."
    }, 400);
  }
}
