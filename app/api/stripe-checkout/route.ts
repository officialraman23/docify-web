import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in .env.local");
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  try {
    const { priceId, uid } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing priceId" },
        { status: 400 }
      );
    }

    const safeUid = uid || "test-user";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: safeUid,
      metadata: {
        uid: safeUid,
        priceId: String(priceId),
      },
      success_url:
        "http://localhost:3000/dashboard/essay?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        "http://localhost:3000/dashboard/essay?payment=cancelled",
    });

    console.log("checkout session created:", session.id);
    console.log("checkout metadata:", session.metadata);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("STRIPE CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "Stripe checkout failed",
      },
      { status: 500 }
    );
  }
}