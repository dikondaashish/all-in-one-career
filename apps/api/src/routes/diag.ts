import { Router } from 'express';
import fs from 'fs/promises';

const router: Router = Router();

export async function atsDiagHandler(req: any, res: any) {
  try {
    const tmpDir = process.env.RENDER ? "/opt/render/project/tmp" : require('os').tmpdir();
    const tmpTest = tmpDir + "/_writetest.txt";
    let tmpOk = false;
    
    try {
      // Ensure tmp directory exists first
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.writeFile(tmpTest, "ok");
      const tmpContent = await fs.readFile(tmpTest, "utf8");
      tmpOk = tmpContent === "ok";
      await fs.unlink(tmpTest).catch(() => {}); // cleanup
    } catch (tmpErr: any) {
      console.warn("tmp test failed:", tmpErr?.message);
      tmpOk = false;
    }

    // Read package.json for dependency versions
    let versions = {};
    try {
      const pkgPath = process.cwd() + '/package.json';
      const pkgContent = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgContent);
      versions = {
        pdfjs: pkg.dependencies?.["pdfjs-dist"] ?? "n/a",
        pdfparse: pkg.dependencies?.["pdf-parse"] ?? "n/a",
        formidable: pkg.dependencies?.["formidable"] ?? "n/a",
        mammoth: pkg.dependencies?.["mammoth"] ?? "n/a",
      };
    } catch {
      versions = { error: "could not read package.json" };
    }

    res.json({
      ok: true,
      node: process.version,
      render: !!process.env.RENDER,
      tmpWrite: tmpOk,
      tmpDir: process.env.RENDER ? "/opt/render/project/tmp" : require('os').tmpdir(),
      versions,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, err: e?.message });
  }
}

router.get('/_diag', atsDiagHandler);

export default router;
