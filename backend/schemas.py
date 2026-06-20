from pydantic import BaseModel, EmailStr
from typing import Optional, List

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    dob: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str  # Frontend uses username (email)
    password: str

class UserProfile(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dob: Optional[str] = None

# Session Schemas
class SessionCreate(BaseModel):
    code: str
    result: str
    label: str
    readability: Optional[int] = None
    security: Optional[int] = None
    performance: Optional[int] = None
    maintainability: Optional[int] = None
    overall_score: Optional[int] = None

class SessionResponse(BaseModel):
    id: int
    user_id: int
    code: Optional[str] = None
    result: Optional[str] = None
    label: Optional[str] = None
    date: str
    readability: Optional[int] = None
    security: Optional[int] = None
    performance: Optional[int] = None
    maintainability: Optional[int] = None
    overall_score: Optional[int] = None

    class Config:
        from_attributes = True
class HealthResponse(BaseModel):
    overall_score: Optional[int] = None
    readability: Optional[int] = None
    security: Optional[int] = None
    performance: Optional[int] = None
    maintainability: Optional[int] = None
# History Schemas
class HistoryResponse(BaseModel):
    id: int
    user_id: int
    code: Optional[str] = None
    result: Optional[str] = None
    label: Optional[str] = None
    date: str
    
    health: Optional[HealthResponse] = None

    class Config:
        from_attributes = True

# Analysis / LLM Schemas
class ReviewRequest(BaseModel):
    code: str
    prompt: Optional[str] = None
    label: Optional[str] = None
    save_history: Optional[bool] = True

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_instruction: Optional[str] = None
