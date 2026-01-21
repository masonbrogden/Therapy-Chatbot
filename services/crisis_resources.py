"""Crisis resources by country."""

CRISIS_RESOURCES = {
    'US': [
        {
            'name': 'National Suicide Prevention Lifeline',
            'phone': '988',
            'text': 'Text HOME to 741741',
            'link': 'https://suicidepreventionlifeline.org/',
        },
        {
            'name': 'Crisis Text Line',
            'phone': 'N/A',
            'text': 'Text HOME to 741741',
            'link': 'https://www.crisistextline.org/',
        },
        {
            'name': 'NAMI Helpline',
            'phone': '1-800-950-NAMI (6264)',
            'text': 'N/A',
            'link': 'https://www.nami.org/help',
        },
    ],
    'UK': [
        {
            'name': 'Samaritans',
            'phone': '116 123',
            'text': 'N/A',
            'link': 'https://www.samaritans.org/',
        },
        {
            'name': 'Befrienders',
            'phone': '03 7953 9393',
            'text': 'N/A',
            'link': 'https://www.befrienders.org.uk/',
        },
        {
            'name': 'MIND',
            'phone': '0300 123 3393',
            'text': 'N/A',
            'link': 'https://www.mind.org.uk/',
        },
    ],
    'CA': [
        {
            'name': 'Canada Suicide Prevention Service',
            'phone': '1-833-456-4566',
            'text': 'Text 45645',
            'link': 'https://www.canada.ca/en/public-health/services/suicide-prevention.html',
        },
        {
            'name': 'Talk Suicide Canada',
            'phone': '1-833-456-4566',
            'text': 'N/A',
            'link': 'https://talksuicide.ca/',
        },
    ],
    'AU': [
        {
            'name': 'Lifeline Australia',
            'phone': '13 11 14',
            'text': 'N/A',
            'link': 'https://www.lifeline.org.au/',
        },
        {
            'name': 'Beyond Blue',
            'phone': '1300 22 4636',
            'text': 'N/A',
            'link': 'https://www.beyondblue.org.au/',
        },
    ],
    'International': [
        {
            'name': 'International Association for Suicide Prevention',
            'phone': 'N/A',
            'text': 'N/A',
            'link': 'https://www.iasp.info/resources/Crisis_Centres/',
        },
        {
            'name': 'Find help by country',
            'phone': 'N/A',
            'text': 'N/A',
            'link': 'https://findahelpline.com/',
        },
        {
            'name': 'Find local resources',
            'phone': 'N/A',
            'text': 'N/A',
            'link': 'https://www.befrienders.org/',
        },
    ],
}


def get_crisis_resources(country='US'):
    """Get crisis resources for a specific country."""
    resources = CRISIS_RESOURCES.get(country, CRISIS_RESOURCES.get('International', []))
    return {
        'country': country,
        'resources': resources,
    }
