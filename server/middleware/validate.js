/**
 * Validation middleware factory
 * Creates express middleware that validates req.body against a schema object.
 *
 * Schema format: { fieldName: { type, required, min, max, pattern, enum } }
 *
 * Usage:
 *   const validate = require('../middleware/validate');
 *   router.post('/', validate(schema), controller);
 */

const mongoose = require('mongoose');

const validate = (schema) => (req, res, next) => {
    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
        let value = req.body[field];

        // Check required
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
        }

        // Skip optional empty fields
        if (value === undefined || value === null || value === '') {
            if (rules.default !== undefined) {
                sanitized[field] = rules.default;
            }
            continue;
        }

        // Type checking & coercion
        if (rules.type === 'string') {
            value = String(value).trim();
        } else if (rules.type === 'number') {
            value = Number(value);
            if (isNaN(value)) {
                errors.push(`${field} must be a number`);
                continue;
            }
        } else if (rules.type === 'boolean') {
            value = Boolean(value);
        } else if (rules.type === 'objectId') {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                errors.push(`${field} is not a valid ID`);
                continue;
            }
        } else if (rules.type === 'object') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                errors.push(`${field} must be an object`);
                continue;
            }
        } else if (rules.type === 'date') {
            const d = new Date(value);
            if (isNaN(d.getTime())) {
                errors.push(`${field} is not a valid date`);
                continue;
            }
            value = d;
        }

        // String validations
        if (rules.type === 'string') {
            if (rules.min && value.length < rules.min) {
                errors.push(`${field} must be at least ${rules.min} characters`);
                continue;
            }
            if (rules.max && value.length > rules.max) {
                errors.push(`${field} must be at most ${rules.max} characters`);
                continue;
            }
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
                continue;
            }
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
                continue;
            }
        }

        // Number validations
        if (rules.type === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
                continue;
            }
            if (rules.max !== undefined && value > rules.max) {
                errors.push(`${field} must be at most ${rules.max}`);
                continue;
            }
        }

        sanitized[field] = value;
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'fail', message: errors[0], errors });
    }

    // Replace req.body with sanitized data (whitelist approach)
    req.body = sanitized;
    next();
};

module.exports = validate;
