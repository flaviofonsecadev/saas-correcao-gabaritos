import cv2
import numpy as np

def order_points(pts):
    # inicializa uma lista de coordenadas que serão ordenadas
    # na ordem: topo-esquerdo, topo-direito, base-direito, base-esquerdo
    rect = np.zeros((4, 2), dtype="float32")
    
    # a soma do topo-esquerdo terá o menor valor, enquanto
    # o base-direito terá a maior soma
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    # a diferença entre os pontos: o topo-direito terá a menor diferença,
    # enquanto o base-esquerdo terá a maior diferença
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    return rect

def four_point_transform(image, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # calcula a largura do novo retângulo
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    # calcula a altura do novo retângulo
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    # constrói as dimensões do novo array
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    # calcula a matriz de transformação de perspectiva e a aplica
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    return warped

def get_choices(thresh, num_questions, num_choices):
    """
    Mock temporário para extrair as escolhas das questões.
    Na versão real, usaria findContours nas bolinhas, organizaria
    pelas coordenadas y (questões) e x (alternativas).
    Para fins de demonstração (PoC), se a imagem vier muito clara,
    ele vai chutar um resultado para que a API não quebre.
    """
    results = {}
    options_map = ["A", "B", "C", "D", "E"]
    
    # Aqui simulamos que a IA encontrou marcações aleatórias ou predefinidas
    # Como não temos uma foto real de um gabarito preenchido neste momento,
    # vamos mockar as detecções (em produção isso viria do cv2.countNonZero)
    import random
    
    for q in range(1, num_questions + 1):
        # Mock melhorado: 
        # Em vez de chutar sempre "A", simula que o aluno acertou a maioria (80% chance de acertar)
        # e deixou algumas em branco (opção None).
        # Para que o resultado seja visualmente rico na tela do frontend.
        # Aqui, como não temos o answer_key, vamos apenas sortear
        # 10% chance de pular a questão
        if random.random() < 0.1:
            results[str(q)] = None
        else:
            results[str(q)] = random.choice(options_map)
        
    return results

def process_omr(image_bytes, answer_key):
    """
    Função principal de processamento OMR.
    Para o PoC, ela realiza os passos básicos:
    1. Conversão para tons de cinza.
    2. Detecção de bordas (Canny).
    3. Encontrar o contorno principal (papel).
    4. Transformação de perspectiva.
    5. Extração de bolinhas e comparação com o answer_key (Certas e Erradas).
    """
    # 1. Carregar a imagem a partir dos bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Imagem inválida ou corrompida.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)

    # 2. Encontrar os contornos da folha
    cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Se encontrou contornos, ordenar pelo tamanho
    docCnt = None
    if len(cnts) > 0:
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            
            # Se o contorno aproximado tem 4 pontos, assumimos que é a folha
            if len(approx) == 4:
                docCnt = approx
                break

    if docCnt is None:
        # Fallback: não conseguiu detectar o papel, usa a imagem inteira
        paper = gray
    else:
        # Aplica a transformação de perspectiva para "achatar" a folha
        paper = four_point_transform(gray, docCnt.reshape(4, 2))

    # 3. Aplicar thresholding para destacar as bolinhas pretas
    thresh = cv2.threshold(paper, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

    # 4. Extração real (mockada para a PoC) das alternativas preenchidas
    total_questions = len(answer_key)
    student_answers = get_choices(thresh, total_questions, 5)
    
    # 5. Comparação de Certas e Erradas
    score = 0
    results = {}
    
    for q_num, correct_ans in answer_key.items():
        marked_ans = student_answers.get(str(q_num), None)
        is_correct = marked_ans == correct_ans
        
        if is_correct:
            score += 1
            
        results[q_num] = {
            "correct": correct_ans,
            "marked": marked_ans if marked_ans else "Nenhuma",
            "is_correct": is_correct
        }

    return {
        "score": score,
        "total": total_questions,
        "percentage": round((score / total_questions) * 100, 2),
        "details": results
    }
