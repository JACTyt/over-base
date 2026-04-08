from fastapi import FastAPI
import uvicorn
from routes.drafts import router as draft_router 
from routes.skills import router as skills_router
from routes.battle_predictor import router as battle_predictor_router
from routes.heroes import router as heroes_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def start_server(app):
    uvicorn.run(app, host="127.0.0.1", port=8000)

app.include_router(draft_router)
app.include_router(skills_router)
app.include_router(battle_predictor_router)   
app.include_router(heroes_router)


if __name__ == "__main__":
    start_server(app)
