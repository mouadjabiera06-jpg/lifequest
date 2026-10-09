import { expect, test, type Page } from "@playwright/test";

async function createHero(page: Page, name = "Mouad") {
  await page.goto("/");
  await page.getByLabel("Nom de ton héros").fill(name);
  await page.getByRole("button", { name: /Commencer l'aventure/ }).click();
  await page.getByRole("button", { name: "C'est parti" }).click();
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  (page as Page & { errors: string[] }).errors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { errors: string[] }).errors).toEqual([]);
});

test("créer un héros, valider une quête, et la retrouver après rechargement", async ({ page }) => {
  await createHero(page);
  await expect(page.getByText("Novice")).toBeVisible();

  await page.getByRole("checkbox", { name: /Valider : Boire 1,5 L d'eau/ }).click();
  await expect(page.getByRole("status").getByText("+10 XP 💪  ·  +5 🪙")).toBeVisible();
  await expect(page.getByText("10 / 100")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Décocher : Boire 1,5 L d'eau/ })).toBeChecked();
  await expect(page.getByText("10 / 100")).toBeVisible();
});

test("vaincre un boss donne le butin", async ({ page }) => {
  await createHero(page);
  await page.getByRole("button", { name: "Boss" }).click();
  await page.getByRole("button", { name: "Ajouter un boss" }).click();
  await page.getByLabel("Objectif").fill("Partiel de maths");
  await page.getByLabel(/Nombre d'étapes/).fill("2");
  await page.getByRole("button", { name: "Invoquer le boss" }).click();

  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "⚔️ Étape faite" }).click();
    const levelUp = page.getByRole("button", { name: "Continuer" });
    if (await levelUp.isVisible().catch(() => false)) await levelUp.click();
  }
  await expect(page.getByRole("heading", { name: "Boss vaincu !" })).toBeVisible();
  await page.getByRole("button", { name: "Victoire !" }).click();
  await expect(page.getByText(/vaincu le/)).toBeVisible();
});

test("importer une sauvegarde de la V1", async ({ page }) => {
  await createHero(page, "Temp");
  await page.getByRole("button", { name: "Profil" }).click();
  await page.getByRole("button", { name: "⬆️ Importer" }).click();
  const v1 = {
    v: 1, hero: { name: "Ancien", seed: "Ancien", style: "pixel-art" }, xp: 260, gold: 77, hp: 40,
    stats: { force: 100, intel: 160, charisme: 0, discipline: 0, richesse: 0 },
    dailies: [], quests: [], bosses: [], rewards: [], ach: {}, log: [], history: {},
    counters: { quests: 9, bosses: 0, bonus: 0, rewards: 0, bestStreak: 3 }, pause: false, lastDay: "2026-01-01", created: "2026-01-01",
  };
  await page.getByLabel("Texte de la sauvegarde").fill(JSON.stringify(v1));
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await page.getByRole("button", { name: "Remplacer" }).click();
  await expect(page.locator(".hero-name")).toHaveText("Ancien");
  await expect(page.locator(".chip.gold").first()).toContainText("77");
});

test("refuse un texte qui n'est pas une sauvegarde", async ({ page }) => {
  await createHero(page);
  await page.getByRole("button", { name: "Profil" }).click();
  await page.getByRole("button", { name: "⬆️ Importer" }).click();
  await page.getByLabel("Texte de la sauvegarde").fill('{"hero": "pirate"}');
  await page.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Ce n'est pas une sauvegarde LifeQuest valide");
});
