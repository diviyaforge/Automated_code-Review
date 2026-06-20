from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
import models
import schemas
from services.llm_service import review_code as llm_review, chat_with_ai
from services.code_health import calculate_health

router = APIRouter(prefix="/api/analysis", tags=["Code Analysis"])


@router.post("/review")
async def review_code(
    request: schemas.ReviewRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code = request.code
    label = request.label or "Code Review"
    custom_prompt = request.prompt or "Review this code for quality, correctness and performance."

    try:
        result_text = llm_review(code=code, custom_prompt=custom_prompt)

        health = calculate_health(code)

        if request.save_history:
            history_entry = models.History(
                user_id=current_user.id,
                code=code,
                result=result_text,
                label=label,
                readability=health["readability"],
                security=health["security"],
                performance=health["performance"],
                maintainability=health["maintainability"],
                overall_score=health["overall_score"]
            )
            db.add(history_entry)
            db.commit()
            db.refresh(history_entry)

        return {
            "result": result_text,
            "label": label,
            "health": health
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing review: {str(e)}"
        )


@router.post("/chat")
async def chat_assistant(
    request: schemas.ChatRequest,
    current_user: models.User = Depends(get_current_user)
):
    messages = request.messages
    system_instruction = request.system_instruction or (
        "You are a helpful AI coding assistant. Answer questions about code clearly and concisely. "
        "Format code examples with triple backticks. Be precise and conversational."
    )

    if not messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages history cannot be empty."
        )

    try:
        result_text = chat_with_ai(
            messages=messages,
            system_instruction=system_instruction
        )
        return {"result": result_text}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running chat: {str(e)}"
        )
