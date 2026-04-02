import sqlite3
import os

def migrate_db(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (not found)")
        return
        
    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Update PriceHistory
    ph_columns = [
        ("pincode", "VARCHAR DEFAULT '110001'"),
        ("is_out_of_stock", "BOOLEAN DEFAULT 0"),
        ("is_buybox", "BOOLEAN DEFAULT 0"),
        ("is_fba", "BOOLEAN DEFAULT 0")
    ]

    cursor.execute("PRAGMA table_info(price_history)")
    ph_existing = [col[1] for col in cursor.fetchall()]

    for col_name, col_type in ph_columns:
        if col_name not in ph_existing:
            print(f"  Adding column {col_name} to price_history...")
            try:
                cursor.execute(f"ALTER TABLE price_history ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"  Error adding column {col_name}: {e}")

    # 2. Update Alerts
    alert_columns = [
        ("alert_type", "VARCHAR DEFAULT 'price_drop'"),
        ("target_price", "FLOAT"),
        ("is_triggered", "BOOLEAN DEFAULT 0")
    ]

    cursor.execute("PRAGMA table_info(alerts)")
    alert_existing = [col[1] for col in cursor.fetchall()]

    for col_name, col_type in alert_columns:
        if col_name not in alert_existing:
            print(f"  Adding column {col_name} to alerts...")
            try:
                cursor.execute(f"ALTER TABLE alerts ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"  Error adding column {col_name}: {e}")

    # 3. Create missing tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    
    if 'products' not in tables:
        print("  Creating products table...")
        cursor.execute("""
            CREATE TABLE products (
                id INTEGER PRIMARY KEY,
                asin VARCHAR UNIQUE NOT NULL,
                title VARCHAR,
                image_url VARCHAR,
                is_active BOOLEAN DEFAULT 1
            )
        """)

    conn.commit()
    conn.close()
    print(f"Migration of {db_path} completed.")

if __name__ == "__main__":
    # Check both potential paths
    migrate_db('backend/pricewatch.db')
    migrate_db('pricewatch.db')
    migrate_db('backend/pricewatch_pro.db')
