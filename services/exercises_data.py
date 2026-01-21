"""Exercises library data."""

EXERCISES = [
    {
        'id': 1,
        'slug': 'box-breathing',
        'title': 'Box Breathing',
        'category': 'Breathing',
        'duration_minutes': 5,
        'description': 'A calming breathing technique: inhale, hold, exhale, hold in equal counts.',
        'steps': [
            {
                'number': 1,
                'instruction': 'Find a comfortable seated position. You can close your eyes if comfortable.',
            },
            {
                'number': 2,
                'instruction': 'Breathe in slowly through your nose for a count of 4.',
            },
            {
                'number': 3,
                'instruction': 'Hold your breath for a count of 4.',
            },
            {
                'number': 4,
                'instruction': 'Exhale slowly through your mouth for a count of 4.',
            },
            {
                'number': 5,
                'instruction': 'Hold the empty breath for a count of 4.',
            },
            {
                'number': 6,
                'instruction': 'Repeat this cycle 5-10 times, or until you feel calmer.',
            },
        ],
    },
    {
        'id': 2,
        'slug': '5-4-3-2-1-grounding',
        'title': '5-4-3-2-1 Grounding Technique',
        'category': 'Grounding',
        'duration_minutes': 5,
        'description': 'Engage all five senses to anchor yourself in the present moment.',
        'steps': [
            {
                'number': 1,
                'instruction': 'Identify 5 things you can SEE around you. Name them silently.',
            },
            {
                'number': 2,
                'instruction': 'Identify 4 things you can TOUCH. Feel their texture.',
            },
            {
                'number': 3,
                'instruction': 'Identify 3 things you can HEAR. Listen carefully.',
            },
            {
                'number': 4,
                'instruction': 'Identify 2 things you can SMELL (or imagine).',
            },
            {
                'number': 5,
                'instruction': 'Identify 1 thing you can TASTE.',
            },
        ],
    },
    {
        'id': 3,
        'slug': 'gratitude-journaling',
        'title': 'Gratitude Journaling',
        'category': 'Journaling',
        'duration_minutes': 10,
        'description': 'Reflect on things you\'re grateful for, no matter how small.',
        'steps': [
            {
                'number': 1,
                'instruction': 'Find a quiet space and a notebook or device where you can write.',
            },
            {
                'number': 2,
                'instruction': 'Write at the top: "Today I am grateful for..."',
            },
            {
                'number': 3,
                'instruction': 'List 3 things you\'re grateful for. They can be big or small.',
            },
            {
                'number': 4,
                'instruction': 'For each item, write a sentence about WHY you\'re grateful for it.',
            },
            {
                'number': 5,
                'instruction': 'Pause and notice how you feel. Gratitude shifts our perspective.',
            },
        ],
    },
    {
        'id': 4,
        'slug': 'cbt-thought-reframe',
        'title': 'CBT Thought Reframe',
        'category': 'Cognitive',
        'duration_minutes': 10,
        'description': 'Challenge unhelpful thoughts by examining evidence and reframing.',
        'steps': [
            {
                'number': 1,
                'instruction': 'Identify a negative thought you\'re having. Write it down.',
            },
            {
                'number': 2,
                'instruction': 'Ask: "What evidence do I have for this thought-"',
            },
            {
                'number': 3,
                'instruction': 'Ask: "What evidence do I have AGAINST this thought-"',
            },
            {
                'number': 4,
                'instruction': 'Create a more balanced thought. Example: instead of "I always fail," try "I\'m learning and sometimes struggle."',
            },
            {
                'number': 5,
                'instruction': 'Repeat the balanced thought. Notice how it feels different.',
            },
        ],
    },
    {
        'id': 5,
        'slug': 'dbt-wise-mind',
        'title': 'DBT Wise Mind Exercise',
        'category': 'Emotion Regulation',
        'duration_minutes': 10,
        'description': 'Balance emotion and logic to access your inner wisdom.',
        'steps': [
            {
                'number': 1,
                'instruction': 'Sit comfortably. Place your hand on your heart.',
            },
            {
                'number': 2,
                'instruction': 'Notice your EMOTION MIND: "What do I feel right now-"',
            },
            {
                'number': 3,
                'instruction': 'Notice your LOGICAL MIND: "What do the facts say-"',
            },
            {
                'number': 4,
                'instruction': 'Now access your WISE MIND - the balance of both. Ask: "What is my wisest choice right now?"',
            },
            {
                'number': 5,
                'instruction': 'Trust that answer. Your wise mind integrates emotion and logic.',
            },
        ],
    },
    {
        'id': 6,
        'slug': 'progressive-muscle-relaxation',
        'title': 'Progressive Muscle Relaxation',
        'category': 'Relaxation',
        'duration_minutes': 10,
        'description': 'Release tension by tightening and relaxing muscle groups in sequence.',
        'steps': [
            {
                'number': 1,
                'instruction': 'Sit or lie down comfortably. Take a slow breath in and out.',
            },
            {
                'number': 2,
                'instruction': 'Tighten the muscles in your feet for 5 seconds, then release.',
            },
            {
                'number': 3,
                'instruction': 'Tighten your calves for 5 seconds, then release.',
            },
            {
                'number': 4,
                'instruction': 'Tighten your thighs and hips for 5 seconds, then release.',
            },
            {
                'number': 5,
                'instruction': 'Tighten your shoulders, arms, and hands for 5 seconds, then release.',
            },
            {
                'number': 6,
                'instruction': 'Tighten your jaw and face for 5 seconds, then release and breathe slowly.',
            },
        ],
    },
]


def get_all_exercises():
    """Return all exercises (summary view)."""
    return [
        {
            'id': ex['id'],
            'slug': ex['slug'],
            'title': ex['title'],
            'category': ex['category'],
            'duration_minutes': ex['duration_minutes'],
            'description': ex['description'],
        }
        for ex in EXERCISES
    ]


def get_exercise_by_slug(slug):
    """Return full exercise details by slug."""
    for exercise in EXERCISES:
        if exercise['slug'] == slug:
            return exercise
    return None
