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

    console.log("retrieved session:", session.id, session.payment_status);
    console.log("session metadata:", session.metadata);
    console.log("client_reference_id:", session.client_reference_id);

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

    const snapshot = await adminDb
      .collection("creditPacks")
      .where("stripePriceId", "==", priceId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "No matching credit pack for priceId" },
        { status: 400 }
      );
    }

    const packDoc = snapshot.docs[0].data();
    const creditsToAdd = Number(packDoc.credits ?? 0);

    console.log("matched priceId:", priceId);
    console.log("matched uid:", uid);
    console.log("creditsToAdd:", creditsToAdd);

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
      console.log("session already processed:", sessionId);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    console.log("paidCredits incremented successfully for uid:", uid);

    return NextResponse.json({ received: true, creditsToAdd });
  } catch (err: any) {
    console.error("STRIPE SESSION PROCESS ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Stripe session processing failed" },
      { status: 500 }
    );
  }
}