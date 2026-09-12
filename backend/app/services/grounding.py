import difflib
import re
from typing import Dict, List, Set, Tuple
from app.schemas.cv import StructuredCv
from app.schemas.tailor import GroundingBulletResult

COMMON_STOP_WORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about",
    "between", "into", "through", "during", "before", "after", "above", "below", "from", "up",
    "down", "of", "off", "over", "under", "again", "further", "then", "once", "here", "there",
    "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "can", "will", "just", "should", "now", "be", "is", "are", "was", "were", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "our", "their", "we", "you"
}


def _clean_tokens(text: str) -> Set[str]:
    """Extracts non-stop lowercase alphanumeric words."""
    words = re.findall(r"\b[a-zA-Z0-9\+\#\.\-]{2,}\b", text.lower())
    return {w for w in words if w not in COMMON_STOP_WORDS}


def _extract_metrics(text: str) -> Set[str]:
    """Finds numbers, percentages, and metrics like 42%, 150k, $10M, 65ms."""
    return set(re.findall(r"\b\d+[\.\d]*\s*(?:%|k|m|b|ms|s|x|gb|mb|users|pts)?\b", text.lower()))


def compute_bullet_similarity(original_text: str, rewritten_text: str) -> Tuple[float, str]:
    """
    Computes anti-hallucination semantic similarity between source bullet and tailored rewrite.
    Returns (similarity_score 0.0-1.0, status 'pass' | 'flagged' | 'rejected').
    """
    orig_clean = original_text.strip()
    rewr_clean = rewritten_text.strip()

    if not orig_clean or not rewr_clean:
        return 0.0, "rejected"

    # Exact match
    if orig_clean.lower() == rewr_clean.lower():
        return 1.0, "pass"

    # 1. Sequence match ratio (captures phrasing structure and word order)
    seq_ratio = difflib.SequenceMatcher(None, orig_clean.lower(), rewr_clean.lower()).ratio()

    # 2. Content token Jaccard overlap (captures key technical terms and verbs)
    orig_tokens = _clean_tokens(orig_clean)
    rewr_tokens = _clean_tokens(rewr_clean)

    if orig_tokens and rewr_tokens:
        intersection = orig_tokens.intersection(rewr_tokens)
        union = orig_tokens.union(rewr_tokens)
        jaccard = len(intersection) / len(union) if union else 0.0
    else:
        jaccard = seq_ratio

    # 3. Metric integrity penalty: check if rewritten bullet invents new metrics
    orig_metrics = _extract_metrics(orig_clean)
    rewr_metrics = _extract_metrics(rewr_clean)
    invented_metrics = rewr_metrics - orig_metrics

    # Composite similarity
    raw_similarity = 0.5 * seq_ratio + 0.5 * jaccard

    # If new numbers/percentages were introduced without source backing, apply penalty
    if invented_metrics:
        raw_similarity = max(0.2, raw_similarity - 0.25)

    final_score = round(max(0.0, min(1.0, raw_similarity)), 2)

    # Classify audit status
    if final_score >= 0.75:
        status = "pass"
    elif final_score >= 0.50:
        status = "flagged"
    else:
        status = "rejected"

    return final_score, status


def audit_tailored_cv(
    original_cv: StructuredCv,
    tailored_cv: StructuredCv,
) -> List[GroundingBulletResult]:
    """
    Compares all experience bullets in the tailored CV against the corresponding source bullets
    in the original Master CV. Produces a full anti-hallucination audit report.
    """
    # Index original bullets by id
    orig_bullets_by_id: Dict[str, Tuple[str, str]] = {}
    for exp in original_cv.experience:
        for b in exp.bullets:
            orig_bullets_by_id[b.id] = (b.text, exp.id)

    audit_results: List[GroundingBulletResult] = []
    item_counter = 1

    for exp in tailored_cv.experience:
        for b in exp.bullets:
            source_info = orig_bullets_by_id.get(b.id)
            if source_info:
                orig_text, target_exp_id = source_info
            else:
                # If bullet ID was not found, search for the best matching original bullet in the experience entry
                best_orig_text = ""
                best_sim = -1.0
                best_id = f"b_fallback_{item_counter}"
                for orig_exp in original_cv.experience:
                    for orig_b in orig_exp.bullets:
                        sim, _ = compute_bullet_similarity(orig_b.text, b.text)
                        if sim > best_sim:
                            best_sim = sim
                            best_orig_text = orig_b.text
                            best_id = orig_b.id

                orig_text = best_orig_text or b.text
                target_exp_id = exp.id
                b.id = best_id

            score, status = compute_bullet_similarity(orig_text, b.text)

            audit_results.append(
                GroundingBulletResult(
                    id=f"g_{item_counter}",
                    source_bullet_id=b.id,
                    original_text=orig_text,
                    rewritten_text=b.text,
                    target_experience_id=target_exp_id,
                    similarity_score=score,
                    status=status,
                    user_resolution="approved" if status == "pass" else None,
                )
            )
            item_counter += 1

    return audit_results
