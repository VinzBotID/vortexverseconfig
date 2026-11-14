import {
  isAdmin,
  json
} from "./_lib.js";

export const config = {
  runtime: "nodejs"
};

export default async function handler(request) {
  return json({
    authenticated: isAdmin(request)
  });
}
