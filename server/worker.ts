import html from "../dist/workspace.html";
import { handleRequest } from "./http.js";

interface Env { UI_DOMAIN?: string; ALLOWED_ORIGINS?: string }
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, {
      html, uiDomain: env.UI_DOMAIN,
      allowedOrigins: (env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
    });
  },
};
