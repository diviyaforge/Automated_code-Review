def analyze_code(code: str):

    result = {
        "syntax": "Valid",
        "complexity": "O(1)",
        "security": [],
        "bugs": []
    }

    if "eval(" in code:
        result["security"].append(
            "Use of eval() detected"
        )

    if "exec(" in code:
        result["security"].append(
            "Use of exec() detected"
        )

    if code.count("for") >= 2:
        result["complexity"] = "O(n²)"

    elif "for" in code:
        result["complexity"] = "O(n)"

    if "while True" in code:
        result["bugs"].append(
            "Potential infinite loop"
        )

    return result