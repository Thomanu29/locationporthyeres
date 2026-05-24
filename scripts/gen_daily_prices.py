import pandas as pd

df = pd.read_excel(r'C:\Users\tmanuguerra\Downloads\tarifs_calendrier.xlsx', sheet_name='Tarifs par jour')
lines = []
for _, row in df.iterrows():
    d = row['Date']
    if hasattr(d, 'strftime'):
        date_str = d.strftime('%Y-%m-%d')
    else:
        parts = str(d).strip().split('/')
        if len(parts) == 3:
            date_str = "{}-{}-{}".format(parts[2], parts[1], parts[0])
        else:
            date_str = str(d)
    price = int(row.iloc[4])
    lines.append("  ('{}', {})".format(date_str, price))

result = "-- Daily prices imported from Excel\n"
result += "CREATE TABLE IF NOT EXISTS daily_prices (\n"
result += "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n"
result += "  date DATE UNIQUE NOT NULL,\n"
result += "  price NUMERIC NOT NULL\n"
result += ");\n\n"
result += "ALTER TABLE daily_prices ENABLE ROW LEVEL SECURITY;\n"
result += "CREATE POLICY \"Public read daily_prices\" ON daily_prices FOR SELECT USING (true);\n\n"
result += "INSERT INTO daily_prices (date, price) VALUES\n"
result += ",\n".join(lines) + "\n"
result += "ON CONFLICT (date) DO UPDATE SET price = EXCLUDED.price;\n"

with open(r'C:\Users\tmanuguerra\site-code2\supabase\daily_prices_migration.sql', 'w', encoding='utf-8') as f:
    f.write(result)

print("Generated {} daily price rows".format(len(lines)))
print("Sample: {}".format(lines[0]))
