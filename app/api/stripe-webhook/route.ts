import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const priceId = session?.line_items?.[0]?.price?.id;

      console.log("payment completed for priceId:", priceId);

      // 🔥 find matching pack
      const packsSnapshot = await adminDb.collection("creditPacks").get();
      const packs = packsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const matched: any = packs.find(
        (p: any) => p.stripePriceId === priceId
      );

      if (!matched) {
        console.log("no matching pack found");
        return NextResponse.json({ ok: true });
      }

      const creditsToAdd = matched.credits;
      console.log("credits to add:", creditsToAdd);

      // ⚠️ TEMP USER (until login system)
      const userRef = adminDb.collection("users").doc("test-user");

      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          credits: creditsToAdd,
        });
      } else {
        await userRef.update({
          credits: (userDoc.data()?.credits || 0) + creditsToAdd,
        });
      }

      console.log("credits updated successfully");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "webhook failed" }, { status: 500 });
  }
}