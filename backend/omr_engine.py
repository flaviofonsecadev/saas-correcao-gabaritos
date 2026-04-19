import cv2
import numpy as np
from imutils import contours

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

def process_omr(image_bytes, num_questions=20):
    """
    Função REAL de processamento OMR.
    1. Acha as bordas da folha e faz o warp perspective.
    2. Aplica threshold binarizado.
    3. Acha as bolinhas baseadas em tamanho e aspecto (ar).
    4. Separa a folha em duas colunas (esquerda/direita) baseada no nosso template.
    5. Lê a intensidade de pixels pretos em cada bolinha e define a alternativa marcada.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Imagem inválida ou corrompida.")

    # 1. Transformar em escala de cinza e achar a folha
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)

    cnts = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    
    docCnt = None
    if len(cnts) > 0:
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                docCnt = approx
                break

    # Se não achou 4 cantos perfeitos, tenta usar a imagem inteira
    if docCnt is not None:
        paper = four_point_transform(gray, docCnt.reshape(4, 2))
    else:
        paper = gray

    # 2. Thresholding - inverte cores para que as bolinhas preenchidas fiquem BRANCAS e o fundo PRETO
    thresh = cv2.threshold(paper, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

    # 3. Encontrar contornos na folha achatada para isolar as bolinhas
    cnts = cv2.findContours(thresh.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    questionCnts = []

    for c in cnts:
        (x, y, w, h) = cv2.boundingRect(c)
        ar = w / float(h)
        # Filtro de forma: bolinhas têm aspecto entre 0.8 e 1.2
        # Tamanho mínimo ajustado para garantir que não pegue sujeira
        if w >= 15 and h >= 15 and ar >= 0.8 and ar <= 1.2:
            questionCnts.append(c)

    results = {}
    options_map = ["A", "B", "C", "D", "E"]
    
    # Se a foto for ruim e não acharmos bolinhas suficientes, falha graciosamente
    if len(questionCnts) < num_questions * 5:
        print(f"AVISO OMR: Achamos apenas {len(questionCnts)} contornos. Pode haver erros de leitura.")

    if len(questionCnts) > 0:
        # 4. Dividir as bolinhas em Coluna Esquerda e Coluna Direita 
        # (Nosso template tem questoes 1-10 na esquerda e 11-20 na direita)
        center_x = paper.shape[1] // 2
        left_cnts = [c for c in questionCnts if cv2.boundingRect(c)[0] < center_x]
        right_cnts = [c for c in questionCnts if cv2.boundingRect(c)[0] >= center_x]

        def process_column(column_cnts, start_q_num, max_questions_in_col=10):
            if len(column_cnts) == 0:
                return
            
            # Ordena a coluna inteira de cima para baixo
            column_cnts = contours.sort_contours(column_cnts, method="top-to-bottom")[0]
            
            # Processa as bolinhas de 5 em 5 (uma linha = uma questão)
            for (q, i) in enumerate(np.arange(0, len(column_cnts), 5)):
                if q >= max_questions_in_col:
                    break
                if i + 5 > len(column_cnts):
                    break 
                
                # Pega as 5 bolinhas daquela linha
                cnts_row = column_cnts[i:i + 5]
                # Ordena a linha da esquerda para a direita (A, B, C, D, E)
                cnts_row = contours.sort_contours(cnts_row, method="left-to-right")[0]
                
                bubbled = None
                max_pixels = 0
                
                for (j, c) in enumerate(cnts_row):
                    # Cria uma mascara para aquela bolinha especifica
                    mask = np.zeros(thresh.shape, dtype="uint8")
                    cv2.drawContours(mask, [c], -1, 255, -1)
                    
                    # Aplica a mascara na imagem binarizada e conta os pixels "brancos" (marcados a caneta)
                    mask = cv2.bitwise_and(thresh, thresh, mask=mask)
                    total_pixels = cv2.countNonZero(mask)
                    
                    # Salva qual bolinha tem mais pixels
                    if total_pixels > max_pixels:
                        max_pixels = total_pixels
                        bubbled = j
                        
                # Define se a bolinha "mais cheia" está realmente preenchida (evitar que uma sujeira vença)
                area = cv2.contourArea(cnts_row[0])
                if max_pixels > (area * 0.4): # Pelo menos 40% da bolinha pintada
                    results[str(start_q_num + q)] = options_map[bubbled]
                else:
                    results[str(start_q_num + q)] = None # Deixou em branco
                    
        # Processa Coluna Esquerda (Questões 1 a 10)
        process_column(left_cnts, 1, 10)
        # Processa Coluna Direita (Questões 11 a 20)
        process_column(right_cnts, 11, 10)

    # Preenche o que a câmera não conseguiu ler como "None"
    for q in range(1, num_questions + 1):
        if str(q) not in results:
            results[str(q)] = None

    return results