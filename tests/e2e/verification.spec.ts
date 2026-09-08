import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "./fixtures";

async function register(request: APIRequestContext, label: string) {
  const email = `verification-${label}-${randomUUID()}@example.com`;
  const response = await request.post("/api/auth/register", {
    data: { email, password: "A long test password", name: label },
  });
  expect(response.status()).toBe(200);
  return email;
}

async function requestCode(request: APIRequestContext) {
  const response = await request.post("/api/auth/verify-request");
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.challenge).toBeTruthy();
  expect(result.development_code).toMatch(/^\d{6}$/);
  return {
    challenge: result.challenge as string,
    code: result.development_code as string,
  };
}

test("shared weddings require verified email and verification is account scoped and single use", async ({
  browser,
}) => {
  const owner = await browser.newContext();
  const collaborator = await browser.newContext();
  try {
    await register(owner.request, "owner");
    const email = await register(collaborator.request, "collaborator");
    const weddingResponse = await owner.request.post("/api/weddings", {
      data: {
        names: "Email & Ownership",
        date: "2027-06-19",
        location: "Edmonton",
        world: "riviera",
        timezone: "America/Edmonton",
      },
    });
    expect(weddingResponse.status()).toBe(200);
    const { id: weddingId } = await weddingResponse.json();
    expect(
      (
        await owner.request.post(
          `/api/studio/collaborators?wedding=${weddingId}`,
          { data: { email, role: "viewer" } },
        )
      ).status(),
    ).toBe(200);

    expect(
      (await (await collaborator.request.get("/api/auth/me")).json()).user
        .email_verified,
    ).toBe(false);
    expect(
      await (await collaborator.request.get("/api/weddings")).json(),
    ).toEqual([]);
    expect(
      (
        await collaborator.request.get(`/api/studio?wedding=${weddingId}`)
      ).status(),
    ).toBe(404);
    // An unverified account can still manage its own wedding.
    expect(
      (await owner.request.get(`/api/studio?wedding=${weddingId}`)).status(),
    ).toBe(200);

    const verification = await requestCode(collaborator.request);
    expect(
      (
        await owner.request.post("/api/auth/verify-confirm", {
          data: verification,
        })
      ).status(),
    ).toBe(400);
    const confirmations = await Promise.all([
      collaborator.request.post("/api/auth/verify-confirm", {
        data: verification,
      }),
      collaborator.request.post("/api/auth/verify-confirm", {
        data: verification,
      }),
    ]);
    expect(confirmations.map((response) => response.status()).sort()).toEqual([
      200, 400,
    ]);
    expect(
      (await (await collaborator.request.get("/api/auth/me")).json()).user
        .email_verified,
    ).toBe(true);
    const weddings = await (
      await collaborator.request.get("/api/weddings")
    ).json();
    expect(weddings.map((wedding: { id: string }) => wedding.id)).toContain(
      weddingId,
    );
    expect(
      (
        await collaborator.request.get(`/api/studio?wedding=${weddingId}`)
      ).status(),
    ).toBe(200);
    expect(
      (
        await collaborator.request.post(
          `/api/studio/guests?wedding=${weddingId}`,
          { data: { name: "Unauthorized edit" } },
        )
      ).status(),
    ).toBe(403);
  } finally {
    await owner.close();
    await collaborator.close();
  }
});

test("verification limits guesses and requesting a new code invalidates older codes", async ({
  browser,
}) => {
  const account = await browser.newContext();
  try {
    await register(account.request, "attempts");
    const exhausted = await requestCode(account.request);
    for (let attempt = 0; attempt < 5; attempt++) {
      expect(
        (
          await account.request.post("/api/auth/verify-confirm", {
            data: { ...exhausted, code: "000000" },
          })
        ).status(),
      ).toBe(400);
    }
    expect(
      (
        await account.request.post("/api/auth/verify-confirm", {
          data: exhausted,
        })
      ).status(),
    ).toBe(400);
    expect(
      (await (await account.request.get("/api/auth/me")).json()).user
        .email_verified,
    ).toBe(false);
    const superseded = await requestCode(account.request);
    const latest = await requestCode(account.request);
    expect(
      (
        await account.request.post("/api/auth/verify-confirm", {
          data: superseded,
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await account.request.post("/api/auth/verify-confirm", { data: latest })
      ).status(),
    ).toBe(200);
  } finally {
    await account.close();
  }
});

test("cross-origin account mutations are rejected and logout requires POST", async ({
  browser,
  request,
}) => {
  const account = await browser.newContext();
  try {
    await register(account.request, "origin");
    expect((await request.post("/api/auth/verify-request")).status()).toBe(401);
    expect(
      (
        await account.request.post("/api/auth/verify-request", {
          headers: { Origin: "https://another-site.example" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await account.request.post("/api/auth/logout", {
          headers: { Origin: "https://another-site.example" },
        })
      ).status(),
    ).toBe(403);
    expect((await account.request.get("/api/auth/logout")).status()).toBe(405);
    expect(
      (await (await account.request.get("/api/auth/me")).json()).user,
    ).not.toBeNull();
    expect((await account.request.post("/api/auth/logout")).status()).toBe(200);
    expect(
      (await (await account.request.get("/api/auth/me")).json()).user,
    ).toBeNull();
  } finally {
    await account.close();
  }
});
