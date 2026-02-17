// Validation utilities for input sanitization and validation

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validatePassword(password) {
  // Minimum 6 characters
  return password && password.length >= 6 && password.length <= 128;
}

export function validateName(name) {
  return name && name.length >= 2 && name.length <= 100;
}

export function validateLanguage(language) {
  const validLanguages = ["javascript", "python", "cpp", "html", "css"];
  return validLanguages.includes(language);
}

export function validateCode(code) {
  return code && code.length > 0 && code.length <= 100000; // Max 100KB
}

export function sanitizeString(str) {
  if (!str) return "";
  return str.toString().trim().substring(0, 10000);
}

export class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Input validation middleware
export function validateInput(schema) {
  return (req, res, next) => {
    try {
      const { body } = req;

      for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];

        if (rules.required && !value) {
          return res.status(400).json({
            error: `${field} is required`,
            field
          });
        }

        if (value && rules.type) {
          if (typeof value !== rules.type) {
            return res.status(400).json({
              error: `${field} must be a ${rules.type}`,
              field
            });
          }
        }

        if (value && rules.minLength && value.length < rules.minLength) {
          return res.status(400).json({
            error: `${field} must be at least ${rules.minLength} characters`,
            field
          });
        }

        if (value && rules.maxLength && value.length > rules.maxLength) {
          return res.status(400).json({
            error: `${field} must not exceed ${rules.maxLength} characters`,
            field
          });
        }

        if (value && rules.pattern && !rules.pattern.test(value)) {
          return res.status(400).json({
            error: `${field} has invalid format`,
            field
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Validation error: " + error.message });
    }
  };
}
