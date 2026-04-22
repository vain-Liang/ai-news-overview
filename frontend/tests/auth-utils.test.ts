import assert from "node:assert/strict";
import test from "node:test";

import {
  getRegisterFieldErrors,
  getRegisterValidationMessage,
  isLoginFormComplete,
} from "../src/features/auth/lib/auth-utils.ts";

test("isLoginFormComplete requires both email and password", () => {
  assert.equal(isLoginFormComplete({ email: "", password: "" }), false);
  assert.equal(
    isLoginFormComplete({ email: " user@example.com ", password: "secret" }),
    true,
  );
});

test("register validation catches invalid email, password policy, and confirmation", () => {
  const errors = getRegisterFieldErrors({
    email: "invalid-email",
    password: "short",
    confirmPassword: "different",
    username: "",
    nickname: "",
  });

  assert.equal(errors.email, "Enter a valid email address.");
  assert.equal(errors.password, "Password must be at least 8 characters.");
  assert.equal(errors.confirmPassword, "Passwords do not match.");
});

test("register validation rejects passwords that contain the email", () => {
  const message = getRegisterValidationMessage({
    email: "reader@example.com",
    password: "reader@example.com-123",
    confirmPassword: "reader@example.com-123",
    username: "reader",
    nickname: "Reader",
  });

  assert.equal(message, "Password cannot contain your email address.");
});

test("register validation requires uppercase, lowercase, and special characters", () => {
  const message = getRegisterValidationMessage({
    email: "reader@example.com",
    password: "Strongpass123",
    confirmPassword: "Strongpass123",
    username: "reader",
    nickname: "Reader",
  });

  assert.equal(
    message,
    "Password must include uppercase, lowercase, and special characters.",
  );
});
