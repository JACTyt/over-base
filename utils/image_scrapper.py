import os
import requests
import unicodedata

API_URL = "https://overwatch.fandom.com/api.php"
SAVE_DIR = "icons"

os.makedirs(SAVE_DIR, exist_ok=True)

# -----------------------------
# YOUR HERO LIST
# -----------------------------
heroes = [
    {"id": 1, "name": "Domina"},
    {"id": 2, "name": "D.Va"},
    {"id": 3, "name": "Doomfist"},
    {"id": 4, "name": "Hazard"},
    {"id": 5, "name": "Junker Queen"},
    {"id": 6, "name": "Mauga"},
    {"id": 7, "name": "Orisa"},
    {"id": 8, "name": "Ramattra"},
    {"id": 9, "name": "Reinhardt"},
    {"id": 10, "name": "Roadhog"},
    {"id": 11, "name": "Sigma"},
    {"id": 12, "name": "Winston"},
    {"id": 13, "name": "Wrecking Ball"},
    {"id": 14, "name": "Zarya"},
    {"id": 15, "name": "Anran"},
    {"id": 16, "name": "Emre"},
    {"id": 17, "name": "Vendetta"},
    {"id": 18, "name": "Ashe"},
    {"id": 19, "name": "Bastion"},
    {"id": 20, "name": "Cassidy"},
    {"id": 21, "name": "Echo"},
    {"id": 22, "name": "Freja"},
    {"id": 23, "name": "Genji"},
    {"id": 24, "name": "Hanzo"},
    {"id": 25, "name": "Junkrat"},
    {"id": 26, "name": "Mei"},
    {"id": 27, "name": "Pharah"},
    {"id": 28, "name": "Reaper"},
    {"id": 29, "name": "Sojourn"},
    {"id": 30, "name": "Soldier: 76"},
    {"id": 31, "name": "Sombra"},
    {"id": 32, "name": "Symmmetra"},
    {"id": 33, "name": "Torbjorn"},
    {"id": 34, "name": "Tracer"},
    {"id": 35, "name": "Venture"},
    {"id": 36, "name": "Widowmaker"},
    {"id": 37, "name": "Jetpack Cat"},
    {"id": 38, "name": "Mizuki"},
    {"id": 39, "name": "Ana"},
    {"id": 40, "name": "Baptiste"},
    {"id": 41, "name": "Brigitte"},
    {"id": 42, "name": "Illari"},
    {"id": 43, "name": "Juno"},
    {"id": 44, "name": "Kiriko"},
    {"id": 45, "name": "Lifeweaver"},
    {"id": 46, "name": "Lucio"},
    {"id": 47, "name": "Mercy"},
    {"id": 48, "name": "Moira"},
    {"id": 49, "name": "Wuyang"},
    {"id": 50, "name": "Zenyatta"}
]
# -----------------------------
# NORMALIZATION FUNCTION
# -----------------------------
def normalize(name):
    name = name.lower()
    name = name.replace(":", "")
    name = name.replace(".", "")
    name = name.replace("_", " ")
    name = name.strip()

    # remove accents (Torbjörn → Torbjorn)
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")

    return name


# Create normalized hero name set
hero_name_set = {normalize(h["name"]) for h in heroes}

print("Heroes in list:", hero_name_set)

# -----------------------------
# GET ALL Icon- FILES
# -----------------------------
params = {
    "action": "query",
    "format": "json",
    "list": "allpages",
    "apnamespace": 6,
    "apprefix": "Icon-",
    "aplimit": "max"
}

response = requests.get(API_URL, params=params).json()
files = response["query"]["allpages"]

matched = []

for file in files:
    title = file["title"]  # File:Icon-Genji.png
    
    if not title.endswith(".png"):
        continue

    # Extract hero name
    filename = title.replace("File:Icon-", "").replace(".png", "")
    normalized_file_name = normalize(filename)

    if normalized_file_name in hero_name_set:
        matched.append((title, filename))

print(f"Matched {len(matched)} heroes.")

# -----------------------------
# DOWNLOAD MATCHED
# -----------------------------
for title, filename in matched:

    file_params = {
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url"
    }

    file_response = requests.get(API_URL, params=file_params).json()

    for page in file_response["query"]["pages"].values():
        if "imageinfo" in page:
            image_url = page["imageinfo"][0]["url"]
            print("Downloading:", filename + ".png")

            img = requests.get(image_url).content
            with open(os.path.join(SAVE_DIR, filename + ".png"), "wb") as f:
                f.write(img)

print("Done.")