import psycopg2
import sys
conn = psycopg2.connect(user='Flamdini', password='0Mn0mn0m!', host='stackpost.crymkd1bcdxk.us-east-1.rds.amazonaws.com', port='5432', database='stacks')
cursor = conn.cursor()
cursor.execute(f"DROP TABLE {sys.argv[1]};")
conn.commit()
cursor.close()
conn.close()
