"""Safety filter and crisis detection."""
import re


CRISIS_KEYWORDS = {
    "self_harm": [
        "cut myself",
        "cutting",
        "self harm",
        "self-harm",
        "hurt myself",
        "suicide",
        "kill myself",
        "suicidal",
        "want to die",
        "end my life",
        "wrist",
        "razor",
        "pills",
        "overdose",
        "hang myself",
        "jump",
    ],
    "crisis": [
        "crisis",
        "emergency",
        "danger",
        "threat",
        "violence",
        "panic attack",
        "severe anxiety",
    ],
}


def check_safety(text):
    """
    Check if text contains crisis or self-harm indicators.

    Returns:
        dict: {
            'risk_level': 'low' | 'medium' | 'high',
            'reasons': [list of detected keywords]
        }
    """
    text_lower = text.lower()
    detected_keywords = []

    for keyword in CRISIS_KEYWORDS["self_harm"]:
        if re.search(r"\b" + re.escape(keyword) + r"\b", text_lower):
            detected_keywords.append(keyword)

    if not detected_keywords:
        for keyword in CRISIS_KEYWORDS["crisis"]:
            if re.search(r"\b" + re.escape(keyword) + r"\b", text_lower):
                detected_keywords.append(keyword)

    if detected_keywords and any(
        kw in CRISIS_KEYWORDS["self_harm"] for kw in detected_keywords
    ):
        risk_level = "high"
    elif detected_keywords:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {"risk_level": risk_level, "reasons": detected_keywords}


def get_crisis_response():
    """Return supportive response when crisis is detected."""
    return (
        "I'm concerned about what you're sharing. Your wellbeing is important. "
        "If you're having thoughts of self-harm or suicide, please reach out to a crisis service immediately. "
        "I can share resources with you. Please visit the Crisis Support page or continue the conversation "
        "if you'd like to talk."
    )


def get_medium_support_response():
    """Return supportive response for medium-risk content."""
    return (
        "What you're experiencing sounds challenging. I'm here to listen and support you. "
        "If you feel like you need immediate help, please don't hesitate to reach out to a mental health "
        "professional or crisis service. Would you like to explore some coping strategies, or would you "
        "prefer information on professional support?"
    )
