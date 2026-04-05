import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bson import ObjectId

from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    JWTManager,
    jwt_required,
    get_jwt_identity
)

load_dotenv()

API_KEY = os.getenv("API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

app = Flask(__name__)

# ✅ CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# ✅ JWT
app.config["JWT_SECRET_KEY"] = JWT_SECRET
jwt = JWTManager(app)

# ✅ MongoDB
client = MongoClient(MONGO_URI)
db = client["zuxter_ai"]
users = db["users"]

# ================= AUTH ================= #

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"msg": "Name, Email & Password required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"msg": "User already exists"}), 400

    hashed_password = generate_password_hash(password)

    users.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "xp": 0,
        "streak": 1,
        "badges": []
    })

    return jsonify({"msg": "User created successfully"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json or {}

    email = data.get("email")
    password = data.get("password")

    user = users.find_one({"email": email})

    if user and check_password_hash(user["password"], password):
        token = create_access_token(identity=str(user["_id"]))

        return jsonify({
            "token": token,
            "name": user.get("name", ""),
            "email": user.get("email", "")
        })

    return jsonify({"msg": "Invalid credentials"}), 401


# ================= PROFILE ================= #

@app.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()

    user = users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "xp": user.get("xp", 0),
        "streak": user.get("streak", 1),
        "badges": user.get("badges", [])
    })


# ================= AI ================= #

@app.route("/api/ai", methods=["POST"])
@jwt_required()
def ai():
    try:
        data = request.json or {}
        user_input = data.get("prompt")

        if not user_input:
            return jsonify({"response": "No prompt provided"}), 400

        # 🔥 FORMATTED PROMPT (MAIN FIX)
        prompt = f"""
Format the answer in clean readable style:
- Use numbering (1, 2, 3...)
- Use simple bullet points with -
- No symbols like # or **
- Keep spacing clean

Topic:
{user_input}
"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={API_KEY}"

        payload = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }

        headers = {"Content-Type": "application/json"}

        response = requests.post(url, headers=headers, json=payload)
        result = response.json()

        if "candidates" in result:
            output = result["candidates"][0]["content"]["parts"][0]["text"]
        else:
            output = result.get("error", {}).get("message", "No response")

        return jsonify({"response": output})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"response": "Error generating response"}), 500


# ================= HOME ================= #

@app.route("/")
def home():
    return "Zuxter X Backend Running 🚀"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)