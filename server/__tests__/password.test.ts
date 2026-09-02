import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password utils", () => {
  it("hashes a password and verifies it correctly", () => {
    const hash = hashPassword("testpassword123");
    expect(verifyPassword("testpassword123", hash)).toBe(true);
  });

  it("returns false for wrong password", () => {
    const hash = hashPassword("testpassword123");
    expect(verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("generates different hashes for the same password", () => {
    const hash1 = hashPassword("samepassword");
    const hash2 = hashPassword("samepassword");
    expect(hash1).not.toBe(hash2);
  });
});
