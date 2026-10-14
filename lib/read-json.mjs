export class BodyInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export async function readJsonBody(request, maxBytes = 12000) {
  const type = request.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(type)) {
    throw new BodyInputError("Le contenu doit être JSON.", 415);
  }
  const provided = request.headers.get("content-length");
  if (provided !== null && (!/^\d+$/.test(provided) || Number(provided) > maxBytes)) {
    throw new BodyInputError("Demande trop volumineuse.", 413);
  }
  if (!request.body) throw new BodyInputError("Corps de demande manquant.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new BodyInputError("Demande trop volumineuse.", 413);
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Not an object");
    return data;
  } catch (error) {
    if (error instanceof BodyInputError) {
      await reader.cancel().catch(() => {});
      throw error;
    }
    throw new BodyInputError("Format JSON invalide.");
  } finally {
    reader.releaseLock();
  }
}
export function bodyFailure(error) {
  return { message: error instanceof BodyInputError ? error.message : "Requête invalide.", status: error instanceof BodyInputError ? error.status : 400 };
}
