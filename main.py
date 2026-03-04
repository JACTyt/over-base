import json
import random
from fastapi import FastAPI


app = FastAPI()

@app.post("/draft")
def post_draft(count: int = 2):
    return {"drafted_heroes": draft_hero(count)}


with open("data/heroes.json") as f:
    heroes = json.load(f)

with open("data/skills.json") as f:
    skills = json.load(f)

with open("data/compositions.json") as f:
    comps = json.load(f)


def get_hero_by_id(hero_id):
    for hero in heroes:
        if hero["id"] == hero_id:
            return hero
    return None

def get_skill_by_id(skill_id):
    for skill in skills:
        if skill["id"] == skill_id:
            return skill
    return None

def get_comp_by_id(comp_id):
    for comp in comps:
        if comp["id"] == comp_id:
            return comp
    return None


def draft_hero(count = 2):
    drafted = []
    for i in range(count):
        id = random.choice(heroes)["id"]
        drafted.append(id)
    return drafted

def draft_hero_by_role(hero_type, count = 2):
    drafted = []
    filtered_heroes = [hero for hero in heroes if hero["role"] == hero_type]
    for i in range(count):
        id = random.choice(filtered_heroes)["id"]
        drafted.append(id)
    return drafted

print("Drafted Heroes:")
for hero_id in draft_hero():
    hero = get_hero_by_id(hero_id)
    print(f"- {hero['name']} (ID: {hero['id']})")


print("\nDrafted Warriors:")
for hero_id in draft_hero_by_role("support"):
    hero = get_hero_by_id(hero_id)
    print(f"- {hero['name']} (ID: {hero['id']})")

def command_help():
    print("Available commands:")
    print("- help: Show this help message")
    print("- draft: Draft random heroes")
    print("- draft_role <role>: Draft random heroes of a specific role (e.g., 'draft_role support')")
    print("- exit: Exit the program")

def main_cycle():
    command_help()
    while True:
        args = input("\nEnter command: ").strip().split()
        print(f"Received command: {args}")
        if not args:
            continue

        match args[0]:
            case "help":
                command_help()
            case "draft":
                print("Drafted Heroes:")
                for hero_id in draft_hero():
                    hero = get_hero_by_id(hero_id)
                    print(f"- {hero['name']} (ID: {hero['id']})")
            case "draft_role":
                role = args[1] if len(args) > 1 else None
                if not role:
                    print("Please specify a role (e.g., 'draft_role support')")
                    continue
                print(f"Drafted Heroes of role '{role}':")
                for hero_id in draft_hero_by_role(role):
                    hero = get_hero_by_id(hero_id)
                    print(f"- {hero['name']} (ID: {hero['id']})")
            case "exit":
                break


if __name__ == "__main__":
    main_cycle()
