import psycopg2
import requests
import xml
import xml.etree.ElementTree
import sys


stack = sys.argv[1]
toolong = []
squot = "'"
sublangs = ['es', 'ja', 'pt', 'ru']
special = ['askubuntu', 'mathoverflow', 'serverfault', 'stackoverflow', 'superuser']
if stack in sublangs:
    res = requests.get(f'https://archive.org/download/stackexchange/{stack}.stackoverflow.com/Posts.xml', params=None, stream=True)
elif stack in special:
    if stack=='mathoverflow':
        res = requests.get(f'https://archive.org/download/stackexchange/{stack}.net.7z/Posts.xml', params=None, stream=True)
    elif stack=='stackoverflow':
        res = requests.get(f'https://archive.org/download/stackexchange/{stack}.com-Posts.7z/Posts.xml', params=None, stream=True)
    else:
        res = requests.get(f'https://archive.org/download/stackexchange/{stack}.com.7z/Posts.xml', params=None, stream=True)
else:
    res = requests.get(f'https://archive.org/download/stackexchange/{stack}.stackexchange.com.7z/Posts.xml', params=None, stream=True)

conn = psycopg2.connect(user='Flamdini', password='0Mn0mn0m!', host='stackpost.crymkd1bcdxk.us-east-1.rds.amazonaws.com', port='5432', database='stacks')
cursor = conn.cursor()
cursor.execute(f'''CREATE TABLE "{stack}" (Id BIGINT UNIQUE, PostTypeId SMALLINT, ParentOrChild BIGINT, CreationDate TIMESTAMP, Score INT, ViewCount INT, Body VARCHAR(65535), Title VARCHAR(750), Tags VARCHAR(750));''')
conn.commit()
print("Table (not) created.")

xmlpp = xml.etree.ElementTree.XMLPullParser()
for chunk in res.iter_lines():
    xmlpp.feed(chunk)
    for (event, elem) in xmlpp.read_events():
        if 'Id' in elem.attrib.keys():
            print(f'{elem.attrib["Id"]}')
            if len(elem.attrib["Body"].replace(squot, "&apos;")) > 65534:
                print("Too long")
                toolong.append(elem.attrib["Id"])
            elif elem.attrib['PostTypeId']=='1':
                if 'AcceptedAnswerId' in elem.attrib.keys():
                    cursor.execute(f'''INSERT INTO "{stack}" VALUES ({elem.attrib["Id"]}, {elem.attrib["PostTypeId"]}, {elem.attrib["AcceptedAnswerId"]}, '{elem.attrib["CreationDate"]}', {elem.attrib["Score"]}, {elem.attrib["ViewCount"]}, '{elem.attrib["Body"].replace(squot, "&apos;")}', '{elem.attrib["Title"].replace(squot, "&apos;")}', '{elem.attrib["Tags"].replace(squot, "&apos;")}');''')
                else:
                    cursor.execute(f'''INSERT INTO "{stack}" VALUES ({elem.attrib["Id"]}, {elem.attrib["PostTypeId"]}, NULL, '{elem.attrib["CreationDate"]}', {elem.attrib["Score"]}, {elem.attrib["ViewCount"]}, '{elem.attrib["Body"].replace(squot, "&apos;")}', '{elem.attrib["Title"].replace(squot, "&apos;")}', '{elem.attrib["Tags"].replace(squot, "&apos;")}');''')
                conn.commit()
            elif elem.attrib['PostTypeId']=='2':
                    cursor.execute(f'''INSERT INTO "{stack}" VALUES ({elem.attrib["Id"]}, {elem.attrib["PostTypeId"]}, {elem.attrib["ParentId"]}, '{elem.attrib["CreationDate"]}', {elem.attrib["Score"]}, NULL, '{elem.attrib["Body"].replace(squot, "&apos;")}', NULL, NULL);''')
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
