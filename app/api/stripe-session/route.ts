import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    console.log("stripe-session route called with:", sessionId);

    const processedRef = adminDb.collection("stripeSessions").doc(sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Checkout session is not paid yet" },
        { status: 400 }
      );
    }

    const metadata = session.metadata as Record<string, string> | null;
    const priceId = metadata?.priceId;
    const uid = metadata?.uid || session.client_reference_id;

    if (!priceId || !uid) {
      return NextResponse.json(
        { error: "Missing session metadata" },
        { status: 400 }
      );
    }

    const packSnap = await adminDb
      .collection("creditPacks")
      .where("stripePriceId", "==", priceId)
      .limit(1)
      .get();

    if (packSnap.empty) {
      return NextResponse.json(
        { error: "No matching credit pack for priceId" },
        { status: 400 }
      );
    }

    const packDoc = packSnap.docs[0].data();
    const creditsToAdd = Number(packDoc.credits ?? 0);
    const userRef = adminDb.collection("users").doc(uid);

    let alreadyProcessed = false;

    await adminDb.runTransaction(async (tx) => {
      const processedSnap = await tx.get(processedRef);

      if (processedSnap.exists) {
        alreadyProcessed = true;
        return;
      }

      tx.set(
        userRef,
        {
          paidCredits: FieldValue.increment(creditsToAdd),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        processedRef,
        {
          processed: true,
          uid,
          priceId,
          creditsToAdd,
          sessionId,
          source: "stripe-session-route",
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (alreadyProcessed) {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    return NextResponse.json({ received: true, creditsToAdd });
  } catch (err: any) {
    console.error("STRIPE SESSION PROCESS ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Stripe session processing failed" },
      { status: 500 }
    );
  }
}