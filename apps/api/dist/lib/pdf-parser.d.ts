/**
 * PDF parsing utility that avoids startup file loading issues
 * Uses dynamic import to prevent pdf-parse from trying to load test files during startup
 */
export interface PDFParseResult {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
}
export declare function parsePDF(buffer: Buffer): Promise<PDFParseResult>;
export declare function extractTextFromPDF(buffer: Buffer): Promise<string>;
//# sourceMappingURL=pdf-parser.d.ts.map