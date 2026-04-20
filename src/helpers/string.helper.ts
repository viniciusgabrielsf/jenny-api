export const emptyStringToUndefined = (value: unknown) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value;
