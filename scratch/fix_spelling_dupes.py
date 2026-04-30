import json
import random

def create_typo(word):
    if len(word) < 3: return word + "x"
    # Swap two adjacent characters in the middle
    idx = random.randint(1, len(word) - 2)
    chars = list(word)
    chars[idx], chars[idx+1] = chars[idx+1], chars[idx]
    return "".join(chars)

def main():
    path = '/home/satyendra-pc/mathscalc/calcmind-app/src/data/quiz/vocab_data.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    fixed_count = 0
    for topic in data:
        if 'Spelling' in topic:
            for q in data[topic]:
                opts = q['options']
                seen = set()
                # ans is the key of the correct answer, like 'a', 'b', 'c', 'd'
                ans_key = q['answer']
                ans_word = opts[ans_key]
                
                for k, v in list(opts.items()):
                    if v in seen:
                        # Duplicate found! We need to make it wrong.
                        # It shouldn't be the correct answer key. If it is, we mutate the OTHER one.
                        # But we just iterate.
                        if k == ans_key:
                            # We can't mutate the correct answer. 
                            # We must have mutated an earlier occurrence that wasn't the answer.
                            pass 
                        else:
                            # Mutate this one
                            new_v = create_typo(v)
                            while new_v in seen or new_v == ans_word:
                                new_v = create_typo(new_v)
                            opts[k] = new_v
                            fixed_count += 1
                            print(f"Fixed {v} -> {new_v} in {q['id']}")
                    seen.add(opts[k])

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Fixed {fixed_count} duplicate spelling options.")

if __name__ == '__main__':
    main()
