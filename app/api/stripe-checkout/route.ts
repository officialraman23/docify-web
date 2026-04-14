import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in .env.local");
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    console.log("incoming priceId:", priceId);
    console.log(
      "secret key prefix:",
      stripeSecretKey.startsWith("sk_live_") ? "live" : "test"
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        "http://localhost:3000/dashboard/essay?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        "http://localhost:3000/dashboard/essay?payment=cancelled",
    });

    console.log("checkout session created:", session.id);

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
