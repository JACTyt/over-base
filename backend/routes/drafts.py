import json
import random
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from enum import Enum


class Role(str, Enum):
    tank = "tank"
    damage = "damage"
    support = "support"

router = APIRouter()

class draftRequest(BaseModel):
    count: Optional[int] = 2
    role: Optional[Role] = None 

with open("data/heroes.json") as f:
    heroes = json.load(f)

def get_hero_by_id(hero_id):
    for hero in heroes:
        if hero["id"] == hero_id:
            return hero
    return None

@router.post("/draft")
def draft_hero(request: draftRequest):
    drafted = []
    for i in range(request.count):
        id = random.choice(heroes)["id"]
        drafted.append(id)
    return drafted

@router.post("/draft_role")
def draft_hero_by_role(request: draftRequest):
    drafted = []
    filtered_heroes = [hero for hero in heroes if hero["role"] == request.role]
    for i in range(request.count):
        id = random.choice(filtered_heroes)["id"]
        drafted.append(id)
    return drafted
