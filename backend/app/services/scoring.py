import re
from typing import Dict, List, Set, Tuple
from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements
from app.schemas.score import (
    MatchAlignmentItem,
    MatchGapItem,
    MissingKeyword,
    ScoreBreakdown,
    ScoreReportResponse,
)

# Aliases for normalized matching across varied technical phrasing
TECH_ALIASES: Dict[str, Set[str]] = {
    "react": {"react", "react.js", "reactjs"},
    "next.js": {"next.js", "nextjs", "next"},
    "vue": {"vue", "vue.js", "vuejs"},
    "angular": {"angular", "angular.js", "angularjs"},
    "node": {"node", "node.js", "nodejs"},
    "typescript": {"typescript", "ts"},
    "javascript": {"javascript", "js"},
    "python": {"python", "py"},
    "golang": {"golang", "go"},
    "postgres": {"postgres", "postgresql"},
    "k8s": {"k8s", "kubernetes"},
    "aws": {"aws", "amazon web services"},
    "gcp": {"gcp", "google cloud", "google cloud platform"},
    "ci/cd": {"ci/cd", "cicd", "continuous integration", "continuous deployment"},
    "rest": {"rest", "restful", "rest api", "rest apis"},
    "graphql": {"graphql", "gql"},
    "tailwind": {"tailwind", "tailwindcss"},
    "websockets": {"websocket", "websockets", "ws"},
    "docker": {"docker", "containerization", "containers"},
    "microservices": {"microservice", "microservices"},
    "micro-frontends": {"micro-frontend", "micro-frontends", "microfrontend", "microfrontends"},
    "tdd": {"tdd", "test-driven development", "test driven development"},
    "performance": {"performance optimization", "p95", "latency", "core web vitals"},
}

FRAMEWORK_TOOLS: Set[str] = {
    "react", "next.js", "nextjs", "vue", "angular", "svelte", "docker", "kubernetes", "k8s",
    "aws", "gcp", "azure", "prisma", "tailwind", "tailwindcss", "graphql", "redis", "kafka",
    "rabbitmq", "postgresql", "postgres", "mysql", "mongodb", "sqlite", "git", "github",
    "gitlab", "jest", "vitest", "playwright", "cypress", "express", "django", "flask",
    "fastapi", "spring", "spring boot", "terraform", "ansible", "webpack", "vite",
    "turbopack", "zod", "redux", "zustand", "trpc", "linux", "jenkins"
}

METHODOLOGIES: Set[str] = {
    "ci/cd", "cicd", "continuous integration", "continuous deployment", "microservices",
    "micro-frontends", "microfrontends", "agile", "scrum", "kanban", "tdd",
    "test-driven development", "bdd", "rest", "restful", "rest api", "system design",
    "clean architecture", "domain-driven design", "ddd", "performance optimization",
    "core web vitals", "seo", "security", "devops", "sre", "distributed systems",
    "event-driven", "web sockets", "websockets", "code review", "mentoring"
}

COMMON_STOP_WORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "of", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "can", "will", "just", "should", "now", "be", "is", "are",
    "was", "were", "been", "being", "have", "has", "had", "having", "do", "does", "did",
    "doing", "our", "their", "we", "you", "your", "they", "them", "years", "experience"
}


def _normalize(text: str) -> str:
    """Lowercases, trims, and cleans non-alphanumeric separators."""
    return re.sub(r"[^\w\s\.\#\+\/\-]", " ", text.lower()).strip()


def _get_aliases(term: str) -> Set[str]:
    """Retrieves normalized aliases for a term if recognized."""
    norm = _normalize(term)
    for canonical, aliases in TECH_ALIASES.items():
        if norm == canonical or norm in aliases:
            return aliases
    return {norm}


def _matches_in_text(target: str, corpus: str) -> bool:
    """Checks whether target term or any of its known aliases exists in corpus text."""
    corpus_lower = f" {corpus.lower()} "
    aliases = _get_aliases(target)
    for alias in aliases:
        escaped = re.escape(alias)
        pattern = rf"(?:^|[^\w\+\#]){escaped}(?:[^\w\+\#]|$)"
        if re.search(pattern, corpus_lower):
            return True
    return False


def _build_cv_corpus(cv: StructuredCv) -> str:
    """Combines all candidate resume fields into one searchable lowercase text blob."""
    parts = []
    if cv.summary:
        parts.append(cv.summary)
    for skill in cv.skills:
        parts.append(skill)
    for exp in cv.experience:
        parts.append(exp.title)
        parts.append(exp.company)
        for bullet in exp.bullets:
            parts.append(bullet.text)
    if cv.projects:
        for proj in cv.projects:
            parts.append(proj.name)
            parts.append(proj.description)
            for tech in proj.technologies:
                parts.append(tech)
    if cv.certifications:
        for cert in cv.certifications:
            parts.append(cert)
    return " ".join(parts)


def _estimate_candidate_experience_years(cv: StructuredCv) -> float:
    """Heuristically estimates candidate total years of experience from experience dates."""
    total_years = 0.0
    current_year = 2026

    for exp in cv.experience:
        dates_str = exp.dates or ""
        years = [int(m) for m in re.findall(r"\b(19\d\d|20\d\d)\b", dates_str)]
        if len(years) >= 2:
            span = max(years) - min(years)
            total_years += max(1.0, float(span))
        elif len(years) == 1:
            if "present" in dates_str.lower() or "current" in dates_str.lower():
                span = current_year - years[0]
                total_years += max(1.0, float(span))
            else:
                total_years += 1.0
        else:
            total_years += 1.5

    if not cv.experience:
        return 0.0

    return min(15.0, total_years)


def _determine_category(skill_name: str) -> str:
    """Classifies a skill into hard_skill, framework_tool, or methodology."""
    norm = _normalize(skill_name)
    if norm in METHODOLOGIES or any(m in norm for m in ["agile", "scrum", "ci/cd", "architecture", "design", "tdd", "optimization"]):
        return "methodology"
    if norm in FRAMEWORK_TOOLS or any(f in norm for f in ["react", "vue", "docker", "prisma", "aws", "gcp", "sql", "git", "cloud"]):
        return "framework_tool"
    return "hard_skill"


def _count_occurrences_in_jd(term: str, jd_text: str) -> int:
    """Counts mentions of a term and its aliases in the raw JD text."""
    if not jd_text:
        return 1
    count = 0
    aliases = _get_aliases(term)
    for alias in aliases:
        escaped = re.escape(alias)
        matches = re.findall(rf"(?:^|[^\w\+\#]){escaped}(?:[^\w\+\#]|$)", jd_text.lower())
        count += len(matches)
    return max(1, count)


def calculate_match_score(cv: StructuredCv, jd: JdRequirements) -> ScoreReportResponse:
    """
    Computes a deterministic match score (0-100) between candidate Master CV and target Job Description.
    Also extracts categorized critical missing keywords and gap diff highlights.
    """
    cv_corpus = _build_cv_corpus(cv)
    raw_jd = (jd.raw_text or "") + " " + " ".join(jd.responsibilities or []) + " " + " ".join(jd.keywords or [])

    # 1. Required Skills Score (35% weight)
    req_skills = jd.required_skills or []
    req_matched = 0
    matched_required: List[str] = []
    missing_required: List[str] = []

    for skill in req_skills:
        if _matches_in_text(skill, cv_corpus):
            req_matched += 1
            matched_required.append(skill)
        else:
            missing_required.append(skill)

    req_score = 100 if not req_skills else int(round((req_matched / len(req_skills)) * 100))

    # 2. Preferred Skills Score (15% weight)
    pref_skills = jd.preferred_skills or []
    pref_matched = 0
    matched_preferred: List[str] = []
    missing_preferred: List[str] = []

    for skill in pref_skills:
        if _matches_in_text(skill, cv_corpus):
            pref_matched += 1
            matched_preferred.append(skill)
        else:
            missing_preferred.append(skill)

    pref_score = 100 if not pref_skills else int(round((pref_matched / len(pref_skills)) * 100))

    # 3. Semantic Vector & Token Overlap (20% weight)
    responsibilities = jd.responsibilities or []
    if responsibilities:
        resp_tokens: Set[str] = set()
        for resp in responsibilities:
            words = re.findall(r"\b[a-zA-Z]{3,}\b", resp.lower())
            for w in words:
                if w not in COMMON_STOP_WORDS:
                    resp_tokens.add(w)

        if resp_tokens:
            bullet_texts = " ".join([b.text for exp in cv.experience for b in exp.bullets]).lower()
            overlap_count = sum(1 for tok in resp_tokens if tok in bullet_texts)
            semantic_score = min(100, int(round((overlap_count / len(resp_tokens)) * 100)))
        else:
            semantic_score = 80
    else:
        semantic_score = 85

    # 4. Keyword Overlap (15% weight)
    keywords = jd.keywords or []
    if keywords:
        key_matched = sum(1 for kw in keywords if _matches_in_text(kw, cv_corpus))
        keyword_score = int(round((key_matched / len(keywords)) * 100))
    else:
        keyword_score = 80

    # 5. Experience Fit Score (15% weight)
    candidate_years = _estimate_candidate_experience_years(cv)
    seniority = (jd.seniority or "").lower()

    if any(s in seniority for s in ["senior", "lead", "principal", "staff"]):
        required_years = 5.0
    elif any(s in seniority for s in ["mid", "intermediate"]):
        required_years = 3.0
    elif any(s in seniority for s in ["junior", "intern", "entry", "fresh"]):
        required_years = 1.0
    else:
        required_years = 3.0

    if candidate_years >= required_years:
        exp_score = 100
    else:
        ratio = max(0.4, candidate_years / max(1.0, required_years))
        exp_score = min(100, int(round(ratio * 100)))

    # Overall Score (Weights: 35%, 15%, 20%, 15%, 15%)
    overall = (
        0.35 * req_score +
        0.15 * pref_score +
        0.20 * semantic_score +
        0.15 * keyword_score +
        0.15 * exp_score
    )
    overall_score = max(0, min(100, int(round(overall))))

    # Extract Critical Missing Keywords Checklist
    missing_checklist: List[MissingKeyword] = []
    seen_names: Set[str] = set()

    # Required skills missing (High priority / Critical)
    for skill in missing_required:
        norm = _normalize(skill)
        if norm and norm not in seen_names:
            seen_names.add(norm)
            freq = _count_occurrences_in_jd(skill, raw_jd)
            missing_checklist.append(
                MissingKeyword(
                    name=skill,
                    category=_determine_category(skill),
                    frequency=freq,
                    importance="critical",
                )
            )

    # Preferred skills missing
    for skill in missing_preferred:
        norm = _normalize(skill)
        if norm and norm not in seen_names:
            seen_names.add(norm)
            freq = _count_occurrences_in_jd(skill, raw_jd)
            importance = "critical" if freq >= 3 else "recommended"
            missing_checklist.append(
                MissingKeyword(
                    name=skill,
                    category=_determine_category(skill),
                    frequency=freq,
                    importance=importance,
                )
            )

    # Missing keywords from JD keywords list
    for kw in keywords:
        if not _matches_in_text(kw, cv_corpus):
            norm = _normalize(kw)
            if norm and norm not in seen_names:
                seen_names.add(norm)
                freq = _count_occurrences_in_jd(kw, raw_jd)
                importance = "critical" if freq >= 3 else "recommended"
                missing_checklist.append(
                    MissingKeyword(
                        name=kw,
                        category=_determine_category(kw),
                        frequency=freq,
                        importance=importance,
                    )
                )

    # Sort checklist: critical first, then by frequency descending
    missing_checklist.sort(key=lambda item: (0 if item.importance == "critical" else 1, -item.frequency))

    # Construct plain English gap highlights
    gaps: List[str] = []
    for item in missing_checklist[:4]:
        freq_str = f" ({item.frequency}x in JD)" if item.frequency > 1 else ""
        category_label = item.category.replace("_", " ").title()
        if item.importance == "critical":
            gaps.append(f'Critical {category_label}: "{item.name}"{freq_str} is missing from Master CV skills and experience.')
        else:
            gaps.append(f'Recommended Opportunity: "{item.name}"{freq_str} is requested in JD but not featured in your current profile.')

    if not gaps:
        gaps.append("Strong technical alignment! No critical skill deficiencies identified against this job description.")

    # Construct grounded alignments (where candidate experience aligns with JD)
    alignments: List[MatchAlignmentItem] = []
    for skill in matched_required[:4]:
        alignments.append(
            MatchAlignmentItem(
                skill=skill,
                evidence=f'Verified core requirement: "{skill}" is present in your Master CV skills and project/work history.'
            )
        )
    for skill in matched_preferred[:2]:
        alignments.append(
            MatchAlignmentItem(
                skill=skill,
                evidence=f'Verified preferred skill: "{skill}" matches your recorded background.'
            )
        )
    if not alignments and cv.skills:
        alignments.append(
            MatchAlignmentItem(
                skill="Foundational Experience",
                evidence=f"Candidate brings verified background with {candidate_years:.1f} estimated years of professional experience."
            )
        )

    # Construct grounded detailed gaps (strictly from JD requirements)
    gaps_detailed: List[MatchGapItem] = []
    for item in missing_checklist[:5]:
        severity = "critical" if item.importance == "critical" else "moderate"
        freq_str = f" (mentioned {item.frequency}x in JD)" if item.frequency > 1 else ""
        gaps_detailed.append(
            MatchGapItem(
                skill=item.name,
                severity=severity,
                reason=f'The Job Description specifies "{item.name}"{freq_str}, but it was not found in your Master CV profile.'
            )
        )

    # Determine match tier
    if overall_score >= 85:
        match_tier = "Strong Match"
    elif overall_score >= 70:
        match_tier = "Solid Fit"
    elif overall_score >= 55:
        match_tier = "Moderate Fit"
    else:
        match_tier = "Stretch Role"

    # Executive summary verdict
    target_role = jd.job_title or "this role"
    if overall_score >= 85:
        summary_verdict = f"High alignment for {target_role} ({overall_score}%). Your authentic profile covers nearly all required core skills and experience."
    elif overall_score >= 70:
        summary_verdict = f"Solid fit for {target_role} ({overall_score}%). You meet the primary technical requirements with a few specific JD gaps."
    elif overall_score >= 55:
        summary_verdict = f"Moderate fit for {target_role} ({overall_score}%). Several core technical requirements from the JD are absent from your Master CV."
    else:
        summary_verdict = f"Stretch opportunity for {target_role} ({overall_score}%). Key prerequisites requested by the employer are not currently represented in your profile."

    return ScoreReportResponse(
        overall_score=overall_score,
        match_tier=match_tier,
        summary_verdict=summary_verdict,
        alignments=alignments,
        gaps_detailed=gaps_detailed,
        breakdown=ScoreBreakdown(
            required_skills_score=req_score,
            preferred_skills_score=pref_score,
            semantic_similarity_score=semantic_score,
            keyword_overlap_score=keyword_score,
            experience_fit_score=exp_score,
        ),
        gaps=gaps,
        critical_missing_keywords=missing_checklist,
    )
