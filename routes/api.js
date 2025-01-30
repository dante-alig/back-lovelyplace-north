const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Point de terminaison pour créer une session de paiement Stripe
router.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Lovely Place Premium",
            },
            unit_amount: 799, // 7.99€ en centimes
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur lors de la création de la session:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la session de paiement" });
  }
});

module.exports = router;
