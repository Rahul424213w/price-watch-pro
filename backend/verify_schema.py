import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import engine
    from sqlalchemy import inspect
    import models

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")

    for table in ["products", "price_history", "alerts", "whatsapp_subscriptions"]:
        if table in tables:
            columns = [c["name"] for c in inspector.get_columns(table)]
            print(f"Columns in '{table}': {columns}")
        else:
            print(f"MISSING TABLE: {table}")

except Exception as e:
    print(f"Error checking schema: {e}")
