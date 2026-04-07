import os
import re
import random
from datetime import datetime, date, timedelta, timezone
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
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

API_KEY          = os.getenv("API_KEY")
MONGO_URI        = os.getenv("MONGO_URI")
JWT_SECRET       = os.getenv("JWT_SECRET")

ADMIN_EMAILS_RAW = os.getenv("ADMIN_EMAILS", "")
ADMIN_EMAILS     = {e.strip().lower() for e in ADMIN_EMAILS_RAW.split(",") if e.strip()}
ADMIN_PASSWORD   = os.getenv("ADMIN_PASSWORD", "")

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

app.config["JWT_SECRET_KEY"] = JWT_SECRET
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)

client  = MongoClient(MONGO_URI)
db      = client["zuxter_ai"]
users   = db["users"]
posts   = db["connect_posts"]
tickets = db["support_tickets"]

app.config["MAIL_SERVER"]         = "smtp.gmail.com"
app.config["MAIL_PORT"]           = 587
app.config["MAIL_USE_TLS"]        = True
app.config["MAIL_USERNAME"]       = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"]       = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")
mail = Mail(app)

otp_store = {}


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def today_str():
    return date.today().isoformat()

def serialize_user(u):
    return {
        "id":           str(u["_id"]),
        "name":         u.get("name", ""),
        "email":        u.get("email", ""),
        "xp":           u.get("xp", 0),
        "streak":       u.get("streak", 0),
        "maxStreak":    u.get("maxStreak", 0),
        "lastActive":   u.get("lastActive", ""),
        "badges":       u.get("badges", []),
        "featuresUsed": u.get("featuresUsed", []),
        "plans":        u.get("plans", 0),
        "qSets":        u.get("qSets", 0),
        "summaries":    u.get("summaries", 0),
        "avatar":       u.get("avatar", None),
        "banned":       u.get("banned", False),
        "createdAt":    u.get("createdAt", ""),
        "followers":    u.get("followers", []),
        "following":    u.get("following", []),
        "lastSeen":     u.get("lastSeen", ""),
        "roles":        u.get("roles", []),
    }

def update_streak_fields(user_doc):
    t         = today_str()
    last      = user_doc.get("lastActive", "")
    streak    = user_doc.get("streak", 0)
    max_s     = user_doc.get("maxStreak", 0)
    if last == t:
        return {}
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    streak    = (streak + 1) if last == yesterday else 1
    max_s     = max(streak, max_s)
    return {"streak": streak, "maxStreak": max_s, "lastActive": t}

def compute_badges(u):
    earned = set(u.get("badges", []))
    if u.get("plans", 0)    >= 1:  earned.add("first_plan")
    if u.get("streak", 0)   >= 3:  earned.add("streak3")
    if u.get("streak", 0)   >= 7:  earned.add("streak7")
    if u.get("qSets", 0)    >= 10: earned.add("ten_q")
    if len(set(u.get("featuresUsed", []))) >= 3: earned.add("explorer")
    return list(earned)

def require_admin():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("AdminBearer "):
        return None, False
    token = auth[len("AdminBearer "):]
    try:
        email, pwd = token.split("::", 1)
        if email.lower() in ADMIN_EMAILS and pwd == ADMIN_PASSWORD:
            return email.lower(), True
    except Exception:
        pass
    return None, False

def get_current_user_id():
    """Get user id from JWT, returns None if invalid."""
    try:
        from flask_jwt_extended import decode_token
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
            decoded = decode_token(token)
            return decoded.get("sub")
    except Exception:
        return None

def serialize_post(p):
    return {
        "_id":          str(p["_id"]),
        "authorId":     p.get("authorId", ""),
        "authorName":   p.get("authorName", ""),
        "authorEmail":  p.get("authorEmail", ""),
        "authorAvatar": p.get("authorAvatar", None),
        "text":         p.get("text", ""),
        "image":        p.get("image", None),
        "likes":        p.get("likes", []),
        "comments":     p.get("comments", []),
        "createdAt":    p.get("createdAt", "").isoformat() + "Z" if isinstance(p.get("createdAt"), datetime) else p.get("createdAt", ""),
    }

def serialize_ticket(t):
    return {
        "_id":        str(t["_id"]),
        "userId":     t.get("userId", ""),
        "userName":   t.get("userName", ""),
        "userEmail":  t.get("userEmail", ""),
        "subject":    t.get("subject", ""),
        "message":    t.get("message", ""),
        "category":   t.get("category", "other"),
        "status":     t.get("status", "open"),
        "adminReply": t.get("adminReply", ""),
        "createdAt":  t.get("createdAt", "").isoformat() + "Z" if isinstance(t.get("createdAt"), datetime) else t.get("createdAt", ""),
    }


# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/send-otp", methods=["POST"])
def send_otp():
    data  = request.json or {}
    email = data.get("email", "").strip().lower()
    name  = data.get("name", "").strip()
    if not email or not name:
        return jsonify({"msg": "Name and Email are required"}), 400
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"msg": "Invalid email address"}), 400
    if users.find_one({"email": email}):
        return jsonify({"msg": "User already exists with this email"}), 400
    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp
    try:
        msg = Message(
            subject="ZuxterX — Your Verification OTP",
            recipients=[email],
            html=f"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;
                        background:#0a0c10;color:#e8ecf0;border-radius:16px;
                        padding:36px 32px;border:1px solid #1f2530;">
              <h2 style="color:#00e5a0;font-size:26px;margin-bottom:4px;">ZuxterX</h2>
              <p style="color:#6b7585;font-size:13px;margin-bottom:28px;">AI Study Platform</p>
              <p style="font-size:15px;">Hi <strong>{name}</strong>,</p>
              <p style="font-size:14px;color:#6b7585;margin-top:8px;">Your verification code:</p>
              <div style="text-align:center;margin:28px 0;">
                <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#00e5a0;">{otp}</span>
              </div>
              <p style="font-size:13px;color:#6b7585;">Valid for this session only. Do not share.</p>
              <hr style="border:none;border-top:1px solid #1f2530;margin:28px 0;">
              <p style="font-size:11px;color:#6b7585;text-align:center;">© ZuxterX · AI Study Platform</p>
            </div>""",
        )
        mail.send(msg)
    except Exception as e:
        print("MAIL ERROR:", e)
        return jsonify({"msg": "Failed to send OTP. Check mail config."}), 500
    return jsonify({"msg": "OTP sent to your email"})


@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data     = request.json or {}
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    otp      = data.get("otp", "").strip()
    if not all([name, email, password, otp]):
        return jsonify({"msg": "All fields required"}), 400
    stored = otp_store.get(email)
    if not stored:
        return jsonify({"msg": "OTP expired. Please resend."}), 400
    if otp != stored:
        return jsonify({"msg": "Invalid OTP. Please try again."}), 400
    del otp_store[email]
    if users.find_one({"email": email}):
        return jsonify({"msg": "User already exists"}), 400
    users.insert_one({
        "name":         name,
        "email":        email,
        "password":     generate_password_hash(password),
        "xp":           0,
        "streak":       0,
        "maxStreak":    0,
        "lastActive":   "",
        "badges":       [],
        "featuresUsed": [],
        "plans":        0,
        "qSets":        0,
        "summaries":    0,
        "avatar":       None,
        "banned":       False,
        "createdAt":    today_str(),
        "followers":    [],
        "following":    [],
        "lastSeen":     datetime.utcnow().isoformat(),
        "roles":        ["member"],
    })
    return jsonify({"msg": "Account created! Please sign in."})


@app.route("/login", methods=["POST"])
def login():
    data     = request.json or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"msg": "Email and password required"}), 400
    u = users.find_one({"email": email})
    if not u or not check_password_hash(u["password"], password):
        return jsonify({"msg": "Invalid email or password"}), 401
    if u.get("banned"):
        return jsonify({"msg": "Your account has been suspended. Contact support."}), 403
    users.update_one({"_id": u["_id"]}, {"$set": {"lastSeen": datetime.utcnow().isoformat()}})
    token = create_access_token(identity=str(u["_id"]))
    return jsonify({**serialize_user(u), "token": token})


@app.route("/forgot-password-otp", methods=["POST"])
def forgot_password_otp():
    data  = request.json or {}
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"msg": "Email is required"}), 400
    u = users.find_one({"email": email})
    if not u:
        return jsonify({"msg": "No account found with this email"}), 404

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp
    try:
        msg = Message(
            subject="ZuxterX — Password Reset",
            recipients=[email],
            html=f"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;
                        background:#0a0c10;color:#e8ecf0;border-radius:16px;
                        padding:36px 32px;border:1px solid #1f2530;">
              <h2 style="color:#00e5a0;font-size:26px;margin-bottom:4px;">ZuxterX</h2>
              <p style="color:#6b7585;font-size:13px;margin-bottom:28px;">Password Reset Request</p>
              <p style="font-size:15px;">Hi {u.get('name', 'there')},</p>
              <p style="font-size:14px;color:#6b7585;margin-top:8px;">Your password reset code:</p>
              <div style="text-align:center;margin:28px 0;">
                <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#00e5a0;">{otp}</span>
              </div>
              <p style="font-size:13px;color:#6b7585;">If you didn't request this, you can ignore it.</p>
              <hr style="border:none;border-top:1px solid #1f2530;margin:28px 0;">
              <p style="font-size:11px;color:#6b7585;text-align:center;">© ZuxterX · AI Study Platform</p>
            </div>""",
        )
        mail.send(msg)
    except Exception as e:
        print("MAIL ERROR:", e)
        return jsonify({"msg": "Failed to send OTP. Check mail config."}), 500
    return jsonify({"msg": "Password reset OTP sent to your email"})


@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    new_password = data.get("password", "")

    if not all([email, otp, new_password]):
        return jsonify({"msg": "All fields required"}), 400

    stored = otp_store.get(email)
    if not stored:
        return jsonify({"msg": "OTP expired. Please request a new one."}), 400
    if otp != stored:
        return jsonify({"msg": "Invalid OTP. Please try again."}), 400

    u = users.find_one({"email": email})
    if not u:
        return jsonify({"msg": "No account found with this email"}), 404

    # Update password
    users.update_one(
        {"_id": u["_id"]},
        {"$set": {"password": generate_password_hash(new_password)}}
    )
    
    # Delete OTP from store
    del otp_store[email]

    return jsonify({"msg": "Password reset successfully! Please sign in."})

# ══════════════════════════════════════════════════════════════════════════════
# PROFILE
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/profile/update", methods=["POST"])
@jwt_required()
def profile_update():
    user_id = get_jwt_identity()
    data    = request.json or {}
    fields  = {}
    if "name"     in data: fields["name"]     = str(data["name"]).strip()
    if "password" in data: fields["password"] = generate_password_hash(data["password"])
    if not fields:
        return jsonify({"msg": "Nothing to update"}), 400
    users.update_one({"_id": ObjectId(user_id)}, {"$set": fields})
    u = users.find_one({"_id": ObjectId(user_id)})
    return jsonify({"msg": "Updated", "name": u["name"], "email": u["email"]})


@app.route("/profile/avatar", methods=["POST"])
@jwt_required()
def profile_avatar():
    user_id = get_jwt_identity()
    data    = request.json or {}
    avatar  = data.get("avatar")
    if not avatar:
        return jsonify({"msg": "No avatar provided"}), 400
    if len(avatar) > 3 * 1024 * 1024:
        return jsonify({"msg": "Image too large (max 2MB)"}), 400
    users.update_one({"_id": ObjectId(user_id)}, {"$set": {"avatar": avatar}})
    # Update avatar in all posts by this user
    posts.update_many({"authorId": user_id}, {"$set": {"authorAvatar": avatar}})
    return jsonify({"msg": "Avatar updated", "avatar": avatar})


# ══════════════════════════════════════════════════════════════════════════════
# ACTIVITY / XP
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/activity", methods=["POST"])
@jwt_required()
def activity():
    user_id = get_jwt_identity()
    data    = request.json or {}
    feature = data.get("feature")
    XP_MAP  = {"planner": 20, "questions": 15, "summary": 10}
    STAT_MAP = {"planner": "plans", "questions": "qSets", "summary": "summaries"}
    if feature not in XP_MAP:
        return jsonify({"msg": "Invalid feature"}), 400
    u = users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return jsonify({"msg": "User not found"}), 404
    streak_upd    = update_streak_fields(u)
    features_used = list(set(u.get("featuresUsed", []) + [feature]))
    stat_key      = STAT_MAP[feature]
    set_fields    = {"featuresUsed": features_used}
    set_fields.update(streak_upd)
    users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"xp": XP_MAP[feature], stat_key: 1}, "$set": set_fields}
    )
    u = users.find_one({"_id": ObjectId(user_id)})
    new_badges = compute_badges(u)
    users.update_one({"_id": ObjectId(user_id)}, {"$set": {"badges": new_badges}})
    u["badges"] = new_badges
    return jsonify(serialize_user(u))


# ══════════════════════════════════════════════════════════════════════════════
# HEARTBEAT (online tracking)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/heartbeat", methods=["POST"])
@jwt_required()
def heartbeat():
    user_id = get_jwt_identity()
    users.update_one({"_id": ObjectId(user_id)}, {"$set": {"lastSeen": datetime.utcnow().isoformat()}})
    return jsonify({"ok": True})


# ══════════════════════════════════════════════════════════════════════════════
# LEADERBOARD
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    top = list(users.find(
        {"banned": {"$ne": True}},
        {"name": 1, "xp": 1, "streak": 1, "badges": 1, "avatar": 1, "email": 1}
    ).sort("xp", -1).limit(10))
    return jsonify([{
        "id":     str(u["_id"]),
        "name":   u.get("name", ""),
        "email":  u.get("email", ""),
        "xp":     u.get("xp", 0),
        "streak": u.get("streak", 0),
        "badges": u.get("badges", []),
        "avatar": u.get("avatar", None),
    } for u in top])


# ══════════════════════════════════════════════════════════════════════════════
# AI
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/ai", methods=["POST"])
@jwt_required()
def ai():
    try:
        data       = request.json or {}
        user_input = data.get("prompt")
        if not user_input:
            return jsonify({"response": "No prompt provided"}), 400

        prompt = f"""You are an expert AI study assistant. Format your response clearly:
- Use numbered sections like "1. Topic Name:" for main headings
- Use "- " bullet points for details under each section
- Keep spacing clean between sections
- Do NOT use markdown symbols like # or **
- Be comprehensive but concise

Topic:
{user_input}"""

        url      = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={API_KEY}"
        response = requests.post(url, headers={"Content-Type": "application/json"}, json={"contents": [{"parts": [{"text": prompt}]}]})
        result   = response.json()
        output   = result["candidates"][0]["content"]["parts"][0]["text"] if "candidates" in result else result.get("error", {}).get("message", "No response")
        return jsonify({"response": output})
    except Exception as e:
        print("ERROR:", e)
        return jsonify({"response": "Error generating response"}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ZUXTER CONNECT
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/connect/posts", methods=["GET"])
@jwt_required()
def get_posts():
    all_posts = list(posts.find({}).sort("createdAt", -1).limit(50))
    return jsonify([serialize_post(p) for p in all_posts])


@app.route("/connect/post", methods=["POST"])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    data    = request.json or {}
    text    = data.get("text", "").strip()
    image   = data.get("image", None)

    if not text and not image:
        return jsonify({"msg": "Post must have text or image"}), 400
    if image and len(image) > 3 * 1024 * 1024:
        return jsonify({"msg": "Image too large (max 2MB)"}), 400

    u = users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return jsonify({"msg": "User not found"}), 404

    post_doc = {
        "authorId":     user_id,
        "authorName":   u.get("name", ""),
        "authorEmail":  u.get("email", ""),
        "authorAvatar": u.get("avatar", None),
        "text":         text,
        "image":        image,
        "likes":        [],
        "comments":     [],
        "createdAt":    datetime.utcnow(),
    }
    posts.insert_one(post_doc)
    return jsonify({"msg": "Posted"})


@app.route("/connect/post/<post_id>/like", methods=["POST"])
@jwt_required()
def toggle_like(post_id):
    user_id = get_jwt_identity()
    try:
        p = posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"msg": "Invalid post ID"}), 400
    if not p:
        return jsonify({"msg": "Post not found"}), 404

    likes = p.get("likes", [])
    if user_id in likes:
        posts.update_one({"_id": ObjectId(post_id)}, {"$pull": {"likes": user_id}})
    else:
        posts.update_one({"_id": ObjectId(post_id)}, {"$addToSet": {"likes": user_id}})
        u = users.find_one({"_id": ObjectId(user_id)})
        if u and p.get("authorId") != user_id:
            push_notif(p["authorId"], "like", u, p.get("text","")[:40], post_id)
    return jsonify({"msg": "ok"})


@app.route("/connect/post/<post_id>/comment", methods=["POST"])
@jwt_required()
def add_comment(post_id):
    user_id = get_jwt_identity()
    data    = request.json or {}
    text    = data.get("text", "").strip()
    if not text:
        return jsonify({"msg": "Comment cannot be empty"}), 400

    u = users.find_one({"_id": ObjectId(user_id)})
    comment = {
        "authorId":     user_id,
        "authorName":   u.get("name", ""),
        "authorAvatar": u.get("avatar", None),
        "text":         text,
        "createdAt":    datetime.utcnow().isoformat() + "Z",
    }
    try:
        p = posts.find_one({"_id": ObjectId(post_id)})
        posts.update_one({"_id": ObjectId(post_id)}, {"$push": {"comments": comment}})
        if p and p.get("authorId") != user_id:
            push_notif(p["authorId"], "comment", u, text[:60], post_id)
    except Exception:
        return jsonify({"msg": "Invalid post ID"}), 400
    return jsonify({"msg": "Commented"})


@app.route("/connect/follow/<target_id>", methods=["POST"])
@jwt_required()
def toggle_follow(target_id):
    user_id = get_jwt_identity()
    if user_id == target_id:
        return jsonify({"msg": "Cannot follow yourself"}), 400

    u      = users.find_one({"_id": ObjectId(user_id)})
    target = users.find_one({"_id": ObjectId(target_id)})
    if not u or not target:
        return jsonify({"msg": "User not found"}), 404

    following = u.get("following", [])
    if target_id in following:
        # Unfollow
        users.update_one({"_id": ObjectId(user_id)},   {"$pull": {"following": target_id}})
        users.update_one({"_id": ObjectId(target_id)}, {"$pull": {"followers": user_id}})
    else:
        # Follow — push notification
        users.update_one({"_id": ObjectId(user_id)},   {"$addToSet": {"following": target_id}})
        users.update_one({"_id": ObjectId(target_id)}, {"$addToSet": {"followers": user_id}})
        push_notif(target_id, "follow", u)

    u = users.find_one({"_id": ObjectId(user_id)})
    return jsonify({"following": u.get("following", []), "followers": u.get("followers", [])})


@app.route("/connect/user/<user_id>", methods=["GET"])
@jwt_required()
def get_user_profile(user_id):
    try:
        u = users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    if not u:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(serialize_user(u))


@app.route("/connect/user/<user_id>/posts", methods=["GET"])
@jwt_required()
def get_user_posts(user_id):
    user_posts = list(posts.find({"authorId": user_id}).sort("createdAt", -1))
    return jsonify([serialize_post(p) for p in user_posts])


@app.route("/connect/search", methods=["GET"])
@jwt_required()
def search_users():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    # case-insensitive search by name
    results = list(users.find({"name": {"$regex": re.escape(q), "$options": "i"}, "banned": {"$ne": True}}).limit(20))
    return jsonify([serialize_user(u) for u in results])


# Bug 3 fix: user can edit their own post
@app.route("/connect/post/<post_id>", methods=["PATCH"])
@jwt_required()
def edit_post(post_id):
    user_id = get_jwt_identity()
    data = request.json or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"msg": "Text cannot be empty"}), 400
    try:
        p = posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"msg": "Invalid post ID"}), 400
    if not p:
        return jsonify({"msg": "Post not found"}), 404
    if p.get("authorId") != user_id:
        return jsonify({"msg": "Not authorized"}), 403
    posts.update_one({"_id": ObjectId(post_id)}, {"$set": {"text": text}})
    return jsonify({"msg": "Post updated"})


# Bug 3 fix: user can delete their own post
@app.route("/connect/post/<post_id>", methods=["DELETE"])
@jwt_required()
def delete_own_post(post_id):
    user_id = get_jwt_identity()
    try:
        p = posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"msg": "Invalid post ID"}), 400
    if not p:
        return jsonify({"msg": "Post not found"}), 404
    if p.get("authorId") != user_id:
        return jsonify({"msg": "Not authorized"}), 403
    posts.delete_one({"_id": ObjectId(post_id)})
    return jsonify({"msg": "Post deleted"})


# ══════════════════════════════════════════════════════════════════════════════
# SUPPORT TICKETS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/support/ticket", methods=["POST"])
@jwt_required()
def submit_ticket():
    user_id = get_jwt_identity()
    data    = request.json or {}
    subject  = data.get("subject", "").strip()
    message  = data.get("message", "").strip()
    category = data.get("category", "other")

    if not subject or not message:
        return jsonify({"msg": "Subject and message are required"}), 400

    u = users.find_one({"_id": ObjectId(user_id)})
    ticket_doc = {
        "userId":     user_id,
        "userName":   u.get("name", ""),
        "userEmail":  u.get("email", ""),
        "subject":    subject,
        "message":    message,
        "category":   category,
        "status":     "open",
        "adminReply": "",
        "createdAt":  datetime.utcnow(),
    }
    tickets.insert_one(ticket_doc)
    return jsonify({"msg": "Ticket submitted successfully"})


@app.route("/support/my-tickets", methods=["GET"])
@jwt_required()
def my_tickets():
    user_id = get_jwt_identity()
    my = list(tickets.find({"userId": user_id}).sort("createdAt", -1))
    return jsonify([serialize_ticket(t) for t in my])


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/admin/login", methods=["POST"])
def admin_login():
    data     = request.json or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not ADMIN_EMAILS or not ADMIN_PASSWORD:
        return jsonify({"msg": "Admin not configured on server"}), 500
    if email not in ADMIN_EMAILS:
        return jsonify({"msg": "Not an admin account"}), 403
    if password != ADMIN_PASSWORD:
        return jsonify({"msg": "Invalid admin password"}), 403
    return jsonify({"msg": "Admin login successful", "adminToken": f"{email}::{password}", "email": email})


@app.route("/admin/users", methods=["GET"])
def admin_get_users():
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    all_u = list(users.find({}, {"password": 0, "avatar": 0}))
    return jsonify([serialize_user(u) for u in all_u])


@app.route("/admin/online-users", methods=["GET"])
def admin_online_users():
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    # Users active in last 5 minutes
    cutoff = (datetime.utcnow() - timedelta(minutes=5)).isoformat()
    online = list(users.find({"lastSeen": {"$gte": cutoff}, "banned": {"$ne": True}}, {"password": 0}))
    return jsonify([{
        "id":    str(u["_id"]),
        "name":  u.get("name", ""),
        "email": u.get("email", ""),
        "xp":    u.get("xp", 0),
        "avatar": u.get("avatar", None),
        "lastSeen": u.get("lastSeen", ""),
    } for u in online])


@app.route("/admin/tickets", methods=["GET"])
def admin_get_tickets():
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    all_tickets = list(tickets.find({}).sort("createdAt", -1))
    return jsonify([serialize_ticket(t) for t in all_tickets])


@app.route("/admin/ticket/<ticket_id>/reply", methods=["POST"])
def admin_reply_ticket(ticket_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    data   = request.json or {}
    reply  = data.get("reply", "").strip()
    status = data.get("status", "resolved")
    if not reply:
        return jsonify({"msg": "Reply cannot be empty"}), 400
    try:
        tickets.update_one({"_id": ObjectId(ticket_id)}, {"$set": {"adminReply": reply, "status": status}})
    except Exception:
        return jsonify({"msg": "Invalid ticket ID"}), 400
    return jsonify({"msg": "Reply sent"})


# Bug 6 fix: admin can delete a ticket
@app.route("/admin/ticket/<ticket_id>", methods=["DELETE"])
def admin_delete_ticket(ticket_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        r = tickets.delete_one({"_id": ObjectId(ticket_id)})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    if r.deleted_count == 0:
        return jsonify({"msg": "Ticket not found"}), 404
    return jsonify({"msg": "Ticket deleted"})


# Bug 6 fix: admin can delete a specific comment from a post by index
@app.route("/admin/connect-post/<post_id>/comment/<int:comment_idx>", methods=["DELETE"])
def admin_delete_comment(post_id, comment_idx):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        p = posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"msg": "Invalid post ID"}), 400
    if not p:
        return jsonify({"msg": "Post not found"}), 404
    comments = p.get("comments", [])
    if comment_idx < 0 or comment_idx >= len(comments):
        return jsonify({"msg": "Comment index out of range"}), 400
    comments.pop(comment_idx)
    posts.update_one({"_id": ObjectId(post_id)}, {"$set": {"comments": comments}})
    return jsonify({"msg": "Comment deleted"})


@app.route("/admin/ticket/<ticket_id>/status", methods=["POST"])
def admin_update_ticket_status(ticket_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    data   = request.json or {}
    status = data.get("status", "open")
    try:
        tickets.update_one({"_id": ObjectId(ticket_id)}, {"$set": {"status": status}})
    except Exception:
        return jsonify({"msg": "Invalid ticket ID"}), 400
    return jsonify({"msg": f"Status updated to {status}"})


@app.route("/admin/connect-posts", methods=["GET"])
def admin_get_posts():
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    all_posts = list(posts.find({}).sort("createdAt", -1))
    return jsonify([serialize_post(p) for p in all_posts])


@app.route("/admin/connect-post/<post_id>", methods=["DELETE"])
def admin_delete_post(post_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        r = posts.delete_one({"_id": ObjectId(post_id)})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    if r.deleted_count == 0:
        return jsonify({"msg": "Post not found"}), 404
    return jsonify({"msg": "Post deleted"})


@app.route("/admin/user/<user_id>/update", methods=["POST"])
def admin_update_user(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    data   = request.json or {}
    fields = {}
    if "name"   in data: fields["name"]   = str(data["name"]).strip()
    if "email"  in data: fields["email"]  = str(data["email"]).strip().lower()
    if "xp"     in data: fields["xp"]     = max(0, int(data["xp"]))
    if "streak" in data: fields["streak"] = max(0, int(data["streak"]))
    if "banned" in data: fields["banned"] = bool(data["banned"])
    if "badges" in data: fields["badges"] = list(data["badges"])
    if "roles"  in data: fields["roles"]  = list(data["roles"])
    if not fields: return jsonify({"msg": "Nothing to update"}), 400
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$set": fields})
    except Exception:
        return jsonify({"msg": "Invalid user ID"}), 400
    u = users.find_one({"_id": ObjectId(user_id)})
    return jsonify({"msg": "Updated", "user": serialize_user(u)})


@app.route("/admin/user/<user_id>/reset-streak", methods=["POST"])
def admin_reset_streak(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$set": {"streak": 0, "maxStreak": 0, "lastActive": ""}})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    return jsonify({"msg": "Streak reset"})


@app.route("/admin/user/<user_id>/reset-xp", methods=["POST"])
def admin_reset_xp(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$set": {"xp": 0}})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    return jsonify({"msg": "XP reset"})


@app.route("/admin/user/<user_id>/reset-all", methods=["POST"])
def admin_reset_all(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$set": {
            "xp": 0, "streak": 0, "maxStreak": 0, "lastActive": "",
            "plans": 0, "qSets": 0, "summaries": 0,
            "badges": [], "featuresUsed": [],
        }})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    return jsonify({"msg": "All stats reset"})


@app.route("/admin/user/<user_id>/give-badge", methods=["POST"])
def admin_give_badge(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    data      = request.json or {}
    badge_id  = data.get("badge_id")
    valid_ids = ["first_plan", "streak3", "streak7", "ten_q", "explorer", "top3"]
    if badge_id not in valid_ids:
        return jsonify({"msg": f"Invalid badge. Valid: {valid_ids}"}), 400
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$addToSet": {"badges": badge_id}})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    return jsonify({"msg": f"Badge '{badge_id}' given"})


@app.route("/admin/user/<user_id>/remove-badge", methods=["POST"])
def admin_remove_badge(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    data     = request.json or {}
    badge_id = data.get("badge_id")
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$pull": {"badges": badge_id}})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    return jsonify({"msg": f"Badge '{badge_id}' removed"})


@app.route("/admin/user/<user_id>/ban", methods=["POST"])
def admin_ban_user(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    data   = request.json or {}
    banned = bool(data.get("banned", True))
    try:
        users.update_one({"_id": ObjectId(user_id)}, {"$set": {"banned": banned}})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    return jsonify({"msg": "User banned" if banned else "User unbanned"})


@app.route("/admin/user/<user_id>/delete", methods=["DELETE"])
def admin_delete_user(user_id):
    _, ok = require_admin()
    if not ok: return jsonify({"msg": "Unauthorized"}), 403
    try:
        r = users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"msg": "Invalid ID"}), 400
    if r.deleted_count == 0:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({"msg": "User deleted permanently"})


# ══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def home():
    return "Zuxter X Backend Running 🚀"



# ══════════════════════════════════════════════════════════════════════════════
# MESSAGING
# ══════════════════════════════════════════════════════════════════════════════

messages_col = db["messages"]
notifications_col = db["notifications"]

def serialize_msg(m):
    return {
        "_id":        str(m["_id"]),
        "fromId":     m.get("fromId", ""),
        "toId":       m.get("toId", ""),
        "fromName":   m.get("fromName", ""),
        "fromAvatar": m.get("fromAvatar", None),
        "text":       m.get("text", ""),
        "seen":       m.get("seen", False),
        "createdAt":  m.get("createdAt", "").isoformat() + "Z" if isinstance(m.get("createdAt"), datetime) else m.get("createdAt", ""),
    }

def serialize_notif(n):
    return {
        "_id":      str(n["_id"]),
        "userId":   n.get("userId", ""),
        "type":     n.get("type", ""),
        "fromName": n.get("fromName", ""),
        "fromId":   n.get("fromId", ""),
        "fromAvatar": n.get("fromAvatar", None),
        "postId":   n.get("postId", ""),
        "text":     n.get("text", ""),
        "seen":     n.get("seen", False),
        "createdAt": n.get("createdAt", "").isoformat() + "Z" if isinstance(n.get("createdAt"), datetime) else n.get("createdAt", ""),
    }

def push_notif(user_id, type_, from_user, extra="", post_id=""):
    notifications_col.insert_one({
        "userId":    user_id,
        "type":      type_,
        "fromId":    str(from_user["_id"]),
        "fromName":  from_user.get("name", ""),
        "fromAvatar": from_user.get("avatar", None),
        "text":      extra,
        "postId":    post_id,
        "seen":      False,
        "createdAt": datetime.utcnow(),
    })

# Send a message
@app.route("/msg/send", methods=["POST"])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data    = request.json or {}
    to_id   = data.get("toId", "").strip()
    text    = data.get("text", "").strip()
    if not to_id or not text:
        return jsonify({"msg": "toId and text required"}), 400
    if len(text) > 2000:
        return jsonify({"msg": "Message too long (max 2000 chars)"}), 400
    u = users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return jsonify({"msg": "User not found"}), 404
    try:
        target = users.find_one({"_id": ObjectId(to_id)})
    except Exception:
        return jsonify({"msg": "Invalid toId"}), 400
    if not target:
        return jsonify({"msg": "Recipient not found"}), 404
    msg_doc = {
        "fromId":     user_id,
        "toId":       to_id,
        "fromName":   u.get("name", ""),
        "fromAvatar": u.get("avatar", None),
        "text":       text,
        "seen":       False,
        "createdAt":  datetime.utcnow(),
    }
    messages_col.insert_one(msg_doc)
    # notification to recipient
    push_notif(to_id, "message", u, text[:60])
    return jsonify({"msg": "Sent"})

# Get conversation between two users
@app.route("/msg/conversation/<other_id>", methods=["GET"])
@jwt_required()
def get_conversation(other_id):
    user_id = get_jwt_identity()
    try:
        msgs = list(messages_col.find({
            "$or": [
                {"fromId": user_id, "toId": other_id},
                {"fromId": other_id, "toId": user_id},
            ]
        }).sort("createdAt", 1).limit(100))
    except Exception:
        return jsonify([])
    # mark as seen
    messages_col.update_many(
        {"fromId": other_id, "toId": user_id, "seen": False},
        {"$set": {"seen": True}}
    )
    return jsonify([serialize_msg(m) for m in msgs])

# Get inbox — list of unique conversations
@app.route("/msg/inbox", methods=["GET"])
@jwt_required()
def get_inbox():
    user_id = get_jwt_identity()
    pipeline = [
        {"$match": {"$or": [{"fromId": user_id}, {"toId": user_id}]}},
        {"$sort": {"createdAt": -1}},
        {"$addFields": {
            "threadKey": {
                "$cond": [{"$lt": ["$fromId", "$toId"]},
                          {"$concat": ["$fromId", "_", "$toId"]},
                          {"$concat": ["$toId", "_", "$fromId"]}]
            }
        }},
        {"$group": {
            "_id": "$threadKey",
            "lastMsg": {"$first": "$$ROOT"},
        }},
        {"$sort": {"lastMsg.createdAt": -1}},
        {"$limit": 30}
    ]
    threads = list(messages_col.aggregate(pipeline))
    result = []
    for t in threads:
        lm = t["lastMsg"]
        other_id = lm["toId"] if lm["fromId"] == user_id else lm["fromId"]
        try:
            other = users.find_one({"_id": ObjectId(other_id)}, {"name": 1, "avatar": 1, "lastSeen": 1})
        except Exception:
            continue
        if not other:
            continue
        unread = messages_col.count_documents({"fromId": other_id, "toId": user_id, "seen": False})
        result.append({
            "otherId":     str(other["_id"]),
            "otherName":   other.get("name", ""),
            "otherAvatar": other.get("avatar", None),
            "lastText":    lm.get("text", ""),
            "lastTime":    lm.get("createdAt", "").isoformat() + "Z" if isinstance(lm.get("createdAt"), datetime) else lm.get("createdAt", ""),
            "unread":      unread,
            "isMine":      lm["fromId"] == user_id,
        })
    return jsonify(result)

# Unread message count
@app.route("/msg/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count = messages_col.count_documents({"toId": user_id, "seen": False})
    return jsonify({"count": count})

# ══════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifs = list(notifications_col.find({"userId": user_id, "type": {"$ne": "message"}}).sort("createdAt", -1).limit(30))
    return jsonify([serialize_notif(n) for n in notifs])

@app.route("/notifications/mark-seen", methods=["POST"])
@jwt_required()
def mark_notifs_seen():
    user_id = get_jwt_identity()
    notifications_col.update_many({"userId": user_id, "seen": False, "type": {"$ne": "message"}}, {"$set": {"seen": True}})
    return jsonify({"ok": True})

@app.route("/notifications/unread-count", methods=["GET"])
@jwt_required()
def notif_unread_count():
    user_id = get_jwt_identity()
    count = notifications_col.count_documents({"userId": user_id, "seen": False, "type": {"$ne": "message"}})
    return jsonify({"count": count})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
