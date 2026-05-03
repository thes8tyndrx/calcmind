import os
import json

src_dir = "/home/satyendra-pc/steno fixed json"
dest_dir = "/home/satyendra-pc/mathscalc/calcmind-app/public/quiz/ssc-steno/english"

os.makedirs(dest_dir, exist_ok=True)

files = [f for f in os.listdir(src_dir) if f.endswith('.json')]

name_mapping = {
    "ssc_steno_2025_synonyms_final_fixed.json": "Synonyms.json",
    "ssc_steno_2025_antonyms_final_fixed.json": "Antonyms.json",
    "ssc_steno_2025_idioms_and_phrases_final_fixed.json": "Idioms.json",
    "ssc_steno_2025_one_word_substitution_final_fixed.json": "OneWord.json",
    "ssc_steno_2025_spelling_correction_final_fixed.json": "Spelling check.json",
    "ssc_steno_2025_homonym_final_fixed.json": "Homonyms.json",
    "ssc_steno_2025_fill_in_the_blanks_final_fixed.json": "Fillinthe blanks.json",
    "ssc_steno_2025_active_passive_final_fixed.json": "Active Passive.json",
    "ssc_steno_2025_direct_indirect_speech_final_fixed.json": "Narration.json",
    "ssc_steno_2025_sentence_improvement_final_fixed.json": "Sentence Improvement.json",
    "ssc_steno_2025_error_spotting_final_fixed.json": "Spot the Error.json",
    "ssc_steno_2025_sentence_correction_final_fixed.json": "Sentence Correction.json",
    "ssc_steno_2025_sentence_rearrangement_final_fixed.json": "Para Jumbles.json"
}

for f in files:
    if f not in name_mapping:
        continue
    
    src_path = os.path.join(src_dir, f)
    dest_path = os.path.join(dest_dir, name_mapping[f])
    
    with open(src_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
        
    if "quiz" in data and "questions" in data["quiz"]:
        # Reverse the questions
        data["quiz"]["questions"].reverse()
        
        # Write to destination
        with open(dest_path, 'w', encoding='utf-8') as outfile:
            json.dump(data, outfile, indent=2, ensure_ascii=False)
        print(f"Processed and reversed: {f} -> {name_mapping[f]}")
