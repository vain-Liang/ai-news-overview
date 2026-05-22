import { expect, test } from "@playwright/test";

const createToken = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createEmail = (prefix: string) => `${prefix}-${createToken()}@example.com`;
const createUsername = (prefix: string) => `${prefix}-${createToken()}`;

const password = "StrongPass123!";

test("registers on /register and returns to the landing page with profile data", async ({
  page,
}) => {
  const email = createEmail("register");
  const username = createUsername("reader");

  await page.goto("/register");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Nickname").fill("Morning Briefing");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
});

test("signs in from /login with the current browser session flow", async ({
  page,
  request,
}) => {
  const email = createEmail("login");

  const registerResponse = await request.post("/api/auth/register", {
    data: {
      email,
      password,
      username: createUsername("login-user"),
      nickname: "Login User",
    },
  });
  expect(registerResponse.ok()).toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
});

test("switches the landing page language", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Track the signal, not the scaffolding.")).toBeVisible();
  await page.getByRole("button", { name: "简中" }).click();
  await expect(page.getByText("聚焦内容本身，而不是开发痕迹。")).toBeVisible();
});
