from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

toxicity_classifier = pipeline(
    "text-classification",
    model="textdetox/xlmr-large-toxicity-classifier-v2"
)

PALABRAS_PROHIBIDAS = [
    "pendejo", "pendeja",
    "idiota",
    "imbecil", "imbécil",
    "estupido", "estúpido",
    "mierda",
    "cabron", "cabrón",
    "puta", "puto",
    "joto",
    "maricon", "maricón",
    "perra", "perro"
]

def normalizar_texto(texto: str) -> str:
    return (
        texto.lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .strip()
    )

def contiene_palabra_prohibida(texto: str) -> bool:
    limpio = normalizar_texto(texto)
    return any(normalizar_texto(palabra) in limpio for palabra in PALABRAS_PROHIBIDAS)

def analizar_toxicidad(texto: str):
    if not texto or not texto.strip():
        return {
            "permitido": False,
            "motivo": "Comentario vacío",
            "toxicidad": 0.0
        }

    if contiene_palabra_prohibida(texto):
        return {
            "permitido": False,
            "motivo": "Tu comentario contiene lenguaje ofensivo.",
            "toxicidad": 1.0
        }

    resultado = toxicity_classifier(
        texto,
        truncation=True,
        max_length=512
    )[0]

    label = resultado["label"].lower()
    score = float(resultado["score"])

    if label in ["toxic", "label_1", "1"] or ("tox" in label and "non" not in label and "no" not in label):
        prob_toxico = score
    else:
        prob_toxico = 1 - score

    umbral_bloqueo = 0.75

    if prob_toxico >= umbral_bloqueo:
        return {
            "permitido": False,
            "motivo": "Tu comentario parece ofensivo o muy grosero.",
            "toxicidad": prob_toxico
        }

    return {
        "permitido": True,
        "motivo": "Comentario permitido",
        "toxicidad": prob_toxico
    }

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "ok": True,
        "message": "Servicio de moderación activo"
    })

@app.route("/moderate", methods=["POST"])
def moderate():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    resultado = analizar_toxicidad(text)
    return jsonify(resultado)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8001, debug=False)