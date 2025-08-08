import React from 'react'

export default function LandingPage({ onFileSelect }:{ onFileSelect:(f:File)=>void }){
  const handleFile = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0]; if(f) onFileSelect(f)
  }
  const handleDrop = (e:React.DragEvent<HTMLDivElement>)=>{
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]; if(f) onFileSelect(f)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Upload PDF to start chatting</h1>
            <p className="mt-2 text-gray-500">Drop your document here or click <span className="font-medium">Select PDF</span> to begin.</p>
            <div className="mt-6">
              <label className="inline-flex items-center px-4 py-2 bg-brand-500 text-white rounded cursor-pointer">
                Select PDF
                <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
              </label>
            </div>
          </div>
          <div className="w-40 h-40 bg-brand-50 rounded-md flex items-center justify-center border border-dashed">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v12" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7l4-4 4 4" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div onDragOver={(e)=> e.preventDefault()} onDrop={handleDrop} className="mt-6 p-4 border border-dashed rounded text-center text-sm text-gray-400">
          Drag & drop PDF here (or use Select PDF)
        </div>
        <p className="mt-4 text-xs text-gray-400">This demo runs completely locally and is free to use.</p>
      </div>
    </div>
  )
}
