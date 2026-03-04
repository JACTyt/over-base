import json
import random
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

HISTORY_LOG = "../data/history.log"

with open("data/skills.json") as f:
    skills_data = json.load(f)


def get_skills_by_hero_id(skill_id):
    for skill in skills_data:
        if skill["hero_id"] == skill_id:
            print(skill)
            return skill
    return None

router = APIRouter()

class skillsRequest(BaseModel):
    count: Optional[int] = 3

@router.post("/skills_combine")
def combine_skills(request: skillsRequest):
    combined = []
    for i in range(request.count):
        hero_skill = get_skills_by_hero_id(random.choice(skills_data)["hero_id"])
        
        all_hero_skills = []
        all_hero_skills.extend(hero_skill["skills"])
        all_hero_skills.append(hero_skill["ultimate"])
        
        combo_skill = [random.choice(all_hero_skills)]
        
        
        combined.append({
            "hero_id": hero_skill["hero_id"],
            "skill": combo_skill
        })
    return {"combination": combined}

bc = skillsRequest()
bc.count = 2
req = combine_skills(bc)
print(req)


@router.post("/skills_ban")
def ban_skills(request: skillsRequest):
    combined = []
    for i in range(request.count):
        hero_skill = get_skills_by_hero_id(random.choice(skills_data)["hero_id"])
        
        all_hero_skills = []
        all_hero_skills.extend(hero_skill["skills"])
        all_hero_skills.append(hero_skill["ultimate"])
        
        banned_skill = [random.choice(all_hero_skills)]
        
        all_hero_skills.remove(banned_skill[0])

        combined.append({
            "hero_id": hero_skill["hero_id"],
            "skills": all_hero_skills,
            "banned_skill": banned_skill
        })
    return {"combination": combined}
