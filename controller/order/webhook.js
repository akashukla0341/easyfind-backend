const stripe = require("../../config/stripe");
const orderModel = require("../../models/orderProductModel");
const addToCartModel = require('../../models/cartProduct');

const endpointSecret = process.env.endpointSecret;

async function getLineItems(lineItems) {
    let productItems = [];
    if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
            const product = await stripe.products.retrieve(item.price.product);
            const productId = product.metadata.productId;
            const productData = {
                productId: productId,
                name: product.name,
                price: item.price.unit_amount / 100,
                quantity: item.quantity,
                image: product.images
            };
            productItems.push(productData);
        }
    }
    return productItems;
}

const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const payloadString = JSON.stringify(req.body);
    const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: endpointSecret
    });

    let event;
    try {
        event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const paymentIntentSucceeded = event.data.object;
                const lineItems = await stripe.checkout.sessions.listLineItems(paymentIntentSucceeded.id);
                const productDetails = await getLineItems(lineItems);
                const orderDetails = {
                    productDetails: productDetails,
                    email: paymentIntentSucceeded.customer_email,
                    userId: paymentIntentSucceeded.metadata.userId,
                    paymentDetails: {
                        paymentId: paymentIntentSucceeded.payment_intent,
                        payment_method_type: paymentIntentSucceeded.payment_method_types,
                        payment_status: paymentIntentSucceeded.payment_status
                    },
                    shipping_options: paymentIntentSucceeded.shipping_options.map(s => {
                        return {
                            ...s,
                            shipping_amount: s.shipping_amount / 100
                        };
                    }),
                    totalAmount: paymentIntentSucceeded.amount_total / 100
                };
                const order = new orderModel(orderDetails);
                const saveOrder = await order.save();

                if (saveOrder?._id) {
                    await addToCartModel.deleteMany({ userId: paymentIntentSucceeded.metadata.userId });
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.status(200).send();
    } catch (err) {
        console.error(`Processing Error: ${err.message}`);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
};

module.exports = webhook;
