"""Deterministic therapy plan generator."""

PLAN_TEMPLATES = {
    "anxiety": {
        "cbt": {
            "theme": "Cognitive Behavioral Therapy for Anxiety",
            "focus": "Identifying and challenging anxious thoughts, gradual exposure",
            "exercises": ["breathing", "thought-reframe", "grounding"],
        },
        "dbt": {
            "theme": "Dialectical Behavior Therapy for Anxiety",
            "focus": "Emotion regulation and distress tolerance",
            "exercises": ["breathing", "grounding", "wise-mind"],
        },
        "psychodynamic": {
            "theme": "Psychodynamic Approach to Anxiety",
            "focus": "Exploring unconscious patterns and roots of anxiety",
            "exercises": ["journaling", "reflection", "thought-reframe"],
        },
    },
    "depression": {
        "cbt": {
            "theme": "Cognitive Behavioral Therapy for Depression",
            "focus": "Behavioral activation and thought challenging",
            "exercises": ["gratitude", "breathing", "thought-reframe"],
        },
        "dbt": {
            "theme": "Dialectical Behavior Therapy for Depression",
            "focus": "Building a life worth living and emotion regulation",
            "exercises": ["wise-mind", "gratitude", "grounding"],
        },
    },
    "stress": {
        "cbt": {
            "theme": "Managing Stress with Cognitive Strategies",
            "focus": "Stress identification and cognitive restructuring",
            "exercises": ["breathing", "thought-reframe", "grounding"],
        },
        "dbt": {
            "theme": "DBT Skills for Stress Management",
            "focus": "Distress tolerance and emotion regulation",
            "exercises": ["breathing", "wise-mind", "grounding"],
        },
    },
}

DAILY_EXERCISES = {
    "breathing": "Box Breathing (4-4-4-4 count)",
    "grounding": "5-4-3-2-1 Grounding Technique",
    "gratitude": "Gratitude Journaling (3 things)",
    "thought-reframe": "CBT Thought Reframe",
    "wise-mind": "DBT Wise Mind Exercise",
    "journaling": "Reflective Journaling",
}

REFLECTION_QUESTIONS = {
    "anxiety": [
        "What was one moment today where you felt slightly less anxious?",
        "What coping strategy helped you today?",
        "What triggered your anxiety, and what can you learn from it?",
    ],
    "depression": [
        "What is one small thing you accomplished today?",
        "How did today compare to yesterday?",
        "What activity brought you even a small moment of ease?",
    ],
    "stress": [
        "What was the biggest stressor today, and how did you manage it?",
        "What helped you feel calmer?",
        "What would you do differently tomorrow?",
    ],
}


def generate_weekly_plan(profile):
    """
    Generate a weekly therapy plan based on profile.

    Args:
        profile (dict): {main_concern, approach, minutes_per_day}

    Returns:
        dict: Weekly plan structure
    """
    concern = profile.get("main_concern", "stress").lower()
    approach = profile.get("approach", "cbt").lower()
    minutes = profile.get("minutes_per_day", 10)

    template = PLAN_TEMPLATES.get(concern, {}).get(approach)
    if not template:
        template = PLAN_TEMPLATES.get(concern, {}).get(
            "cbt",
            {
                "theme": f"Therapeutic Plan for {concern.title()}",
                "focus": "Building awareness and coping strategies",
                "exercises": ["breathing", "grounding", "thought-reframe"],
            },
        )

    exercises = template.get("exercises", ["breathing", "grounding"])
    reflections = REFLECTION_QUESTIONS.get(concern, ["How are you feeling today?"] * 7)

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekly_plan = []

    for i, day in enumerate(days):
        exercise_key = exercises[i % len(exercises)]
        reflection = reflections[i % len(reflections)]

        daily_goal = (
            f"Practice {DAILY_EXERCISES.get(exercise_key, 'mindfulness')} ({minutes} min)"
        )

        weekly_plan.append(
            {
                "day": day,
                "daily_goal": daily_goal,
                "exercise": exercise_key,
                "exercise_name": DAILY_EXERCISES.get(exercise_key, "Reflection"),
                "reflection_question": reflection,
            }
        )

    return {
        "theme": template.get("theme"),
        "focus": template.get("focus"),
        "minutes_per_day": minutes,
        "weekly_plan": weekly_plan,
        "action_items": [
            "Schedule one calming activity this week",
            "Practice your chosen exercise at least twice",
            "Share your goal with someone you trust",
        ],
        "reflection_prompt": reflections[0] if reflections else "How did you care for yourself today?",
        "coping_exercise": DAILY_EXERCISES.get(exercises[0], "Breathing exercise"),
        "micro_goals": [
            "Drink a glass of water after waking up",
            "Step outside for 5 minutes",
            "Write one encouraging note to yourself",
        ],
        "note": (
            f"This plan is tailored to your concerns ({concern}) using {approach.upper()} "
            "principles. Adjust as needed - consistency matters more than perfection."
        ),
    }
