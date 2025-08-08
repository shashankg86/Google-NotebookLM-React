import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export default async function parsePdfToChunks(file: File){
  // Parse PDF pages -> return chunks: [{id, page, text}]
  const array = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: array }).promise
  const num = pdf.numPages
  const chunks:any[] = []
  for(let i=1;i<=num;i++){
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const strings = (content.items || []).map((it:any)=> it.str || '')
    const text = strings.join(' ').replace(/\s+/g,' ').trim()
    chunks.push({ id: `${i}`, page: i, text })
  }
  return chunks
}
