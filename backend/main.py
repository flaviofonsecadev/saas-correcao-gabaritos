from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from omr_engine import process_omr

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
    answer_key: str = Form(...),  # JSON stringificado
    file: UploadFile = File(...)
):
    """
    Endpoint para corrigir um gabarito enviado por imagem.
    - file: A imagem do gabarito preenchido (JPEG/PNG).
    - answer_key: JSON com o gabarito oficial.
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

        return {
            "status": "sucesso",
            "filename": file.filename,
            "resultado": resultado
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato de answer_key inválido.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
