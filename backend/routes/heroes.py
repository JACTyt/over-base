import json
from enum import Enum
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/heroes", tags=["heroes"])


class Role(str, Enum):
    tank = "tank"
    damage = "damage"
    support = "support"


with open("data/heroes-info.json", encoding="utf-8") as heroes_file:
    heroes_data = json.load(heroes_file)

with open("data/skills.json", encoding="utf-8") as skills_file:
    skills_data = json.load(skills_file)

skills_by_hero_id = {item["hero_id"]: item for item in skills_data}


def build_hero_info(hero: dict) -> dict:
    skill_info = skills_by_hero_id.get(hero["id"])
    return {
        "id": hero["id"],
        "name": hero["name"],
        "role": hero["role"],
        "side": hero.get("side", "Unknown"),
        "bio": hero.get("bio", "No biography available."),
        "appearance": hero.get("appearance", "No appearance description available."),
        "skills": skill_info["skills"] if skill_info else [],
        "ultimate": skill_info["ultimate"] if skill_info else None,
    }


@router.get("")
def list_heroes(
    role: Optional[Role] = Query(default=None, description="Optional role filter"),
) -> list[dict]:
    filtered = [hero for hero in heroes_data if role is None or hero["role"] == role]
    return [build_hero_info(hero) for hero in filtered]


@router.get("/{hero_id}")
def get_hero(hero_id: int) -> dict:
    hero = next((item for item in heroes_data if item["id"] == hero_id), None)
    if hero is None:
        raise HTTPException(status_code=404, detail=f"Hero with id {hero_id} not found")

    return build_hero_info(hero)
