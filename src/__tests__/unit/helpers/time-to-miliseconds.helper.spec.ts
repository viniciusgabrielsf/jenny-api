import {
    daysToMilliseconds,
    hoursToMilliseconds,
    minutesToMilliseconds,
    secondsToMilliseconds,
    timeStringToMilliseconds,
} from '../../../helpers/time-to-miliseconds.helper';

describe('time-to-miliseconds.helper (Unit Test)', () => {
    describe('daysToMilliseconds', () => {
        it('should convert days to milliseconds', () => {
            expect(daysToMilliseconds(1)).toBe(86400000);
            expect(daysToMilliseconds(0)).toBe(0);
            expect(daysToMilliseconds(2.5)).toBe(216000000);
        });
    });

    describe('hoursToMilliseconds', () => {
        it('should convert hours to milliseconds', () => {
            expect(hoursToMilliseconds(1)).toBe(3600000);
            expect(hoursToMilliseconds(0)).toBe(0);
            expect(hoursToMilliseconds(2.5)).toBe(9000000);
        });
    });

    describe('minutesToMilliseconds', () => {
        it('should convert minutes to milliseconds', () => {
            expect(minutesToMilliseconds(1)).toBe(60000);
            expect(minutesToMilliseconds(0)).toBe(0);
            expect(minutesToMilliseconds(2.5)).toBe(150000);
        });
    });

    describe('secondsToMilliseconds', () => {
        it('should convert seconds to milliseconds', () => {
            expect(secondsToMilliseconds(1)).toBe(1000);
            expect(secondsToMilliseconds(0)).toBe(0);
            expect(secondsToMilliseconds(2.5)).toBe(2500);
        });
    });

    describe('timeStringToMilliseconds', () => {
        it('should convert ms, s, m, h, d strings to milliseconds', () => {
            expect(timeStringToMilliseconds('100ms')).toBe(100);
            expect(timeStringToMilliseconds('2s')).toBe(2000);
            expect(timeStringToMilliseconds('3m')).toBe(180000);
            expect(timeStringToMilliseconds('4h')).toBe(14400000);
            expect(timeStringToMilliseconds('5d')).toBe(432000000);
        });

        it('should throw error for invalid format', () => {
            expect(() => timeStringToMilliseconds('10')).toThrow('Invalid time format: 10');
            expect(() => timeStringToMilliseconds('abc')).toThrow('Invalid time format: abc');
            expect(() => timeStringToMilliseconds('1w')).toThrow('Invalid time format: 1w');
        });
    });
});
