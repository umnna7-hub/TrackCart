
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

mock_products = [
    {
        "name": "Classic Leather Jacket",
        "category": "Leather",
        "price": 895,
        "stock": 12,
        "description": "A timeless leather silhouette for everyday wear.",
    },
    {
        "name": "Classic Leather Jacket — Vintage Cut",
        "category": "Leather",
        "price": 895,
        "stock": 12,
        "description": "A timeless leather silhouette with a vintage-inspired cut.",
    },
    {
        "name": "Technical Bomber",
        "category": "Outerwear",
        "price": 485,
        "stock": 8,
        "description": "A functional bomber designed for modern urban life.",
    },
    {
        "name": "Vintage Denim Jacket",
        "category": "Denim",
        "price": 295,
        "stock": 5,
        "description": "A vintage-inspired staple with a relaxed silhouette.",
    },
    {
        "name": "Wool Overcoat",
        "category": "Outerwear",
        "price": 725,
        "stock": 4,
        "description": "A refined outer layer for a considered wardrobe.",
    },
]

connection = None
cursor = None

try:
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "11958")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_disabled=False,
    )

    cursor = connection.cursor()

    for product in mock_products:
        category = product["category"]

        cursor.execute(
            "SELECT category_id FROM categories WHERE category_name = %s",
            (category,),
        )
        result = cursor.fetchone()

        if result:
            category_id = result[0]
        else:
            cursor.execute(
                """
                INSERT INTO categories (category_name)
                VALUES (%s)
                """,
                (category,),
            )
            category_id = cursor.lastrowid

        cursor.execute(
            "SELECT product_id FROM products WHERE product_name = %s",
            (product["name"],),
        )
        existing_product = cursor.fetchone()

        if existing_product:
            print(f"Already exists: {product['name']}")
            continue

        cursor.execute(
            """
            INSERT INTO products
                (product_name, description, price, stock_quantity, category_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                product["name"],
                product["description"],
                product["price"],
                product["stock"],
                category_id,
            ),
        )

        print(f"Added: {product['name']}")

    connection.commit()
    print("\nImport completed successfully!")

except Exception:
    if connection and connection.is_connected():
        connection.rollback()
    raise

finally:
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close()
