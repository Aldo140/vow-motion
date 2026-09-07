import { NextRequest, NextResponse } from "next/server";
import { currentUser, session, rateLimit } from "@/lib/auth";
import { createDemo, createWedding, issueToken } from "@/lib/seed";
import { rows } from "@/lib/db";
import { getWorld } from "@/lib/worlds";
export const dynamic = "force-dynamic";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ world: string }> },
) {
  const world = getWorld((await params).world);
  let user = await currentUser();
  if (user && !user.is_demo) return NextResponse.redirect(new URL("/studio", req.url));
  if (!user) {
    await rateLimit("demo:" + req.headers.get("x-forwarded-for"), 30);
    await session(await createDemo());
    user = await currentUser();
  }
  let wedding = (
    await rows<{ id: string }>(
      "SELECT id FROM weddings WHERE owner_id=$1 AND world=$2 ORDER BY created_at LIMIT 1",
      [user!.id, world.id],
    )
  )[0];
  if (!wedding)
    wedding = {
      id: await createWedding(
        user!.id,
        {
          names: world.couple,
          date: "2027-06-19",
          location: world.place,
          world: world.id,
        },
        true,
      ),
    };
  const household = (
    await rows<{ id: string }>(
      "SELECT id FROM households WHERE wedding_id=$1 ORDER BY created_at LIMIT 1",
      [wedding.id],
    )
  )[0];
  if (!household) return NextResponse.redirect(new URL("/studio", req.url));
  const raw = await issueToken(wedding.id, household.id);
  return NextResponse.redirect(new URL("/i/" + raw, req.url));
}
