import Stripe from "stripe";
import { NextResponse } from "next/server";
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

      const metadata = session.metadata as any;
      console.log("FULL METADATA:", metadata);

      const uid =
        metadata?.uid ||
        session.client_reference_id ||
        "test-user";

      const priceId = metadata?.priceId;

      console.log("✅ priceId from metadata:", priceId);

      if (!priceId) {
        console.log("❌ No priceId found in session metadata");
        return NextResponse.json({ received: true });
      }

      const snapshot = await adminDb
        .collection("creditPacks")
        .where("stripePriceId", "==", priceId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log("❌ No matching credit pack for priceId:", priceId);
        return NextResponse.json({ received: true });
      }

      const packDoc = snapshot.docs[0].data();
      const creditsToAdd = Number(packDoc.credits ?? 0);

      console.log("✅ Adding credits:", creditsToAdd, "to uid:", uid);

      await adminDb
        .collection("users")
        .doc(uid)
        .set(
          {
            credits: FieldValue.increment(creditsToAdd),
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