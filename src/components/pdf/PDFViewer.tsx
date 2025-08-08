import React, { forwardRef, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFViewer = forwardRef(function PDFViewer({ file }:{ file:File }, ref){
  const containerRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    let mounted = true
    async function render(){
      const array = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: array }).promise
      const pages: HTMLCanvasElement[] = []
      for(let i=1;i<=pdf.numPages;i++){
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.2 })
        const canvas = document.createElement('canvas')
        canvas.id = `pdf-page-${i}`
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = '100%'
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        pages.push(canvas)
      }
      if(mounted && containerRef.current){
        containerRef.current.innerHTML = ''
        pages.forEach(p=> containerRef.current!.appendChild(p))
      }
    }
    render()
    function onScrollTo(e:any){
      const p = e.detail
      const el = document.getElementById(`pdf-page-${p}`)
      if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.addEventListener('scroll-to-page', onScrollTo)
    return ()=> { mounted=false; window.removeEventListener('scroll-to-page', onScrollTo) }
  }, [file])

  return <div ref={containerRef} style={{ maxHeight: '70vh', overflow: 'auto' }} />
})

export default PDFViewer
