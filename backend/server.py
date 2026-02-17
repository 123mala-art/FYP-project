from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os
import json
import traceback
from datetime import datetime, timedelta
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import sys
import platform

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'devstudio-secret-key-2025-change-in-production'

# In-memory storage
users = []
shared_codes = {}

# ==================== AUTH DECORATOR ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = next((u for u in users if u['id'] == data['user_id']), None)
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# ==================== AUTH ROUTES ====================

@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        print(f"📝 Signup request received: {data}")  # Debug log
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        username = data.get('username', '').strip()
        
        print(f"✉️ Email: {email}")  # Debug
        print(f"👤 Username: {username}")  # Debug
        print(f"🔑 Password length: {len(password)}")  # Debug
        
        if not email or not password or not username:
            return jsonify({'message': 'All fields are required'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        if any(u['email'] == email for u in users):
            return jsonify({'message': 'Email already registered'}), 400
        
        hashed_password = generate_password_hash(password)
        
        user = {
            'id': len(users) + 1,
            'email': email,
            'username': username,
            'password': hashed_password,
            'created_at': datetime.utcnow().isoformat()
        }
        
        users.append(user)
        print(f"✅ User created: {user['username']}")  # Debug
        print(f"📊 Total users: {len(users)}")  # Debug
        
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'message': 'Account created successfully',
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'username': user['username']
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Signup error: {str(e)}")  # Debug
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        print(f"🔐 Login request received: {data}")  # Debug log
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        print(f"✉️ Email: {email}")  # Debug
        print(f"🔑 Password provided: {bool(password)}")  # Debug
        print(f"📊 Total users in system: {len(users)}")  # Debug
        
        if not email or not password:
            return jsonify({'message': 'Email and password required'}), 400
        
        user = next((u for u in users if u['email'] == email), None)
        
        if not user:
            print(f"❌ User not found with email: {email}")  # Debug
            return jsonify({'message': 'Invalid credentials'}), 401
        
        print(f"👤 User found: {user['username']}")  # Debug
        
        if not check_password_hash(user['password'], password):
            print(f"❌ Password mismatch")  # Debug
            return jsonify({'message': 'Invalid credentials'}), 401
        
        print(f"✅ Password correct")  # Debug
        
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'username': user['username']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {str(e)}")  # Debug
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@app.route("/api/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    return jsonify({
        'id': current_user['id'],
        'email': current_user['email'],
        'username': current_user['username'],
        'created_at': current_user['created_at']
    }), 200


# ==================== CODE EXECUTION (FIXED) ====================

@app.route("/run", methods=["POST"])
def run_code():
    try:
        data = request.get_json()
        language = data.get("language")
        code = data.get("code")
        user_input = data.get("input", "")

        print(f"🚀 Running {language} code...")  # Debug
        print(f"📝 Code length: {len(code)}")  # Debug

        if not code or not language:
            return jsonify({"error": "Missing language or code"}), 400

        with tempfile.TemporaryDirectory() as tmpdir:
            if language == "python":
                code_file = os.path.join(tmpdir, "code.py")
                with open(code_file, "w", encoding='utf-8') as f:
                    f.write(code)
                
                # Use the correct Python command
                python_cmd = sys.executable  # Use current Python interpreter
                cmd = [python_cmd, code_file]
                print(f"🐍 Python command: {cmd}")  # Debug

            elif language == "cpp":
                code_file = os.path.join(tmpdir, "code.cpp")
                
                # Different executable name for Windows vs Unix
                if platform.system() == "Windows":
                    exe_file = os.path.join(tmpdir, "program.exe")
                else:
                    exe_file = os.path.join(tmpdir, "program")
                
                with open(code_file, "w", encoding='utf-8') as f:
                    f.write(code)
                
                # Compile C++ code
                print(f"🔨 Compiling C++ code...")  # Debug
                compile_proc = subprocess.run(
                    ["g++", code_file, "-o", exe_file], 
                    capture_output=True, 
                    text=True,
                    timeout=10
                )
                
                if compile_proc.returncode != 0:
                    print(f"❌ Compilation failed: {compile_proc.stderr}")  # Debug
                    return jsonify({"output": "❌ Compilation Error:\n" + compile_proc.stderr})
                
                print(f"✅ Compilation successful")  # Debug
                cmd = [exe_file]
                
            else:
                return jsonify({"output": "Unsupported language. Use JavaScript in browser."}), 400

            try:
                print(f"⚙️ Executing: {' '.join(cmd)}")  # Debug
                result = subprocess.run(
                    cmd,
                    input=user_input if user_input else None,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                output = result.stdout if result.stdout else result.stderr
                if not output:
                    output = "✅ Executed successfully (no output)"
                
                print(f"✅ Execution complete")  # Debug
                print(f"📤 Output: {output[:100]}...")  # Debug (first 100 chars)
                
            except subprocess.TimeoutExpired:
                output = "⏰ Execution timed out (5 seconds)"
                print(f"⏰ Timeout occurred")  # Debug
            except FileNotFoundError as e:
                output = f"❌ Error: {str(e)}. Make sure Python/g++ is installed and in PATH."
                print(f"❌ File not found: {e}")  # Debug

            return jsonify({"output": output})
            
    except Exception as e:
        print(f"❌ Execution error: {str(e)}")  # Debug
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==================== AI ASSISTANT (FIXED) ====================

@app.route("/ai", methods=["POST"])
def ai_query():
    try:
        data = request.get_json()
        query = data.get("query", "").strip()
        
        print(f"🤖 AI Query: {query}")  # Debug
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Enhanced AI responses
        query_lower = query.lower()
        answer = None
        
        # Greeting responses
        if any(word in query_lower for word in ["hello", "hi", "hey"]):
            answer = "Hello! 👋 I'm your DevStudio AI assistant. I can help you with:\n• Debugging code\n• Explaining programming concepts\n• Writing code snippets\n• Best practices\n• Algorithm explanations\n\nWhat would you like to know?"
        
        # Help responses
        elif "help" in query_lower:
            answer = "I'm here to help! 🚀\n\nI can assist with:\n1. Debugging errors in your code\n2. Explaining programming concepts\n3. Writing code examples\n4. Optimizing code\n5. Best practices\n6. Algorithm design\n\nJust ask me anything specific!"
        
        # Python questions
        elif "python" in query_lower:
            if "loop" in query_lower:
                answer = "Python Loops:\n\n1. For Loop:\nfor i in range(5):\n    print(i)\n\n2. While Loop:\nwhile condition:\n    # code\n\n3. List Comprehension:\n[x for x in range(10)]"
            elif "function" in query_lower:
                answer = "Python Functions:\n\ndef my_function(param1, param2):\n    result = param1 + param2\n    return result\n\n# Call the function\noutput = my_function(5, 3)"
            else:
                answer = "Python is a high-level programming language known for:\n• Simple, readable syntax\n• Dynamic typing\n• Extensive standard library\n• Great for beginners\n• Used in web dev, AI, data science\n\nNeed help with specific Python code?"
        
        # JavaScript questions
        elif "javascript" in query_lower or "js" in query_lower:
            if "array" in query_lower:
                answer = "JavaScript Arrays:\n\nlet arr = [1, 2, 3, 4];\narr.push(5);  // Add to end\narr.pop();    // Remove from end\narr.map(x => x * 2);  // Transform\narr.filter(x => x > 2);  // Filter"
            elif "function" in query_lower:
                answer = "JavaScript Functions:\n\n// Function Declaration\nfunction greet(name) {\n    return `Hello ${name}`;\n}\n\n// Arrow Function\nconst greet = (name) => `Hello ${name}`;"
            else:
                answer = "JavaScript is the language of the web! 🌐\n• Runs in browsers\n• Also on servers (Node.js)\n• Event-driven\n• Asynchronous programming\n• Dynamic and flexible\n\nWhat would you like to know?"
        
        # C++ questions
        elif "c++" in query_lower or "cpp" in query_lower:
            if "pointer" in query_lower:
                answer = "C++ Pointers:\n\nint x = 10;\nint* ptr = &x;  // Pointer to x\ncout << *ptr;   // Dereference (prints 10)\n\n// Dynamic memory\nint* arr = new int[5];\ndelete[] arr;"
            elif "class" in query_lower:
                answer = "C++ Classes:\n\nclass MyClass {\nprivate:\n    int value;\npublic:\n    MyClass(int v) : value(v) {}\n    void display() {\n        cout << value;\n    }\n};"
            else:
                answer = "C++ is a powerful language:\n• Fast and efficient\n• Object-oriented\n• Low-level memory control\n• Used in games, systems\n• Compiled language\n\nWhat C++ topic interests you?"
        
        # HTML/CSS questions
        elif "html" in query_lower:
            answer = "HTML Basics:\n\n<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Heading</h1>\n    <p>Paragraph</p>\n</body>\n</html>\n\nNeed help with specific tags?"
        
        elif "css" in query_lower:
            answer = "CSS Basics:\n\n/* Selector */\n.my-class {\n    color: blue;\n    font-size: 16px;\n    margin: 10px;\n}\n\n/* Flexbox */\n.container {\n    display: flex;\n    justify-content: center;\n}"
        
        # Error/Debug help
        elif "error" in query_lower or "bug" in query_lower or "debug" in query_lower:
            answer = "Debugging Tips:\n\n1. Read error message carefully\n2. Check line number\n3. Look for:\n   • Syntax errors (missing ; or brackets)\n   • Variable typos\n   • Type mismatches\n4. Use print statements\n5. Test small pieces of code\n\nShare your error message for specific help!"
        
        # Algorithm questions
        elif "algorithm" in query_lower or "sort" in query_lower:
            answer = "Common Algorithms:\n\n1. Bubble Sort - O(n²)\n2. Quick Sort - O(n log n)\n3. Binary Search - O(log n)\n4. DFS/BFS - Graph traversal\n\nWhich one would you like to learn?"
        
        # General coding help
        elif "code" in query_lower:
            answer = "I can help you code! 💻\n\nTell me:\n• What language?\n• What do you want to build?\n• Any specific problem?\n\nFor example:\n'Write Python code to reverse a string'\n'How to make a function in JavaScript'"
        
        # Default response
        else:
            answer = f"You asked: '{query}'\n\nI'm a coding assistant! I can help with:\n• Python, JavaScript, C++, HTML, CSS\n• Debugging errors\n• Code examples\n• Algorithms\n\nTry asking:\n• 'How do I loop in Python?'\n• 'Explain JavaScript functions'\n• 'Debug my C++ code'\n• 'HTML form example'"
        
        print(f"✅ AI Response sent")  # Debug
        return jsonify({"answer": answer}), 200
        
    except Exception as e:
        print(f"❌ AI error: {str(e)}")  # Debug
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==================== CODE SHARING ====================

@app.route("/share", methods=["POST"])
def share_code():
    try:
        data = request.get_json()
        language = data.get("language")
        code = data.get("code")
        
        if not language or not code:
            return jsonify({"error": "Language and code required"}), 400
        
        import random
        import string
        share_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        shared_codes[share_id] = {
            'language': language,
            'code': code,
            'created_at': datetime.utcnow().isoformat()
        }
        
        print(f"📤 Code shared with ID: {share_id}")  # Debug
        return jsonify({"shareId": share_id}), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/share/<share_id>", methods=["GET"])
def get_shared_code(share_id):
    try:
        shared = shared_codes.get(share_id)
        
        if not shared:
            return jsonify({"error": "Shared code not found"}), 404
        
        return jsonify(shared), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==================== STATUS ====================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "users": len(users),
        "shared_codes": len(shared_codes),
        "python_version": sys.version,
        "platform": platform.system()
    }), 200


@app.route("/", methods=["GET"])
def home():
    return """
    <html>
        <head><title>DevStudio Backend</title></head>
        <body style="font-family: Arial; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h1>🚀 DevStudio Backend</h1>
            <p>Backend is running successfully!</p>
            <h3>Available Endpoints:</h3>
            <ul>
                <li>POST /api/signup - Create account</li>
                <li>POST /api/login - Login</li>
                <li>GET /api/profile - Get profile (auth required)</li>
                <li>POST /run - Execute code (Python, C++)</li>
                <li>POST /ai - AI assistant</li>
                <li>POST /share - Share code</li>
                <li>GET /share/:id - Get shared code</li>
                <li>GET /health - Server status</li>
            </ul>
            <h3>System Info:</h3>
            <p>Registered Users: """ + str(len(users)) + """</p>
            <p>Shared Codes: """ + str(len(shared_codes)) + """</p>
            <p>Python: """ + sys.version + """</p>
            <p>Platform: """ + platform.system() + """</p>
        </body>
    </html>
    """


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 DevStudio Backend Server Starting...")
    print("=" * 60)
    print("📍 Server: http://localhost:5000")
    print("🔐 Auth: /api/login, /api/signup")
    print("💻 Code: /run")
    print("🤖 AI: /ai")
    print("📤 Share: /share")
    print("=" * 60)
    print(f"🐍 Python: {sys.version}")
    print(f"💻 Platform: {platform.system()}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)