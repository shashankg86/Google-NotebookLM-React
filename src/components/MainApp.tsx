import React, { useEffect, useRef, useState } from 'react'
import PDFViewer from './pdf/PDFViewer'
import ChatPanel from './ChatPanel'
import parsePdfToChunks from './pdf/parse'

export default function MainApp({ file, onBack }: { file: File, onBack: () => void }) {
  const [chunks, setChunks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      setLoading(true)
      const cs = await parsePdfToChunks(file)
      if (mounted) {
        setChunks(cs)
        setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [file])

  return (
    <div className="min-h-screen">
      <header className="header">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-sm text-gray-600">← Back</button>
            <h2 className="font-semibold">NotebookLM Clone</h2>
          </div>
          <div className="text-sm text-gray-500">Free demo — local only</div>
        </div>
      </header>

      <main className="container py-6 grid grid-cols-12 gap-6">
        <div className="col-span-7 bg-white p-4 rounded shadow">
          {loading ? (
            <div className="flex items-center justify-center h-96"><div className="text-gray-500">Processing PDF...</div></div>
          ) : (
            <PDFViewer file={file} ref={viewerRef} />
          )}
        </div>

        <div className="col-span-5 bg-white p-4 rounded shadow">
          <ChatPanel chunks={chunks}
            documentReady={!loading && chunks.length > 0}
            viewerApi={{
              scrollToPage: (p: number) => {
                window.dispatchEvent(new CustomEvent('scroll-to-page', { detail: p }))
              }
            }} />
        </div>
      </main>
    </div>
  )
}
