import { test, expect } from "@playwright/test";

test.describe("Rotina critical flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?e2e=1");
    await expect(page.locator("#appShell")).toBeVisible();
  });

  test("navigation and calendar work", async ({ page }) => {
    await page.getByRole("button", { name: "Calendário" }).click();
    await expect(page.locator("#calendarView")).toBeVisible();
    await expect(page.locator("#calendar")).toContainText("SEG");
    await page.locator("#nextMonth").click();
    await expect(page.locator("#calendarMonthTitle")).toBeVisible();
  });

  test("sidebar collapses and reopens", async ({ page }) => {
    await page.locator("#collapseSidebar").click();
    await expect(page.locator("body")).toHaveClass(/sidebar-collapsed/);
    await page.locator("#collapseSidebar").click();
    await expect(page.locator("body")).not.toHaveClass(/sidebar-collapsed/);
  });

  test("habit creation and completion work", async ({ page }) => {
    await page.getByRole("button", { name: /Novo hábito/ }).click();
    await page.locator("#habitName").fill("Teste de integração");
    await page.locator("#habitCategory").fill("Rotina");
    await page.getByRole("button", { name: "Criar hábito" }).click();
    await expect(page.locator("#habitList")).toContainText("Teste de integração");
    await page.locator("#habitList .check").click();
    await expect(page.locator("#habitList .check")).toHaveClass(/done/);
  });

  test("notes and settings respond", async ({ page }) => {
    await page.getByRole("button", { name: "Notas" }).click();
    await page.locator("[data-action=\"new-note\"]").click();
    await expect(page.locator("#notesCanvas .note-card")).toHaveCount(1);
    await page.getByRole("button", { name: "Configurações" }).click();
    await page.locator("#motivationToggle").uncheck();
    await expect(page.locator("#motivationToggle")).not.toBeChecked();
  });
});
