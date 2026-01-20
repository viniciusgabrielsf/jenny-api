export const daysToMilliseconds = (days: number): number => {
    return days * 24 * 60 * 60 * 1000;
};

export const hoursToMilliseconds = (hours: number): number => {
    return hours * 60 * 60 * 1000;
};

export const minutesToMilliseconds = (minutes: number): number => {
    return minutes * 60 * 1000;
};

export const secondsToMilliseconds = (seconds: number): number => {
    return seconds * 1000;
};

export const timeStringToMilliseconds = (timeStr: string): number => {
    const timePattern = /^(\d+)(ms|s|m|h|d)$/;
    const match = timeStr.match(timePattern);

    if (!match) {
        throw new Error(`Invalid time format: ${timeStr}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 'ms':
            return value;
        case 's':
            return secondsToMilliseconds(value);
        case 'm':
            return minutesToMilliseconds(value);
        case 'h':
            return hoursToMilliseconds(value);
        case 'd':
            return daysToMilliseconds(value);
        default:
            throw new Error(`Unknown time unit: ${unit}`);
    }
};
