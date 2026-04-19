"use client";

import React from "react";

export default function OMRTemplate() {
  const handlePrint = () => {
    window.print();
  };

  // Gerar 20 questões, cada uma com 5 opções (A, B, C, D, E)
  const questions = Array.from({ length: 20 }, (_, i) => i + 1);
  const options = ["A", "B", "C", "D", "E"];

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-8 print:py-0 print:bg-white">
      {/* Botões de Ação - Escondidos na Impressão */}
      <div className="mb-6 flex gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold shadow hover:bg-blue-700 transition"
        >
          Imprimir / Salvar PDF
        </button>
        <a
          href="/"
          className="bg-gray-600 text-white px-6 py-2 rounded-md font-semibold shadow hover:bg-gray-700 transition flex items-center"
        >
          Voltar
        </a>
      </div>

      {/* Página A4 do Gabarito */}
      <div className="bg-white w-[210mm] h-[297mm] shadow-2xl relative p-12 print:shadow-none print:w-auto print:h-auto print:m-0 print:p-8 box-border text-black">
        
        {/* Marcadores Fiduciais (Fiducial Marks) para o OpenCV achar os 4 cantos */}
        <div className="absolute top-8 left-8 w-10 h-10 bg-black border-4 border-black"></div>
        <div className="absolute top-8 right-8 w-10 h-10 bg-black border-4 border-black"></div>
        <div className="absolute bottom-8 left-8 w-10 h-10 bg-black border-4 border-black"></div>
        <div className="absolute bottom-8 right-8 w-10 h-10 bg-black border-4 border-black"></div>

        {/* Cabeçalho */}
        <div className="mt-8 mb-12 text-center border-b-2 border-black pb-6 px-12">
          <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Gabarito Oficial</h1>
          <p className="text-sm text-gray-600 mb-6">Preencha a bolinha completamente com caneta preta ou azul.</p>
          
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center">
              <span className="font-bold w-32">Nome:</span>
              <div className="border-b border-black flex-1 h-6"></div>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center flex-1">
                <span className="font-bold w-32">Matrícula:</span>
                <div className="border-b border-black flex-1 h-6"></div>
              </div>
              <div className="flex items-center flex-1">
                <span className="font-bold w-16">Data:</span>
                <div className="border-b border-black flex-1 h-6"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo do Gabarito: Grid de Questões */}
        <div className="px-12 grid grid-cols-2 gap-x-24 gap-y-6">
          {questions.map((q) => (
            <div key={q} className="flex items-center justify-between">
              <span className="font-bold text-lg w-8 text-right mr-4">{q}.</span>
              <div className="flex gap-4">
                {options.map((opt) => (
                  <div
                    key={`${q}-${opt}`}
                    className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-semibold text-sm"
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Instruções no Rodapé */}
        <div className="mt-12 text-center px-12 pb-4">
          <p className="text-xs font-bold uppercase">Atenção</p>
          <p className="text-xs">Não amasse, não dobre e não rasure esta folha.</p>
          <p className="text-xs">A leitura é feita de forma automatizada por inteligência artificial.</p>
        </div>

      </div>
    </div>
  );
}
