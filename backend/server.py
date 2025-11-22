from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os
import json

import traceback

app = Flask(__name__)
CORS(app)



@app.route("/run", methods=["POST"])
def run_code():
    try:
        data = request.get_json()
    language = data.get("language")
    code = data.get("code")
    user_input = data.get("input", "")

    if not code or not language:
        return jsonify({"error": "Missing language or code"}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = os.path.join(tmpdir, "input.txt")
        if user_input:
            with open(input_file, "w") as f:
                f.write(user_input)

        if language == "python":
            code_file = os.path.join(tmpdir, "code.py")
            with open(code_file, "w") as f:
                f.write(code)
            cmd = ["python", code_file]

        elif language == "cpp":
            code_file = os.path.join(tmpdir, "code.cpp")
            exe_file = os.path.join(tmpdir, "program.exe")
            with open(code_file, "w") as f:
                f.write(code)
            compile_proc = subprocess.run(["g++", code_file, "-o", exe_file], capture_output=True, text=True)
            if compile_proc.returncode != 0:
                return jsonify({"output": compile_proc.stderr})
            cmd = [exe_file]
        else:
            return jsonify({"output": "Unsupported language"}), 400

        try:
            result = subprocess.run(
                cmd,
                input=user_input.encode() if user_input else None,
                capture_output=True,
                text=True,
                timeout=5
            )
            output = result.stdout or result.stderr
        except subprocess.TimeoutExpired:
            output = "⏰ Execution timed out."

        return jsonify({"output": output})
    except Exception as e:
        # Log full traceback to server console for debugging
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500








@app.route("/status", methods=["GET"])
def status():
    # return basic server status and list of registered routes
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(str(rule))
    return jsonify({"status": "ok", "routes": routes})

@app.route("/")
def home():
    return "Backend running on port 5001"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

