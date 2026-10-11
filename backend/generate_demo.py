import csv
import random
from datetime import datetime, timedelta

def generate_demo_dataset(filepath: str):
    random.seed(42)
    
    categories = {
        "Cloud Infrastructure": [
            ("CloudScale Prime", 1200.0, 750.0),
            ("VirtualNode Enterprise", 850.0, 520.0),
            ("HybridStorage Pro", 450.0, 290.0)
        ],
        "Cyber Security": [
            ("SecureGuard Pro", 950.0, 680.0),
            ("IdentityShield Max", 600.0, 410.0),
            ("ThreatRadar 360", 1100.0, 800.0)
        ],
        "Business Analytics": [
            ("DataSphere Insight", 780.0, 420.0),
            ("MetricPulse BI", 520.0, 310.0),
            ("QueryFlow Optimizer", 340.0, 190.0)
        ],
        "AI Developer Tools": [
            ("NeuralKit Enterprise", 1500.0, 850.0),
            ("ModelHub Platform", 1250.0, 700.0),
            ("AgenticStudio Developer", 650.0, 350.0)
        ]
    }
    
    regions = ["North", "South", "East", "West", "International"]
    segments = ["Enterprise", "Mid-Market", "SMB", "Government"]
    sales_reps = [
        "Elena Rostova", "Marcus Chen", "Sarah Jenkins", "David Okafor",
        "Priya Sharma", "Lucas Vance", "Amina Diallo", "Carlos Gomez"
    ]
    
    start_date = datetime(2024, 1, 1)
    rows = []
    
    order_id = 1001
    # 850 transactions across the year 2024
    for i in range(850):
        # spread over 360 days
        day_offset = int((i / 850.0) * 360) + random.randint(-2, 2)
        day_offset = max(0, min(364, day_offset))
        curr_date = start_date + timedelta(days=day_offset)
        
        month = curr_date.month
        if month <= 3:
            quarter = "Q1"
        elif month <= 6:
            quarter = "Q2"
        elif month <= 9:
            quarter = "Q3"
        else:
            quarter = "Q4"
            
        category = random.choice(list(categories.keys()))
        product_name, base_price, base_cost = random.choice(categories[category])
        region = random.choice(regions)
        segment = random.choice(segments)
        sales_rep = random.choice(sales_reps)
        
        # Scenario adjustments for realistic ground-truth patterns:
        # In Q2: Mid-market aggressive discounts led to lower profit margins
        # In Q3: South region experienced enterprise budget freeze
        # In Cyber Security: cost pressures increased in Q2
        discount = 0.0
        if quarter == "Q2" and segment == "Mid-Market":
            discount = round(random.uniform(0.15, 0.28), 2)
        elif random.random() < 0.25:
            discount = round(random.uniform(0.05, 0.15), 2)
            
        units = random.randint(1, 15)
        if segment == "Enterprise":
            units = random.randint(5, 35)
        elif segment == "Government":
            units = random.randint(3, 20)
            
        # Regional adjustment: South region has reduced transactions in Q3
        if quarter == "Q3" and region == "South" and random.random() < 0.45:
            continue
            
        unit_price = round(base_price * (1.0 - discount), 2)
        # Cost pressure in Q2 for Cyber Security
        curr_cost = base_cost
        if quarter == "Q2" and category == "Cyber Security":
            curr_cost = round(base_cost * 1.18, 2) # 18% cost spike
            
        revenue = round(unit_price * units, 2)
        cost = round(curr_cost * units, 2)
        profit = round(revenue - cost, 2)
        
        rows.append({
            "order_id": f"ORD-{order_id}",
            "order_date": curr_date.strftime("%Y-%m-%d"),
            "quarter": quarter,
            "region": region,
            "customer_segment": segment,
            "product_category": category,
            "product_name": product_name,
            "units_sold": units,
            "unit_price": unit_price,
            "revenue": revenue,
            "cost": cost,
            "profit": profit,
            "discount_pct": discount,
            "sales_rep": sales_rep
        })
        order_id += 1
        
    with open(filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        
    print(f"Generated {len(rows)} records in {filepath}")

if __name__ == "__main__":
    generate_demo_dataset("backend/data/demo_sales.csv")
