import psycopg2
import requests
import xml
import xml.etree.ElementTree
import sys
import os

stack = sys.argv[1]
startbyte = 0
if len(sys.argv) > 3:
    startbyte = sys.argv[3]
toolong = []
squot = "'"

conn = psycopg2.connect(user='Flamdini', password='0Mn0mn0m!', host='stackpost.crymkd1bcdxk.us-east-1.rds.amazonaws.com', port='5432', database='stacks')
cursor = conn.cursor()
cursor.execute(f'CREATE TABLE {stack} (Id BIGINT UNIQUE, PostTypeId SMALLINT, ParentOrChild BIGINT, CreationDate TIMESTAMP, Score INT, ViewCount INT, Body VARCHAR(65535), Title VARCHAR(750), Tags VARCHAR(750));')
conn.commit()
print("Table created.")

xmlpp = xml.etree.ElementTree.XMLPullParser()
for chunk in open(sys.argv[2]):
    xmlpp.feed(chunk)
    for (event, elem) in xmlpp.read_events():
        if 'Id' in elem.attrib.keys():
            print(f'{elem.attrib["Id"]}')
            if len(elem.attrib["Body"].replace(squot, "&apos;")) > 65534:
                print("Too long")
                toolong.append(elem.attrib["Id"])
                elem.attrib["Body"] = elem.attrib["Body"][0:65533]
            if elem.attrib['PostTypeId']=='1':
                if 'AcceptedAnswerId' in elem.attrib.keys():
                    cursor.execute(f'''INSERT INTO {stack} VALUES ({elem.attrib["Id"]}, {elem.attrib["PostTypeId"]}, {elem.attrib["AcceptedAnswerId"]}, '{elem.attrib["CreationDate"]}', {elem.attrib["Score"]}, {elem.attrib["ViewCount"]}, '{elem.attrib["Body"].replace(squot, "&apos;")}', '{elem.attrib["Title"].replace(squot, "&apos;")}', '{elem.attrib["Tags"].replace(squot, "&apos;")}');''')
                else:
                    cursor.execute(f'''INSERT INTO {stack} VALUES ({elem.attrib["Id"]}, {elem.attrib["PostTypeId"]}, NULL, '{elem.attrib["CreationDate"]}', {elem.attrib["Score"]}, {elem.attrib["ViewCount"]}, '{elem.attrib["Body"].replace(squot, "&apos;")}', '{elem.attrib["Title"].replace(squot, "&apos;")}', '{elem.attrib["Tags"].replace(squot, "&apos;")}');''')
                conn.commit()
            elif elem.attrib['PostTypeId']=='2':
                    cursor.execute(f'''INSERT INTO {stack} VALUES ({elem.attrib["Id"]}, {elem.attrib["PostTypeId"]}, {elem.attrib["ParentId"]}, '{elem.attrib["CreationDate"]}', {elem.attrib["Score"]}, NULL, '{elem.attrib["Body"].replace(squot, "&apos;")}', NULL, NULL);''')
                    conn.commit()
            else:
                print(f'Detecting some other type {elem.attrib["PostTypeId"]}.')
        else:
            print(f'Detecting end of file or something unexpected.')
            break
print("Committing...")
conn.commit()
print(f"toolong: {toolong}")
cursor.close()
conn.close()
close(res)
