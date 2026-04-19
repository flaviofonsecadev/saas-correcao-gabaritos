"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [answerKey, setAnswerKey] = useState<string>('{"1":"A", "2":"B", "3":"C", "4":"D", "5":"A"}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Por favor, selecione uma imagem do gabarito.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("answer_key", answerKey);

    try {
      // Usando localhost porta 8000 (onde o FastAPI vai rodar)
      const res = await fetch("http://localhost:8000/api/grade", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Erro ao processar imagem");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      alert(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          SaaS - Correção de Gabaritos
        </h1>
        
        <div className="flex justify-center gap-4 mb-6">
          <a 
            href="/dashboard" 
            className="text-white bg-gray-800 hover:bg-gray-900 font-semibold px-4 py-2 rounded-md shadow transition-colors flex items-center gap-2"
          >
            🏠 Ir para o Dashboard
          </a>
          <a 
            href="/template" 
            className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-md transition-colors"
          >
            🖨️ Baixar Template em PDF
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gabarito Oficial (JSON)
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: {"{ \"Questão\": \"Alternativa\" }"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload da Imagem do Aluno (Foto ou Scanner)
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3 px-4 rounded-md transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? "Processando Imagem com OpenCV..." : "Corrigir Prova"}
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-md">
            <h2 className="text-xl font-bold text-green-800 mb-4">Resultado da Correção</h2>
            <p className="text-lg">Nota: <span className="font-bold">{result.resultado.percentage}%</span></p>
            <p>Acertos: {result.resultado.score} / {result.resultado.total}</p>
            
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-4">Correção por Questão:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.resultado.details).map(([q, detail]: [string, any]) => (
                  <div key={q} className={`p-3 rounded-md border flex justify-between items-center ${detail.is_correct ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                    <span className="font-bold w-8">{q}.</span>
                    <div className="flex-1 flex justify-center gap-4 text-sm">
                      <span className="text-gray-600">Oficial: <strong className="text-black">{detail.correct}</strong></span>
                      <span className="text-gray-600">Marcada: <strong className="text-black">{detail.marked}</strong></span>
                    </div>
                    <span className="w-8 text-right text-lg">
                      {detail.is_correct ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
