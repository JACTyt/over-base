from fastapi import APIRouter
from pydantic import BaseModel
from .drafts import get_hero_by_id
from .skills import get_skills_by_hero_id
import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class BattlePredictRequest(BaseModel):
    hero1_id: int
    hero2_id: int

class BattlePredictResponse(BaseModel):
    story: str
    winner: str

@router.post('/battle_predict', response_model=BattlePredictResponse)
def battle_predict(request: BattlePredictRequest):
    # Get hero information
    hero1 = get_hero_by_id(request.hero1_id)
    hero2 = get_hero_by_id(request.hero2_id)
    
    # Get skills for both heroes
    hero1_skills_data = get_skills_by_hero_id(request.hero1_id)
    hero2_skills_data = get_skills_by_hero_id(request.hero2_id)
    
    # Format hero information for the prompt
    hero1_info = f"Hero 1: {hero1.get('name', 'Unknown')} (Role: {hero1.get('role', 'Unknown')})"
    hero1_skills = hero1_skills_data.get('skills', []) if hero1_skills_data else []
    hero1_ultimate = hero1_skills_data.get('ultimate', '') if hero1_skills_data else ''
    hero1_skills_info = f"Skills: {', '.join(hero1_skills)}\nUltimate: {hero1_ultimate}"
    
    hero2_info = f"Hero 2: {hero2.get('name', 'Unknown')} (Role: {hero2.get('role', 'Unknown')})"
    hero2_skills = hero2_skills_data.get('skills', []) if hero2_skills_data else []
    hero2_ultimate = hero2_skills_data.get('ultimate', '') if hero2_skills_data else ''
    hero2_skills_info = f"Skills: {', '.join(hero2_skills)}\nUltimate: {hero2_ultimate}"
    
    # Create the prompt for OpenAI
    prompt = f"""You are a battle narrator and analyst. Two heroes are about to fight.

{hero1_info}
{hero1_skills_info}

{hero2_info}
{hero2_skills_info}

Generate an epic battle story between these two heroes, considering their roles and skills. The story should be engaging and dramatic (200-300 words). Then determine which hero would win based on their abilities.

Respond ONLY with a valid JSON object in this exact format:
{{
    "story": "Your epic battle story here...",
    "winner": "Hero name who wins"
}}"""

    try:
        # Call OpenAI Chat API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a creative battle narrator who responds only in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        # Parse the response
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON from the response
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:].strip()
        
        result = json.loads(content)
        
        return BattlePredictResponse(
            story=result.get("story", ""),
            winner=result.get("winner", "")
        )
        
    except json.JSONDecodeError as e:
        # Fallback if JSON parsing fails
        return BattlePredictResponse(
            story=f"Error parsing battle result: {str(e)}",
            winner="Unknown"
        )
    except Exception as e:
        return BattlePredictResponse(
            story=f"Error generating battle: {str(e)}",
            winner="Unknown"
        )


