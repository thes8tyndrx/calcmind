import json
import re

def load_sys_dict():
    words = set()
    try:
        with open('/usr/share/dict/words', 'r') as f:
            for line in f:
                w = line.strip().lower()
                if len(w) > 1: words.add(w)
    except: pass
    common = ["a", "the", "to", "and", "is", "of", "in", "that", "it", "for", "on", "was", "with", "as", "at", "be", "this", "have", "from", "or", "one", "had", "by", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "water", "been", "called", "who", "oil", "its", "now", "find", "reptile", "slough", "actors", "waited", "director", "signal", "producing", "sound", "artisan", "applied", "layer", "thin", "surface", "wooden", "season", "changed"]
    words.update(common)
    return words

def segment_word(s, dictionary, memo):
    if not s: return []
    if s in memo: return memo[s]
    for i in range(len(s), 0, -1):
        prefix = s[:i]
        p_low = prefix.lower()
        if (len(p_low) > 1 and p_low in dictionary) or p_low in ['a', 'i']:
            suffix = s[i:]
            if not suffix:
                memo[s] = [prefix]
                return [prefix]
            res = segment_word(suffix, dictionary, memo)
            if res is not None:
                memo[s] = [prefix] + res
                return memo[s]
    memo[s] = None
    return None

def repair_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # PHASE 1: HEALING - Join EVERYTHING that is not a word
    # This regex joins sequences like "pt i le" or "a ctors"
    # It joins any letter sequence that is separated by spaces but not in dictionary
    dictionary = load_sys_dict()
    
    def heal(text):
        # Join words that are 1-2 chars long and NOT in common small words list
        small_safe = {"a", "i", "to", "is", "in", "on", "at", "of", "as", "by", "it", "be", "he", "so", "up", "if", "me", "my", "do", "no", "an", "or", "am"}
        def healer(match):
            parts = match.group(0).split()
            res = [parts[0]]
            for p in parts[1:]:
                # If either the current tail or the new piece is not a safe small word, join them
                if res[-1].lower() not in small_safe or p.lower() not in small_safe:
                    res[-1] += p
                else:
                    res.append(p)
            return " ".join(res)
        
        # Match sequences of short words (1-4 chars) separated by spaces
        return re.sub(r'\b[a-zA-Z]{1,4}(?:\s+[a-zA-Z]{1,4}){1,}\b', healer, text)

    # Clean the file first
    content = heal(content)
    
    data = json.loads(content)
    
    def process_str(s):
        def replacer(match):
            word = match.group(0)
            if word.lower() in dictionary: return word
            memo = {}
            res = segment_word(word, dictionary, memo)
            return " ".join(res) if res else word
        return re.sub(r'[a-zA-Z]{6,}', replacer, s)

    def process(obj):
        if isinstance(obj, dict): return {k: process(v) for k, v in obj.items()}
        if isinstance(obj, list): return [process(v) for v in obj]
        if isinstance(obj, str): return process_str(obj)
        return obj

    fixed_data = process(data)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    repair_json('/home/satyendra-pc/mathscalc/calcmind-app/src/data/quiz/vocab_data.json')
