Cursor Task — Kill the PDF 500s on /api/ats/upload-resume (Render)

You’re acting as a senior backend engineer. DOC/DOCX/TXT are OK. PDFs still 500 on POST /api/ats/upload-resume. We need deterministic parsing, actionable 4xx errors (not 500), and a clean Render boot.

Below is a phased plan with why / what / where / when, exact code patches, and deploy steps.

Phase 0 — Repro & guardrails (Why/What)

Why: We’re seeing a generic 500 (Internal Server Error). We need precise logs at each step to pinpoint which edge case throws (formidable parse, tmp path, buffer read, pdf parse).

What to do now (before code):

Confirm the request hits POST /api/ats/upload-resume (same path as FE).

Confirm the FE sends the file field name you expect (resume).

Phase 1 — Instrumentation (Where/When)

Where: apps/api/src/routes/ats.ts (or the file implementing /api/ats/upload-resume).

When: First thing in the handler, and around every async step (parse → read buffer → parse PDF → respond).

Add temporary logs (remove after success):

// At very top of the handler:
console.info("ats:upload-resume:start", { method: req.method, url: req.url });

// After formidable.parse result:
console.info("ats:upload-resume:parsed", {
  fieldsCount: Object.keys(fields || {}).length,
  filesKeys: Object.keys(files || {}),
  resumeCount: (files as any)?.resume?.length,
  fileKeys: (files as any)?.file?.length,
});

// Before reading file buffer:
console.info("ats:upload-resume:filemeta", {
  name: uploadFile?.originalFilename,
  mime: uploadFile?.mimetype,
  size: uploadFile?.size,
  filepath: uploadFile?.filepath
});

// After buffer read:
console.info("ats:upload-resume:buffer", { bytes: buf?.length || 0 });

// Around PDF parse:
console.time("ats:pdf:extract");
const pdfResult = await extractPdfText(buf);
console.timeEnd("ats:pdf:extract");
console.info("ats:pdf:result", {
  textLen: pdfResult?.text?.length || 0,
  pages: pdfResult?.numPages,
  scanned: pdfResult?.isLikelyScanned
});

// In catch:
console.error("ats:upload-resume:ERROR", {
  err: e?.message, stack: e?.stack
});

Phase 2 — Make the upload path bulletproof (What/Where/Why)

Why: On Render, temp paths and Formidable config are common 500 sources. Also, field names often mismatch.

Where: apps/api/src/routes/ats.ts (or your actual route).

What to implement:

Explicit tmp directory for Render: /opt/render/project/tmp

Allow application/pdf in the filter.

Normalize file field name (accept resume, file, or upload).

Promise-safe parse (no callback confusion).

Return structured 4xx; reserve 500 for true crashes.

import path from "path";
import os from "os";
import fs from "fs/promises";
import formidable from "formidable";
import { extractPdfText } from "../../lib/pdf-parser"; // adjust path

const TMP_DIR = process.env.RENDER ? "/opt/render/project/tmp" : os.tmpdir();

export async function uploadResumeHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  console.info("ats:upload-resume:start", { method: req.method, url: req.url });

  try {
    const form = formidable({
      uploadDir: TMP_DIR,
      keepExtensions: true,
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) =>
        mimetype === "application/pdf" ||
        mimetype === "application/msword" ||
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "text/plain",
    });

    // Formidable v3 returns [fields, files] — keep it consistent.
    const [fields, files] = await form.parse(req);
    console.info("ats:upload-resume:parsed", {
      fieldsCount: Object.keys(fields || {}).length,
      filesKeys: Object.keys(files || {}),
      resumeCount: (files as any)?.resume?.length,
      fileCount: (files as any)?.file?.length,
      uploadCount: (files as any)?.upload?.length,
    });

    const uploadFile =
      (files as any)?.resume?.[0] ||
      (files as any)?.file?.[0] ||
      (files as any)?.upload?.[0];

    if (!uploadFile) {
      return res.status(400).json({ success: false, error: "no_file_uploaded" });
    }

    const mime = uploadFile.mimetype || "application/octet-stream";
    const filePath = uploadFile.filepath;
    console.info("ats:upload-resume:filemeta", {
      name: uploadFile.originalFilename, mime, size: uploadFile.size, filePath
    });

    const buf = await fs.readFile(filePath);
    console.info("ats:upload-resume:buffer", { bytes: buf?.length || 0 });

    let extractedText = "";

    if (mime === "application/pdf") {
      try {
        console.time("ats:pdf:extract");
        const { text, isLikelyScanned, numPages } = await extractPdfText(buf);
        console.timeEnd("ats:pdf:extract");
        console.info("ats:pdf:result", {
          textLen: text?.length || 0,
          pages: numPages,
          scanned: isLikelyScanned
        });

        if (!text) {
          return res.status(422).json({
            success: false,
            error: "pdf_no_extractable_text",
            hint: isLikelyScanned ? "image_pdf_try_ocr" : "unknown_pdf_issue",
          });
        }

        extractedText = text;
      } catch (e:any) {
        console.error("ats:pdf:parse_throw", { err: e?.message, stack: e?.stack });
        return res.status(415).json({ success: false, error: "pdf_parse_unsupported" });
      }
    } else if (
      mime === "application/msword" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const r = await mammoth.extractRawText({ buffer: buf });
      extractedText = (r.value || "").trim();
    } else if (mime === "text/plain") {
      extractedText = buf.toString("utf8");
    } else {
      return res.status(415).json({ success: false, error: "unsupported_type" });
    }

    // (Optional) cleanup — formidable removes tmp on its own; explicit unlink is optional.
    // await fs.unlink(filePath).catch(() => {}); 

    return res.status(200).json({
      success: true,
      text: extractedText,
      filename: uploadFile.originalFilename || "resume",
      fileUrl: undefined,
    });
  } catch (e:any) {
    console.error("ats:upload-resume:ERROR", { err: e?.message, stack: e?.stack });
    return res.status(500).json({ success: false, error: "server_pdf_parse_failed" });
  }
}


When to do it: now—this is the most likely source of 500s (tmp path + parse pipeline + MIME handling).

Phase 3 — Ensure legacy pdf.js import only (Why/Where)

Why: Any accidental import of the browser build (pdfjs-dist/build/pdf.mjs) will crash Node with DOMMatrix or similar.

Where: apps/api/src/lib/pdf-parser.ts (server only)

Implement/verify:

// apps/api/src/lib/pdf-parser.ts
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfText(buffer: Buffer) {
  const task = pdfjsLib.getDocument({ data: buffer });
  const pdf = await task.promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
    text += line + "\n";
  }

  const cleaned = text.replace(/\u0000/g, "").trim();
  return {
    text: cleaned,
    numPages: pdf.numPages,
    isLikelyScanned: cleaned.length < 30 && pdf.numPages > 0,
  };
}


Search the repo for pdfjs-dist/build/pdf.mjs and replace any server usage with the legacy path above.

Phase 4 — Frontend error messages (What/Where/Why)

Why: Right now the UI collapses different server responses into a generic “Server error processing file.” We want user-actionable messages.

Where: apps/web/src/app/(authenticated)/ats-scanner/page.tsx (the upload handler)

Map errors to messages:

const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/ats/upload-resume`, { method: "POST", body: formData, credentials: "include" });
const result = await resp.json().catch(() => ({}));

if (!resp.ok) {
  let msg = "Upload failed";
  if (result?.error === "pdf_no_extractable_text") {
    msg = "This PDF has no selectable text. Upload a text-based PDF or use DOCX/TXT. If it’s scanned, try OCR.";
  } else if (result?.error === "pdf_parse_unsupported") {
    msg = "We couldn't read this PDF. Try exporting it again or upload DOCX.";
  } else if (result?.error === "unsupported_type") {
    msg = "Unsupported file type. Use PDF, DOC, DOCX, or TXT.";
  } else if (resp.status === 413) {
    msg = "File too large. Max 10MB.";
  } else if (result?.error === "no_file_uploaded") {
    msg = "No file detected. Please choose a file and try again.";
  }
  setErrors(prev => ({ ...prev, resume: msg }));
  return;
}

// success
setResumeData({ text: result.text, filename: result.filename, source: "file" });

Phase 5 — Build & Deploy (When/Where)

When: After Phases 1–4 compile locally.

Where:

Commit files:

apps/api/src/routes/ats.ts (or the upload route file)

apps/api/src/lib/pdf-parser.ts

apps/web/src/app/(authenticated)/ats-scanner/page.tsx

Push to GitHub master.

In Render (API service):

Clear Build Cache.

Redeploy & watch logs for ats:upload-resume:* lines.

Validate the service is Live (no startup crash).

Phase 6 — Post-deploy smoke tests (What/When)

Run these now (prod):

A) Text-based PDF (happy path)
BASE="https://all-in-one-career.onrender.com"
curl -i -X POST "$BASE/api/ats/upload-resume" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -F "resume=@./sample-text-based.pdf;type=application/pdf"


Expect: 200 with { success:true, text: "...", filename: ... }

B) Scanned (image-only) PDF

Expect: 422 with { error:"pdf_no_extractable_text", hint:"image_pdf_try_ocr" }
UI shows the new specific message.

C) Oversize (>10MB)

Expect: 413 (or validation 4xx). UI: “Max 10MB”.

If any request 500s, copy the single log line from Render beginning with ats:upload-resume: so we see exactly which step threw.

Phase 7 — (Optional) Fallback engine

If a subset of valid PDFs still fail in pdfjs-dist legacy, add a catch fallback to pdf-parse:

// package
// pnpm add pdf-parse -w

import pdf from "pdf-parse";

try {
  const { text, isLikelyScanned } = await extractPdfText(buf); // pdfjs legacy
  // ...
} catch (e) {
  // Fallback
  try {
    const data = await pdf(buf);
    const text = (data.text || "").trim();
    if (!text) return res.status(422).json({ success:false, error:"pdf_no_extractable_text" });
    extractedText = text;
  } catch (e2) {
    console.error("ats:pdf:fallback_pdf-parse_failed", { err: e2.message });
    return res.status(415).json({ success:false, error:"pdf_parse_unsupported" });
  }
}

Acceptance Criteria

 No 500s for user-fixable PDF issues (we return clear 4xx with messages).

 Text-based PDF gives 200 with extracted text.

 Scanned PDF gives 422 (helpful message).

 DOC/DOCX/TXT remain working.

 Render logs show which step if something fails (ats:upload-resume:*).

 No server imports of pdfjs-dist/build/pdf.mjs (only legacy/...).

Please implement all phases, push to master, clear cache, redeploy, and then ping me the result of the text-based PDF test (status + response body + one matching ats: log line).