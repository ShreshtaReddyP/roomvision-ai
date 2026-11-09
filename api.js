// All communication with the FastAPI backend lives in this one file.
// The backend address comes from VITE_API_BASE_URL (set at build time).

const configured = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (configured || (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = null, code = "error" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Turns "/generated/abc.png" into a full URL on the backend. */
export function resolveAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

async function send(path, { timeoutMs = 30000, signal, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError(
      "This site is not connected to its server yet. The site owner needs to set VITE_API_BASE_URL and rebuild.",
      { code: "not_configured" }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener("abort", onCallerAbort, { once: true });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: controller.signal });
  } catch (err) {
    if (signal?.aborted) throw new ApiError("Cancelled.", { code: "aborted" });
    if (controller.signal.aborted) {
      throw new ApiError(
        "The server took too long to respond. If it was asleep, give it a minute to wake up and try again.",
        { code: "timeout" }
      );
    }
    throw new ApiError("Could not reach the server. Check your internet connection and try again.", {
      code: "network",
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (Array.isArray(body?.detail)) detail = "Some of your selections were not valid. Please check them and try again.";
    } catch {
      /* response was not JSON */
    }
    throw new ApiError(detail || `The server returned an error (${response.status}). Please try again.`, {
      status: response.status,
    });
  }
  return response;
}

export async function checkHealth() {
  const response = await send("/health", { timeoutMs: 70000 }); // allows for Render cold starts
  return response.json();
}

export async function analyzeRoom(file, signal) {
  const body = new FormData();
  body.append("file", file);
  const response = await send("/analyze-room", { method: "POST", body, timeoutMs: 120000, signal });
  return response.json();
}

/** form = the object from DEFAULT_FORM. Returns the backend response with full image URLs. */
export async function generateRedesign(file, form, signal) {
  const body = new FormData();
  body.append("file", file);
  body.append("design_style", form.design_style);
  body.append("room_type", form.room_type);
  body.append("color_palette", form.color_palette);
  body.append("custom_palette", form.custom_palette || "");
  body.append("budget", form.budget);
  body.append("additional_instructions", form.additional_instructions || "");
  body.append("preserve_layout", form.preserve_layout ? "true" : "false");

  const response = await send("/generate-redesign", { method: "POST", body, timeoutMs: 240000, signal });
  const data = await response.json();
  return {
    ...data,
    image_url: resolveAssetUrl(data.image_url),
    download_url: data.download_url, // relative; resolved when downloading
  };
}

/** Fetches the generated image and saves it through the browser. */
export async function downloadImage(result) {
  const response = await send(result.download_url, { timeoutMs: 60000 });
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `roomvision-${result.filename}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
