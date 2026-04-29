#!/usr/bin/env python3
"""
Build vocab_data.json from all JSON files in /home/satyendra-pc/Caclmind Json/
Maps new format to old app-expected format.
"""
import json, os, re

SOURCE_DIR = "/home/satyendra-pc/Caclmind Json"
OUTPUT_FILE = "/home/satyendra-pc/mathscalc/calcmind-app/src/data/quiz/vocab_data.json"

# Mapping: (title_keyword, exam_type) -> vocab_data key
# The app uses these keys: 'Antonyms', 'Synonyms', 'Idioms', 'OneWord Substitution',
#                          'Spelling check', 'Homonyms', 'Fillinthe blanks'
# New CHSL keys we'll add: 'Antonyms CHSL', 'Synonyms CHSL', 'Idioms CHSL',
#                          'OneWord CHSL', 'Spelling CHSL',
#                          'Active Passive', 'Narration', 'Sentence Improvement',
#                          'Spot the Error'

FILE_TO_KEY = {
    # CGL files
    "AntonymncGL2025.json":         "Antonyms",        # but filename is lowercase mix
    "Antonymncgl2025.json":          "Antonyms",
    "Synoymncgl2025.json":           "Synonyms",
    "Idiomscgl2025.json":            "Idioms",
    "OneWordcgl2025.json":           "OneWord Substitution",
    "SpellingCGL2025.json":          "Spelling check",
    "HomonymcgL2025.json":           "Homonyms",
    "Homonymcgl2025.json":           "Homonyms",
    "FillintehblacnkCGL2025.json":   "Fillinthe blanks",
    "ActivePassiveCGL2025.json":     "Active Passive",
    "NarrationCGL2025.json":         "Narration",
    "SentenceImprovementCGL2025.json": "Sentence Improvement",
    "SpottheerrorcGL2025.json":      "Spot the Error",
    "Spottheerrorcgl2025.json":      "Spot the Error",
    # CHSL files
    "AntonymsCHSL2025.json":         "Antonyms CHSL",
    "SynonymsCHSL2025.json":         "Synonyms CHSL",
    "idiomschsl2025.json":           "Idioms CHSL",
    "OneWordCHSL2025.json":          "OneWord CHSL",
    "spellingerror.json":            "Spelling CHSL",
}

def clean_text(t):
    if not t: return ""
    t = re.sub(r'www\.ssccglpinnacle\.com', '', t, flags=re.IGNORECASE)
    t = re.sub(r'Download Pinnacle Exam Preparation App', '', t, flags=re.IGNORECASE)
    t = re.sub(r'Pinnacle\s+English', '', t, flags=re.IGNORECASE)
    # Clean up **bold** markdown -> keep as-is (app handles it)
    return t.strip()

def convert_question(q, key, idx, exam_tag):
    """Convert new JSON format to old app format."""
    raw_opts = q.get("options", [])
    
    # New format: options is a list
    if isinstance(raw_opts, list):
        opts_dict = {}
        letters = ['a', 'b', 'c', 'd']
        for i, opt in enumerate(raw_opts[:4]):
            opts_dict[letters[i]] = clean_text(str(opt))
        
        # answer is the string value, map to letter
        ans_val = clean_text(str(q.get("answer", "")))
        ans_letter = "a"
        for letter, val in opts_dict.items():
            if val.strip().lower() == ans_val.strip().lower():
                ans_letter = letter
                break
    else:
        # Old format: options is already a dict
        opts_dict = {k: clean_text(v) for k, v in raw_opts.items()}
        ans_letter = q.get("answer", "a")

    topic_label = key  # Use the key as topic label
    
    return {
        "id": f"{key.lower().replace(' ', '_')}_{idx}",
        "num": str(idx),
        "question": clean_text(q.get("question", "")),
        "options": opts_dict,
        "exam": exam_tag,
        "topic": topic_label,
        "answer": ans_letter,
        "explanation": clean_text(q.get("explanation", ""))
    }

def main():
    result = {}
    
    files = sorted(os.listdir(SOURCE_DIR))
    
    for fname in files:
        if not fname.endswith('.json'):
            continue
        
        key = FILE_TO_KEY.get(fname)
        if not key:
            print(f"  SKIP (no mapping): {fname}")
            continue
        
        fpath = os.path.join(SOURCE_DIR, fname)
        try:
            data = json.load(open(fpath, encoding='utf-8'))
        except Exception as e:
            print(f"  ERROR loading {fname}: {e}")
            continue
        
        if not isinstance(data, dict) or 'quiz' not in data:
            print(f"  ERROR: {fname} has unexpected structure")
            continue
        
        quiz = data['quiz']
        questions = quiz.get('questions', [])
        
        # Determine exam tag from title
        title = quiz.get('title', '')
        if 'CHSL' in title:
            exam_tag = "SSC CHSL 2025"
        else:
            exam_tag = "SSC CGL 2025"
        
        converted = []
        for i, q in enumerate(questions, 1):
            try:
                c = convert_question(q, key, i, exam_tag)
                converted.append(c)
            except Exception as e:
                print(f"  WARNING: skipping q#{i} in {fname}: {e}")
        
        if key in result:
            # Merge (shouldn't happen with clean mapping, but just in case)
            result[key].extend(converted)
            print(f"  MERGED {fname} -> {key} (+{len(converted)} = {len(result[key])} total)")
        else:
            result[key] = converted
            print(f"  OK: {fname} -> {key} ({len(converted)} questions)")
    
    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== Done! Written to {OUTPUT_FILE} ===")
    print(f"Topics: {list(result.keys())}")
    total = sum(len(v) for v in result.values())
    print(f"Total questions: {total}")
    for k, v in result.items():
        print(f"  {k}: {len(v)}")

if __name__ == "__main__":
    main()
