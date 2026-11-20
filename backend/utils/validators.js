const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

const isValidName = (value) =>
    typeof value === 'string' &&
    value.trim().length >= 20 &&
    value.trim().length <= 60;

const isValidAddress = (value) =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 400;

const isValidEmail = (value) =>
    typeof value === 'string' && EMAIL_REGEX.test(value.trim());

const isValidPassword = (value) =>
    typeof value === 'string' && PASSWORD_REGEX.test(value);

const isValidRating = (value) => {
    if (typeof value !== 'number' && typeof value !== 'string') {
        return false;
    }

    if (typeof value === 'string' && value.trim() === '') {
        return false;
    }

    const numeric = Number(value);

    return Number.isInteger(numeric) && numeric >= 1 && numeric <= 5;
};

module.exports = {
    isValidName,
    isValidAddress,
    isValidEmail,
    isValidPassword,
    isValidRating
};
