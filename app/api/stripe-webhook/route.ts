import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("🔥 checkout.session.completed:", session.id);

      // Later when you add auth, pass uid in checkout metadata.
      // For now, fallback to a placeholder user doc.
      const uid = session.metadata?.uid || session.client_reference_id || "test-user";

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 1,
      });

      const priceId = lineItems.data?.[0]?.price?.id;

      if (!priceId) {
        console.log("❌ No priceId found in line items for session:", session.id);
        return NextResponse.json({ received: true });
      }

      console.log("✅ priceId from webhook:", priceId);

      // Match Firestore credit pack by stripePriceId (must be a PRICE id, not prod id)
      const packSnap = await adminDb
        .collection("creditPacks")
        .where("stripePriceId", "==", priceId)
        .limit(1)
        .get();

      if (packSnap.empty) {
        console.log("❌ No matching credit pack for priceId:", priceId);
        return NextResponse.json({ received: true });
      }

      const pack = packSnap.docs[0].data() as { credits?: number; name?: string };
      const creditsToAdd = Number(pack.credits || 0);

      if (!creditsToAdd) {
        console.log("❌ Matched pack has 0 credits. priceId:", priceId);
        return NextResponse.json({ received: true });
      }

      console.log("✅ Adding credits:", creditsToAdd, "to uid:", uid);

      await adminDb
        .collection("users")
        .doc(uid)
        .set(
          {
            credits: FieldValue.increment(creditsToAdd),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      console.log("🎉 Credits updated for:", uid);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "webhook failed" }, { status: 500 });
  }
}