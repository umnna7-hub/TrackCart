
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Package, Truck } from "lucide-react";
import { orderRepository } from "../services/orderRepository";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    orderRepository
      .getOrder(orderId)
      .then((result) => {
        if (active) {
          setOrder(result);
          if (!result) setError("Order not found on this device.");
        }
      })
      .catch(() => {
        if (active) setError("Unable to load this order.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const copyValue = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError("Copy failed. Please select and copy the reference manually.");
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-3xl px-5 py-20">Loading order...</main>;
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="text-2xl font-medium">Order unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          {error || "We couldn't find this order."}
        </p>
        <Link to="/shop" className="mt-6 inline-block underline">
          Return to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:py-20">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-green-700" />
        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          TRIZIP · Order confirmation
        </p>
        <h1 className="mt-3 text-3xl font-medium md:text-4xl">
          Your test order is ready
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your order details and tracking reference are below.
        </p>
      </div>

      {order.isMock && (
        <p className="mt-8 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This is a mock order stored in this browser. It is not a real purchase or shipment.
        </p>
      )}

      <section className="mt-8 space-y-4 rounded-lg border border-border p-5 md:p-7">
        <div className="flex items-center gap-3">
          <Package className="size-5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="mt-1 break-all font-medium">{order.orderId}</p>
          </div>
          <button type="button" onClick={() => copyValue(order.orderId)} aria-label="Copy order ID">
            <Copy size={17} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Truck className="size-5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Tracking PIN</p>
            <p className="mt-1 font-medium tracking-widest">
  {order.trackingPin || order.trackingId || "Not available"}
</p>
          </div>
        <button
  type="button"
  onClick={() => copyValue(order.trackingPin || order.trackingId)}
  aria-label="Copy tracking reference"
>
          </button>
        </div>

        <div className="border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <span>{order.currentStatus}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4">
            <span className="text-muted-foreground">Expected delivery</span>
     
<span>
  {order.expectedDelivery &&
  !Number.isNaN(new Date(order.expectedDelivery).getTime())
    ? new Date(order.expectedDelivery).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "To be confirmed"}
</span>

          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/track-order?orderId=${encodeURIComponent(order.orderId)}&pin=${encodeURIComponent(order.trackingPin)}`}
          className="flex-1 rounded-md bg-primary px-5 py-4 text-center text-sm font-medium text-primary-foreground"
        >
          Track this order
        </Link>
        <Link
          to="/shop"
          className="flex-1 rounded-md border border-border px-5 py-4 text-center text-sm"
        >
          Continue shopping
        </Link>
      </div>

      {error && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">{error}</p>
      )}
    </main>
  );
}