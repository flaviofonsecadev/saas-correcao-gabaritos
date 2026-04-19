from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from omr_engine import process_omr

# Carrega variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Só inicializa o cliente se as variáveis existirem, 
# para não quebrar o app se o usuário ainda não tiver preenchido o .env
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "YOUR_SUPABASE_URL_HERE":
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="SaaS Correção Gabaritos - PoC API")

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na produção, substituir pelos domínios reais
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnswerKeyModel(BaseModel):
    # Exemplo: {"1": "A", "2": "B", "3": "C"}
    keys: dict[str, str]

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API de Correção de Gabaritos (OMR)"}

@app.post("/api/grade")
async def grade_exam(
    answer_key: str = Form(...),
    exam_id: str = Form(None), # Opcional na PoC
    file: UploadFile = File(...)
):
    """
    Endpoint para corrigir um gabarito enviado por imagem.
    - file: A imagem do gabarito preenchido (JPEG/PNG).
    - answer_key: JSON com o gabarito oficial.
    - exam_id: UUID do exame para salvar o resultado no banco.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem válida.")

    try:
        # Lê a imagem como bytes
        image_bytes = await file.read()
        
        # Converte o answer_key (JSON) para dict Python
        parsed_key = json.loads(answer_key)
        
        # Processa a imagem e compara com as respostas
        resultado = process_omr(image_bytes, parsed_key)

        # Se houver conexão com o Supabase e um exam_id foi passado, salvar o resultado no banco
        if supabase and exam_id:
            try:
                # O ID do aluno seria identificado pelo número da matrícula (QRCode/OMR). 
                # Como ainda não temos isso na PoC, o campo student_id será nulo
                data, count = supabase.table("results").insert({
                    "exam_id": exam_id,
                    "score": resultado["score"],
                    "total": resultado["total"],
                    "percentage": resultado["percentage"],
                    "details": resultado["details"]
                }).execute()
            except Exception as db_err:
                print(f"Erro ao salvar no Supabase: {db_err}")
                # Não quebra a requisição se falhar ao salvar, apenas avisa
                resultado["db_warning"] = "Não foi possível salvar o resultado no banco de dados."

        return {
            "status": "sucesso",
            "filename": file.filename,
            "resultado": resultado
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato de answer_key inválido.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
