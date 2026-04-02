from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Index, func
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    asin = Column(String, unique=True, index=True, nullable=False)
    title = Column(String)
    image_url = Column(String)
    is_active = Column(Boolean, default=True)
    
    history = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="product", cascade="all, delete-orphan")

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    asin = Column(String, ForeignKey("products.asin"), index=True, nullable=False)
    seller_name = Column(String, index=True)
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, index=True)
    pincode = Column(String, index=True, default="110001")
    is_out_of_stock = Column(Boolean, default=False)
    is_buybox = Column(Boolean, default=False)
    is_fba = Column(Boolean, default=False)
    
    product = relationship("Product", back_populates="history")

    # Composite index for faster lookups of latest prices per ASIN
    __table_args__ = (
        Index('idx_asin_timestamp', 'asin', 'timestamp'),
        Index('idx_asin_seller_pincode', 'asin', 'seller_name', 'pincode'),
    )

class Alert(Base):
    __tablename__ = "alerts"
    
    # Alert Types: 
    # 'price_drop' (below target)
    # 'buybox_change' (seller change)
    # 'stock_change' (OOS to In Stock or vice versa)
    # 'new_seller' (new seller detected)
    
    id = Column(Integer, primary_key=True, index=True)
    asin = Column(String, ForeignKey("products.asin"), index=True, nullable=False)
    alert_type = Column(String, default="price_drop")
    target_price = Column(Float, nullable=True) # Used for price_drop
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    triggered_at = Column(DateTime, nullable=True)
    
    product = relationship("Product", back_populates="alerts")
