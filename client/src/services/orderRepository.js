
const API_BASE_URL = "http://localhost:5000/api";

function prepareOrder(order) {
  if (!order) return order;

  const trackingPin = order.trackingId || order.trackingPin;

  let expectedDelivery = order.expectedDelivery;

  if (!expectedDelivery && order.orderDate) {
    const deliveryDate = new Date(order.orderDate);

    if (!Number.isNaN(deliveryDate.getTime())) {
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      expectedDelivery = deliveryDate.toISOString();
    }
  }

  return {
    ...order,
    trackingPin,
    expectedDelivery,
  };
}

export const orderRepository = {
  async createOrder(payload) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not create order.");
    }

    return prepareOrder(data.order);
  },

  async getOrder(orderId) {
    const response = await fetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not fetch order.");
    }

    return prepareOrder(data.order);
  },

  async trackOrder(orderId, trackingPin) {
    const order = await this.getOrder(orderId);

    if (order.trackingPin !== trackingPin) {
      throw new Error("Invalid tracking number.");
    }

    return order;
  },
};
