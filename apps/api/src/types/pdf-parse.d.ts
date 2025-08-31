declare module 'pdf-parse' {
  export interface PDFParseResult {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }

  function pdfParse(buffer: Buffer): Promise<PDFParseResult>;
  export = pdfParse;
}
