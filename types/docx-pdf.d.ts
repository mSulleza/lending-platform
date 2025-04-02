declare module 'docx-pdf' {
  function docxToPdf(
    input: string,
    output: string,
    callback: (err: Error | null) => void
  ): void;
  export default docxToPdf;
} 