import psycopg2
conn = psycopg2.connect(user='Flamdini', password='0Mn0mn0m!', host='stackpost.crymkd1bcdxk.us-east-1.rds.amazonaws.com', port='5432', database='stacks')
cursor = conn.cursor()
cursor.execute(f"SELECT Id FROM biology WHERE Body LIKE '%narwhal%'")
print(cursor.fetchall())
cursor.close()
conn.close()
