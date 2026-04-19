"use client";

import { useState } from "react";
// O supabase seria importado aqui quando configurado: import { supabase } from "@/utils/supabase";

export default function PortalAluno() {
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentCode.trim()) return;

    setLoading(true);
    try {
      // Mock: Aqui nós faríamos a consulta no Supabase:
      // const { data, error } = await supabase.from('students').select('*').eq('enrollment_code', enrollmentCode).single();
      // Em seguida buscaríamos os results:
      // const { data: res } = await supabase.from('results').select('*, exams(title, subject, professors(name))').eq('student_id', data.id);

      // Dados fictícios (Mock) para demonstração de como o portal do aluno ficará
      setTimeout(() => {
        if (enrollmentCode === "12345") {
          setStudentData({
            name: "João da Silva",
            className: "8º Ano A",
            schoolName: "Colégio Estadual Central"
          });
          setResults([
            {
              id: 1,
              subject: "Matemática",
              title: "Prova Bimestral 1",
              professor: "Prof. Carlos",
              percentage: 80,
              score: 8,
              total: 10,
              date: "2024-04-10",
            },
            {
              id: 2,
              subject: "Física",
              title: "Teste de Mecânica",
              professor: "Prof. Carlos",
              percentage: 60,
              score: 3,
              total: 5,
              date: "2024-04-12",
            },
            {
              id: 3,
              subject: "História",
              title: "Prova 1 - Idade Média",
              professor: "Profa. Maria",
              percentage: 100,
              score: 10,
              total: 10,
              date: "2024-04-15",
            },
          ]);
        } else {
          alert("Código de matrícula não encontrado. Tente: 12345");
        }
        setLoading(false);
      }, 1000);

    } catch (err: any) {
      alert("Erro ao buscar notas.");
      setLoading(false);
    }
  };

  const logout = () => {
    setStudentData(null);
    setResults([]);
    setEnrollmentCode("");
  };

  if (studentData) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho do Aluno */}
          <div className="bg-blue-600 text-white rounded-xl p-6 shadow-md mb-8 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">{studentData.name}</h1>
              <p className="text-blue-100">{studentData.className} • {studentData.schoolName}</p>
            </div>
            <button 
              onClick={logout}
              className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              Sair
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6">Minhas Notas e Correções</h2>

          {/* Grid de Resultados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((res) => (
              <div key={res.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {res.subject}
                    </span>
                    <h3 className="font-bold text-lg text-gray-800 mt-2">{res.title}</h3>
                    <p className="text-sm text-gray-500">{res.professor}</p>
                  </div>
                  
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 ${res.percentage >= 70 ? 'border-green-500 text-green-600' : res.percentage >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                    {res.score}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center text-sm text-gray-500">
                  <span>Data: {new Date(res.date).toLocaleDateString('pt-BR')}</span>
                  <span>Acertos: {res.score}/{res.total} ({res.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Tela de Login do Aluno
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          🎓
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Portal do Aluno</h1>
        <p className="text-gray-500 mb-8">Digite seu código de matrícula para ver suas notas.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input 
              type="text" 
              required
              placeholder="Ex: MAT-2024-001"
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-center text-lg font-bold tracking-widest focus:ring-0 focus:border-blue-500 uppercase transition"
              value={enrollmentCode}
              onChange={(e) => setEnrollmentCode(e.target.value.toUpperCase())}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
          >
            {loading ? "Buscando..." : "Ver Minhas Notas"}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-400">
          Se você não sabe seu código, pergunte ao seu professor.
        </p>
      </div>
    </main>
  );
}
