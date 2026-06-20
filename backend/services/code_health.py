import ast

def calculate_health(code):
    score = 100

    try:
        ast.parse(code)
    except:
        score -= 40

    lines = len(code.splitlines())

    readability = max(50, 100 - lines)
    security = 90
    performance = 80
    maintainability = 85

    return {
        "overall_score": (
            readability +
            security +
            performance +
            maintainability
        ) // 4,
        "readability": readability,
        "security": security,
        "performance": performance,
        "maintainability": maintainability
    }