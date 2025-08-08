import React, { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";

interface Chunk {
  page: number;
  text: string;
}

interface Citation {
  page: number;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
}

interface ChatPanelProps {
  chunks: Chunk[];
  viewerApi: {
    scrollToPage: (page: number) => void;
  };
  documentReady: boolean;
}

function splitIntoSubchunks(text: string, page: number, maxChars = 800) {
  const out: { page: number; text: string }[] = [];
  if (!text || text.trim().length === 0) return out;
  const sentences = text.split(/(?<=[.?!])\s+/);
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > maxChars) {
      out.push({ page, text: cur.trim() });
      cur = s;
    } else {
      cur = (cur + " " + s).trim();
    }
  }
  if (cur.trim().length > 0) out.push({ page, text: cur.trim() });
  return out;
}

export default function ChatPanel({ chunks, viewerApi, documentReady }: ChatPanelProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexReady, setIndexReady] = useState(false);

  const subchunks = useMemo(() => {
    const list: { page: number; text: string }[] = [];
    for (const c of chunks) {
      const pieces = splitIntoSubchunks(c.text, c.page, 900);
      if (pieces.length > 0) list.push(...pieces);
      else list.push({ page: c.page, text: (c.text || "").slice(0, 900) });
    }
    return list;
  }, [chunks]);

  const fuse = useMemo(() => {
    if (subchunks.length === 0) return null;
    const f = new Fuse(subchunks, {
      keys: ["text"],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      useExtendedSearch: false,
    });
    return f;
  }, [subchunks]);

  useEffect(() => {
    setIndexReady(!!fuse);
  }, [fuse]);

  async function retrieveTopChunks(q: string, topK = 3) {
    if (!fuse) return [];
    const res = fuse.search(q, { limit: topK });
    return res.map(r => ({ page: r.item.page, text: r.item.text, score: r.score ?? 1 }));
  }

  console.log("OpenRouter key from env:", import.meta.env.VITE_OPENROUTER_KEY);

  async function callOpenRouter(contextText: string, question: string) {
    const key = import.meta.env.VITE_OPENROUTER_KEY;
    if (!key) throw new Error("Missing VITE_OPENROUTER_KEY in env");
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    const body = {
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Answer concisely using only the provided context. If the context doesn't contain the answer, say you couldn't find it."
        },
        {
          role: "user",
          content: `Context:\n${contextText}\n\nQuestion: ${question}`
        }
      ],

      temperature: 0.0,
      max_tokens: 400
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const data = await res.json();

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.result ??
      data?.output?.[0]?.content ??
      JSON.stringify(data);
    return content;
  }

  // Main ask handler (retrieve -> call LLM -> show)
  async function handleAsk() {
    if (!query || !indexReady) return;
    setLoading(true);

    try {
      const top = await retrieveTopChunks(query, 4);
      if (top.length === 0) {

        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: "No relevant content found.", citations: [] }]);
        setQuery("");
        setLoading(false);
        return;
      }

      const context = top.map(t => `Page ${t.page}: ${t.text}`).join("\n\n---\n\n");

      const answer = await callOpenRouter(context, query);

      const citationPages = Array.from(new Set(top.map(t => t.page))); // unique pages
      setMessages(prev => [
        ...prev,
        { role: "user", text: query },
        { role: "assistant", text: answer.trim(), citations: citationPages.map(p => ({ page: p })) }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: "Error: could not contact AI service." }]);
    } finally {
      setQuery("");
      setLoading(false);
    }
  }

  function goToPage(p: number) {
    viewerApi.scrollToPage(p);
  }

  return (
    <div>
      {documentReady && messages.length === 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded p-4 text-purple-800 text-sm mb-4">
          <p className="font-medium mb-2">📄 Your document is ready!</p>
          <p>You can now ask questions about your document. For example:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>"What is the main topic of this document?"</li>
            <li>"Can you summarize the key points?"</li>
            <li>"What are the conclusions or recommendations?"</li>
          </ul>
        </div>
      )}

      <div className="mb-3">
        <label className="block mb-1 font-medium">Ask about the document</label>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder={indexReady ? "Type a question or keyword" : "Building index..."}
            disabled={!indexReady || loading}
          />
          <button
            onClick={handleAsk}
            disabled={!indexReady || loading}
            className="px-4 py-2 bg-brand-500 text-white rounded"
          >
            {loading ? "Searching..." : "Ask"}
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-auto p-2 border rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className="inline-block p-2 rounded bg-gray-100 whitespace-pre-line">{m.text}</div>
            {m.citations && m.citations.length > 0 && (
              <div className="mt-1 flex gap-2">
                {m.citations.map((c, idx) => (
                  <button key={idx} onClick={() => goToPage(c.page)} className="text-sm underline text-sky-600">
                    Go to page {c.page}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
