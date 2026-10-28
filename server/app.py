
from flask import Flask, jsonify
from flask_cors import CORS
from flask import request
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "11958")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_disabled=False,
    )

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "message": "TrackCart Backend is running!"
    })


@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "success",
        "message": "TrackCart API is working"
    })


@app.route("/api/db-health")
def db_health():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]
        cursor.close()

        return jsonify({
            "status": "success",
            "message": "Aiven MySQL connected successfully",
            "database": database_name
        })

    except Exception:
        app.logger.exception("Database connection failed")
        return jsonify({
            "status": "error",
            "message": "Database connection failed. Check server logs."
        }), 500

    finally:
        if connection and connection.is_connected():
            connection.close()


@app.route("/api/db-tables")
def list_db_tables():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]

        return jsonify({
            "status": "success",
            "tables": tables
        })

    except Exception:
        app.logger.exception("Could not list database tables")
        return jsonify({
            "status": "error",
            "message": "Could not list database tables"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@app.route("/api/db-schema")
def db_schema():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                TABLE_NAME AS table_name,
                COLUMN_NAME AS column_name,
                COLUMN_TYPE AS column_type,
                IS_NULLABLE AS is_nullable,
                COLUMN_KEY AS column_key
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        """)

        columns = cursor.fetchall()

        return jsonify({
            "status": "success",
            "database": "trackcart",
            "columns": columns
        })

    except Exception:
        app.logger.exception("Could not inspect database schema")
        return jsonify({
            "status": "error",
            "message": "Could not inspect database schema"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/api/products")
def get_products():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.price,
                p.stock_quantity,
                p.category_id,
                c.category_name
            FROM products p
            JOIN categories c
                ON p.category_id = c.category_id
            ORDER BY p.product_id
        """)

        rows = cursor.fetchall()

        products = []
        for row in rows:
            products.append({
                "id": row["product_id"],
                "name": row["product_name"],
                "description": row["description"],
                "price": float(row["price"]),
                "stock": row["stock_quantity"],
                "categoryId": row["category_id"],
                "category": row["category_name"]
            })

        return jsonify({
            "status": "success",
            "count": len(products),
            "products": products
        })

    except Exception:
        app.logger.exception("Could not fetch products")
        return jsonify({
            "status": "error",
            "message": "Could not fetch products"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@app.route("/api/categories")
def get_categories():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT category_id, category_name, description
            FROM categories
            ORDER BY category_id
        """)

        categories = cursor.fetchall()

        return jsonify({
            "status": "success",
            "count": len(categories),
            "categories": categories
        })

    except Exception:
        app.logger.exception("Could not fetch categories")
        return jsonify({
            "status": "error",
            "message": "Could not fetch categories"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@app.route("/api/orders", methods=["POST"])
def create_order():
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}
        customer = data.get("customer") or {}
        items = data.get("items") or []

        required_fields = ["name", "email", "phone", "addressLine1", "city", "country"]

        for field in required_fields:
            if not str(customer.get(field) or "").strip():
                return jsonify({
                    "status": "error",
                    "message": f"Customer field '{field}' is required."
                }), 400

        if not isinstance(items, list) or not items:
            return jsonify({
                "status": "error",
                "message": "Your shopping bag is empty."
            }), 400

        # Combine duplicate product IDs and validate quantities.
        quantities = {}

        for item in items:
            try:
                product_id = int(item.get("productId"))
                quantity = int(item.get("quantity"))
            except (TypeError, ValueError, AttributeError):
                return jsonify({
                    "status": "error",
                    "message": "Invalid product or quantity."
                }), 400

            if product_id < 1 or quantity < 1:
                return jsonify({
                    "status": "error",
                    "message": "Product IDs and quantities must be positive."
                }), 400

            quantities[product_id] = quantities.get(product_id, 0) + quantity

        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Find the customer by email or create a new customer.
        email = str(customer["email"]).strip().lower()

        cursor.execute(
            "SELECT customer_id FROM customers WHERE email = %s FOR UPDATE",
            (email,)
        )
        customer_row = cursor.fetchone()

        address_parts = [
            customer.get("addressLine1", ""),
            customer.get("addressLine2", ""),
            customer.get("city", ""),
            customer.get("stateProvince", ""),
            customer.get("postalCode", ""),
            customer.get("country", ""),
        ]
        shipping_address = ", ".join(
            str(part).strip() for part in address_parts if str(part or "").strip()
        )

        if len(shipping_address) > 300:
            connection.rollback()
            return jsonify({
                "status": "error",
                "message": "The shipping address is too long."
            }), 400

        if customer_row:
            customer_id = customer_row["customer_id"]
            cursor.execute("""
                UPDATE customers
                SET full_name = %s, phone = %s, address = %s
                WHERE customer_id = %s
            """, (
                customer["name"].strip(),
                str(customer.get("phone", "")).strip() or None,
                shipping_address,
                customer_id
            ))
        else:
            cursor.execute("""
                INSERT INTO customers (full_name, email, phone, address)
                VALUES (%s, %s, %s, %s)
            """, (
                customer["name"].strip(),
                email,
                str(customer.get("phone", "")).strip() or None,
                shipping_address
            ))
            customer_id = cursor.lastrowid

        # Fetch prices and lock product rows while checking stock.
        order_items = []
        total_amount = 0

        for product_id, quantity in quantities.items():
            cursor.execute("""
                SELECT product_id, product_name, price, stock_quantity
                FROM products
                WHERE product_id = %s
                FOR UPDATE
            """, (product_id,))

            product = cursor.fetchone()

            if not product:
                connection.rollback()
                return jsonify({
                    "status": "error",
                    "message": f"Product {product_id} was not found."
                }), 400

            if product["stock_quantity"] < quantity:
                connection.rollback()
                return jsonify({
                    "status": "error",
                    "message": f"Not enough stock for {product['product_name']}."
                }), 400

            price = product["price"]
            total_amount += price * quantity

            order_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": price,
            })

        cursor.execute("""
            INSERT INTO orders
                (customer_id, total_amount, order_status, shipping_address)
            VALUES (%s, %s, %s, %s)
        """, (customer_id, total_amount, "Pending", shipping_address))

        order_id = cursor.lastrowid

        for item in order_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s)
            """, (
                order_id,
                item["product_id"],
                item["quantity"],
                item["unit_price"],
            ))

            cursor.execute("""
                UPDATE products
                SET stock_quantity = stock_quantity - %s
                WHERE product_id = %s
            """, (item["quantity"], item["product_id"]))

        # This is a pending payment record, not a real charge.
        cursor.execute("""
            INSERT INTO payments
                (order_id, payment_method, payment_amount, payment_status)
            VALUES (%s, %s, %s, %s)
        """, (order_id, "Cash on Delivery", total_amount, "Pending"))

        # Create an initial shipment and tracking event.
        tracking_number = f"TRK-{order_id:08d}"

        cursor.execute("""
            INSERT INTO shipments
                (order_id, tracking_number, shipment_status)
            VALUES (%s, %s, %s)
        """, (order_id, tracking_number, "Processing"))

        cursor.execute("""
            INSERT INTO tracking_history
                (order_id, status, location, note)
            VALUES (%s, %s, %s, %s)
        """, (
            order_id,
            "Order Placed",
            "Order Processing",
            "Order received successfully."
        ))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Order created successfully.",
            "order": {
                "orderId": f"TRZ-{order_id:08d}",
                "trackingId": tracking_number,
                "totalAmount": float(total_amount),
                "currentStatus": "Pending",
            }
        }), 201

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Could not create order")
        return jsonify({
            "status": "error",
            "message": "Could not create the order. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@app.route("/api/orders/<order_ref>", methods=["GET"])
def get_order(order_ref):
    connection = None
    cursor = None

    try:
        # Accept order references such as TRZ-00000001.
        if order_ref.startswith("TRZ-"):
            order_ref = order_ref[4:]

        try:
            order_id = int(order_ref)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Invalid order ID."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.order_id,
                o.order_date,
                o.total_amount,
                o.order_status,
                o.shipping_address,
                c.full_name,
                c.email,
                c.phone,
                s.tracking_number,
                s.shipment_status
            FROM orders o
            JOIN customers c ON c.customer_id = o.customer_id
            LEFT JOIN shipments s ON s.order_id = o.order_id
            WHERE o.order_id = %s
        """, (order_id,))

        order = cursor.fetchone()

        if not order:
            return jsonify({
                "status": "error",
                "message": "Order not found."
            }), 404

        cursor.execute("""
            SELECT
                oi.product_id,
                p.product_name,
                oi.quantity,
                oi.unit_price
            FROM order_items oi
            JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id = %s
        """, (order_id,))

        items = cursor.fetchall()
        
        cursor.execute("""
            SELECT tracking_id, status, location, note, updated_at
            FROM tracking_history
            WHERE order_id = %s
            ORDER BY updated_at DESC
        """, (order_id,))

        history_rows = cursor.fetchall()

        tracking_events = [
            {
                "trackingId": event["tracking_id"],
                "status": event["status"],
                "location": event["location"],
                "remarks": event["note"],
                "updatedAt": (
                    event["updated_at"].isoformat()
                    if event["updated_at"] else None
                ),
            }
            for event in history_rows
        ]


        return jsonify({
            "status": "success",
            "order": {
                "orderId": f"TRZ-{order['order_id']:08d}",
                "trackingId": order["tracking_number"],
                "totalAmount": float(order["total_amount"]),
                "currentStatus": order["order_status"],
                "shippingAddress": order["shipping_address"],
                "orderDate": (
                    order["order_date"].isoformat()
                    if order["order_date"] else None
                ),
                "customer": {
                    "name": order["full_name"],
                    "email": order["email"],
                    "phone": order["phone"]
                },
                "items": [
                    {
                        "productId": item["product_id"],
                        "name": item["product_name"],
                        "quantity": item["quantity"],
                        "price": float(item["unit_price"]),
                       
                    }
                    for item in items
                ],
                "trackingEvents": tracking_events
            }
        }), 200

    except Exception:
        app.logger.exception("Could not fetch order")
        return jsonify({
            "status": "error",
            "message": "Could not fetch the order."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
