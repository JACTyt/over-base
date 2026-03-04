from fastapi import FastAPI
import uvicorn
from routes.drafts import router as draft_router 
from routes.skills import router as skills_router

app = FastAPI()

def start_server(app):
    uvicorn.run(app, host="127.0.0.1", port=8000)

app.include_router(draft_router)
app.include_router(skills_router)   


if __name__ == "__main__":
    start_server(app)
