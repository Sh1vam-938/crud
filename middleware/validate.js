// ================================================================
// middleware/validate.js
// ================================================================
// What is this file?
//   A reusable middleware that:
//     1. Checks if express-validator found any validation errors
//     2. If YES → returns a 422 response with all error messages
//     3. If NO  → calls next() to continue to the controller
//
// How does validation work in this project?
//   Step 1: In routes/taskRoutes.js, we define RULES using
//           express-validator functions like body(), param()
//           These rules describe what valid input looks like.
//
//   Step 2: When a request comes in, the rules run and collect
//           any errors into a list.
//
//   Step 3: This middleware (handleValidationErrors) checks
//           that list. If there are errors → 422. If clean → next().
//
//   Step 4: The controller only runs if validation passed.
//
// Why 422 and not 400?
//   400 Bad Request = malformed request syntax
//   422 Unprocessable Entity = request was understood but data was invalid
//   Both are used in practice. We'll use 422 for validation errors.
// ================================================================

const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  // validationResult(req) collects all errors from the validation
  // rules that ran before this middleware
  const errors = validationResult(req);

  // .isEmpty() = true if no errors (all validations passed)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed. Check the errors array.",
      // .array() converts errors to a readable array of objects
      // Each object: { type, msg, path, location }
      //   type:     "field"
      //   msg:      "Title is required"        ← the message we defined
      //   path:     "title"                    ← which field failed
      //   location: "body"                     ← where it came from
      errors: errors.array(),
    });
  }

  // No errors — proceed to the controller
  next();
};

module.exports = { handleValidationErrors };
