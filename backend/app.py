import os
API_KEY = os.getenv("API_KEY")
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_KEY = "AIzaSyAdgADG60tuwjmOL2W6DnAJNfAPKtB5frU"

@app.route("/api/ai", methods=["POST"])
def ai():
    try:
        data = request.json
        prompt = data.get("prompt")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={API_KEY}"

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }

        headers = {
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers, json=payload)
        result = response.json()

        print("RAW RESPONSE:", result)

        # 🔥 SAFE CHECK
        if "candidates" in result:
            output = result["candidates"][0]["content"]["parts"][0]["text"]
        else:
            output = result.get("error", {}).get("message", "No response")

        return jsonify({
            "response": output
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({
            "response": "Error generating response"
        })

@app.route("/")
def home():
    return "Backend running 🚀"

if __name__ == "__main__":
    app.run(debug=True)