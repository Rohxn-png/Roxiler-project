const TONES = ['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan'];

function getInitials(name) {
    const parts = String(name || '?')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return '?';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getTone(name) {
    const source = String(name || '?');
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
        hash = (hash * 31 + source.charCodeAt(index)) % 997;
    }

    return TONES[hash % TONES.length];
}

export default function Avatar({
    name,
    size = 'md',
    tone,
    className = ''
}) {
    const resolvedTone = tone || getTone(name);

    return (
        <span
            className={`avatar avatar-${size} avatar-tone-${resolvedTone} ${className}`.trim()}
            aria-hidden="true"
        >
            {getInitials(name)}
        </span>
    );
}
