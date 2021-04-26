import os
from flask import Flask
from flask import request
import json
import re

app = Flask(__name__)

@app.route('/scb_download_image_to_ftp', methods=['POST'])
def scb_download_image_to_ftp():
    request_data = request.data
    file_name = json.loads(request_data)["file_name"]

    os.popen('cp /home/bpa/image_server/' + file_name + ' /home/bpa/os_images/').readlines()
    return 'scb download image to ftp success!'

if __name__ == '__main__':
    app.run(host='10.124.196.148',port=8881)
