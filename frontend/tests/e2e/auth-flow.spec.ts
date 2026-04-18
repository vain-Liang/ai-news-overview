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
  await page.getByRole("switch", { name: "Remember me on this device" }).check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(email)).toBeVisible();

  const localToken = await page.evaluate(() =>
    window.localStorage.getItem("ai-news-review.auth-token"),
  );
  const sessionToken = await page.evaluate(() =>
    window.sessionStorage.getItem("ai-news-review.auth-token"),
  );

  expect(localToken).toBeTruthy();
  expect(sessionToken).toBeNull();
});

test("signs in from /login with a temporary session when remember me is disabled", async ({
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
  await page.getByRole("switch", { name: "Remember me on this device" }).uncheck();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(email)).toBeVisible();

  const localToken = await page.evaluate(() =>
    window.localStorage.getItem("ai-news-review.auth-token"),
  );
  const sessionToken = await page.evaluate(() =>
    window.sessionStorage.getItem("ai-news-review.auth-token"),
  );

  expect(localToken).toBeNull();
  expect(sessionToken).toBeTruthy();
});
