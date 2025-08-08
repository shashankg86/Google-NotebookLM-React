import React, { useState } from 'react'
import LandingPage from './components/LandingPage'
import MainApp from './components/MainApp'

export default function App(){
  const [file, setFile] = useState<File | null>(null)
  return (
    <>
      {!file ? (
        <LandingPage onFileSelect={(f)=> setFile(f)} />
      ) : (
        <MainApp file={file} onBack={()=> setFile(null)} />
      )}
    </>
  )
}
