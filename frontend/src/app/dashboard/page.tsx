"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase";

type School = {
  id: string;
  name: string;
  code: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Dados Mockados para visualização sem Supabase conectado
  const mockSchools: School[] = [
    { id: "1", name: "Colégio Estadual Central", code: "CEC-2024" },
    { id: "2", name: "Escola Particular Alfa", code: "ALFA-2024" }
  ];

  useEffect(() => {
    // Simular fetch do banco
    setTimeout(() => {
      setSchools(mockSchools);
      if (mockSchools.length > 0) {
        setActiveSchoolId(mockSchools[0].id);
      }
      setLoading(false);
    }, 800);
  }, []);

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    
    // Mock da criação de escola
    const newSchool = {
      id: Math.random().toString(),
      name: newSchoolName,
      code: `ESC-${Math.floor(Math.random() * 10000)}`
    };
    
    setSchools([...schools, newSchool]);
    setActiveSchoolId(newSchool.id);
    setIsCreatingSchool(false);
    setNewSchoolName("");
    alert(`Escola criada! Código de convite: ${newSchool.code}`);
  };

  const handleJoinSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    // Mock entrar em escola
    alert(`Solicitação para entrar na escola com código ${joinCode} enviada!`);
    setJoinCode("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando painel...</div>;
  }

  // Tela de "Sem Escolas" (Onboarding)
  if (schools.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Bem-vindo ao SaaS OMR!</h1>
            <p className="text-gray-600 mt-2">Você precisa estar vinculado a uma escola para começar a corrigir provas.</p>
          </div>

          <div className="space-y-8">
            <form onSubmit={handleCreateSchool} className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Criar Nova Escola</h3>
              <input 
                type="text" 
                placeholder="Nome da Escola" 
                required
                className="w-full p-2 rounded border border-gray-300 mb-3"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
              />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
                Criar Escola
              </button>
            </form>

            <div className="text-center text-gray-400 font-bold">OU</div>

            <form onSubmit={handleJoinSchool} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-3">Entrar em uma Escola</h3>
              <input 
                type="text" 
                placeholder="Código de Convite (Ex: CEC-2024)" 
                required
                className="w-full p-2 rounded border border-gray-300 mb-3 uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button type="submit" className="w-full bg-gray-800 text-white font-bold py-2 rounded hover:bg-gray-900">
                Entrar com Código
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const activeSchool = schools.find(s => s.id === activeSchoolId);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar Superior com Seletor de Escolas */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black text-blue-600">SaaS OMR</h1>
          
          <div className="flex items-center gap-2 border-l border-gray-300 pl-6">
            <span className="text-sm text-gray-500">Escola Atual:</span>
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              value={activeSchoolId || ""}
              onChange={(e) => setActiveSchoolId(e.target.value)}
            >
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 border border-gray-200 px-3 py-1 rounded-full bg-gray-50">
            Código de Convite: <strong className="text-black">{activeSchool?.code}</strong>
          </span>
          <button onClick={() => router.push("/")} className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-green-700">
            📷 Corrigir Prova Agora
          </button>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Painel do Professor</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Turmas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Minhas Turmas</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">+ Nova</button>
            </div>
            <ul className="space-y-3">
              <li className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between">
                <span>8º Ano A</span>
                <span className="text-gray-500 text-sm">32 alunos</span>
              </li>
              <li className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between">
                <span>9º Ano B</span>
                <span className="text-gray-500 text-sm">28 alunos</span>
              </li>
            </ul>
          </div>

          {/* Card: Provas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Minhas Provas</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">+ Nova</button>
            </div>
            <ul className="space-y-3">
              <li className="p-3 bg-gray-50 rounded border border-gray-100 flex flex-col">
                <div className="flex justify-between">
                  <span className="font-semibold">Prova Bimestral 1</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Matemática</span>
                </div>
                <span className="text-gray-500 text-xs mt-2">15 correções realizadas</span>
              </li>
              <li className="p-3 bg-gray-50 rounded border border-gray-100 flex flex-col">
                <div className="flex justify-between">
                  <span className="font-semibold">Teste de Mecânica</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Física</span>
                </div>
                <span className="text-gray-500 text-xs mt-2">0 correções realizadas</span>
              </li>
            </ul>
          </div>

          {/* Card: Atalhos Rápidos */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-xl mb-2">Gerar Gabaritos</h3>
            <p className="text-blue-100 text-sm mb-6">Imprima folhas de gabarito oficiais para suas turmas.</p>
            <button onClick={() => router.push("/template")} className="bg-white text-blue-700 px-6 py-2 rounded-full font-bold shadow hover:bg-gray-100 transition w-full">
              🖨️ Abrir PDF Template
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}