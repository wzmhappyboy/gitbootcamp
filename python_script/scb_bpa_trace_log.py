import os
from flask import Flask
from flask import request
import json
import requests
import re

app = Flask(__name__)

global current_row_number
global connect_check_log
global pre_check_log
global post_check_log
global upgrade_log
global connect_device_upgrade_current_row_number
global connect_device_upgrade_log

@app.route('/log_start', methods=['POST'])
def log_start():
    request_data = request.data
    device_name = json.loads(request_data)["device_name"]
    type = json.loads(request_data)["type"]

    global current_row_number

    #current_row_number_str = os.popen('wc -l /var/log/ncs/ned-cisco-nx-cli-5.15-9k.trace').readlines()
    if device_name == "asr1":
        current_row_number_str = os.popen('wc -l /var/log/ncs/ned-cisco-ios-cli-6.44-' + device_name + '.trace').readlines()
    else:
        current_row_number_str = os.popen('wc -l /var/log/ncs/ned-cisco-nx-cli-5.15-' + device_name + '.trace').readlines()
    current_row_number = current_row_number_str[0].split(" ")[0]
    #print current_row_number
    return device_name + ' ' + type + ' log start!'

@app.route('/log_end', methods=['POST'])
def log_end():
    request_data = request.data
    device_name = json.loads(request_data)["device_name"]
    type = json.loads(request_data)["type"]

    global current_row_number
    global connect_check_log
    global pre_check_log
    global post_check_log
    global upgrade_log
    try:
        if current_row_number > 0:
            #print current_row_number
            if device_name == "asr1":
                get_trace_log_command = 'cat /var/log/ncs/ned-cisco-ios-cli-6.44-' + device_name  + '.trace | tail -n +' + str(int(current_row_number))
            else:
                get_trace_log_command = 'cat /var/log/ncs/ned-cisco-nx-cli-5.15-' + device_name  + '.trace | tail -n +' + str(int(current_row_number))
            
            if type == "connect check":
                connect_check_log = os.popen(get_trace_log_command).readlines()
            elif type == "pre check":
                pre_check_log = os.popen(get_trace_log_command).readlines()
            elif type == "post check":
                post_check_log = os.popen(get_trace_log_command).readlines()
            elif type == "upgrade":
                upgrade_log = os.popen(get_trace_log_command).readlines()

    except NameError:
        return 'current_row_number not define!'

    return device_name + ' ' + type + ' log end!'

@app.route('/get_log', methods=['POST'])
def get_connect_check_log():
    request_data = request.data
    device_name = json.loads(request_data)["device_name"]
    type = json.loads(request_data)["type"]

    global connect_check_log
    global pre_check_log
    global post_check_log
    global upgrade_log
    try:
        if type == "connect check":
            return str(connect_check_log)
        elif type == "pre check":
            return str(pre_check_log)
        elif type == "post check":
            return str(post_check_log)
        elif type == "upgrade":
            return str(upgrade_log)

    except NameError:
        return 'log not define!'

@app.route('/parse_bulletinUrl', methods=['POST'])
def parse_bulletinUrl():
    request_data = request.data
    url = json.loads(request_data)["bulletinUrl"]

    #url = "http://tools.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-20090408-asa"
    r = requests.get(url)
    response_data = r.content.replace("\n","").replace("\t","")

    data = re.search(r"Recommended Release(.*)</table>(.*)<table", response_data, re.S|re.M).group(1)
    # print data

    trs =  re.findall(r"<tr>(.*?)</tr>", data, re.S|re.M)
    # print trs

    trs = "".join(trs)
    tds = re.findall(r"<td (.*?)</td>", trs, re.S|re.M)
    # print tds

    affected_release = []
    recommended_release = []
    i = 0
    j = 0
    first_column = True
    for td in tds:
        td = re.sub(r"<a(.*)</a>", "", td)
        td_text = str(re.findall(r"<p>(.*)</p>", td)[0])
        td_rowspan = int(re.findall(r"rowspan=\"(.*)\"", td)[0])

        # print td_text
        # print td_rowspan

        if first_column:
            j = td_rowspan * 3
            first_column = False
            continue

        if i == 0:
            affected_release.append(td_text)
            i = i + 1
            j = j - 1
            if j == 0:
                first_column = True
            continue

        if i == 1:
            i = i + 1
            j = j - 1
            if j == 0:
                first_column = True
            continue

        if i == 2:
            recommended_release.append(td_text)
            i = 0
            j = j - 1
            if j == 0:
                first_column = True
            continue


    #print affected_release
    #print recommended_release

    result = {}
    result["affected_release"] = affected_release
    result["recommended_release"] = recommended_release
    return result

@app.route('/live_status_log_start', methods=['POST'])
def live_status_log_start():
    request_data = request.data
    device_name = json.loads(request_data)["device_name"]

    current_row_number_str = os.popen('wc -l /var/log/ncs/ned-cisco-nx-cli-5.15-' + device_name + '.trace').readlines()
    current_row_number = current_row_number_str[0].split(" ")[0]
    #print current_row_number
    return current_row_number

@app.route('/live_status_log_end', methods=['POST'])
def live_status_log_end():
    request_data = request.data
    device_name = json.loads(request_data)["device_name"]
    row_number = json.loads(request_data)["row_number"]

    current_row_number_str = os.popen('wc -l /var/log/ncs/ned-cisco-nx-cli-5.15-' + device_name + '.trace').readlines()
    current_row_number = int(current_row_number_str[0].split(" ")[0])

    result = {}
    try:
        if row_number > 0 and row_number < current_row_number:
            get_trace_log_command = 'cat /var/log/ncs/ned-cisco-nx-cli-5.15-' + device_name  + '.trace | tail -n +' + str(int(row_number))
            trace_log = os.popen(get_trace_log_command).readlines()

            result["trace_log"] = trace_log
            result["current_row_number"] = current_row_number
        elif row_number > 0 and row_number > current_row_number:
            get_trace_log_command = 'cat /var/log/ncs/ned-cisco-nx-cli-5.15-' + device_name  + '.trace | tail -n +' + str(int(current_row_number) - 10)
            trace_log = os.popen(get_trace_log_command).readlines()

            result["trace_log"] = trace_log
            result["current_row_number"] = current_row_number
        elif row_number > 0 and row_number == current_row_number:
            result["trace_log"] = ""
            result["current_row_number"] = current_row_number

    except NameError:
        return 'current_row_number not define!'

    return result

@app.route('/connect_device_upgrade_log_start', methods=['POST'])
def connect_device_upgrade_log_start():
    request_data = request.data
    device_list = json.loads(request_data)["device_list"]

    global connect_deivce_upgrade_current_row_number

    connect_deivce_upgrade_current_row_number = []

    for device_name in device_list:
        current_row_number_str = os.popen('wc -l /var/log/ncs/ned-cisco-ios-cli-6.44-' + device_name + '.trace').readlines()
        row_number = current_row_number_str[0].split(" ")[0]
        connect_deivce_upgrade_current_row_number.append(int(row_number))
        

    #print connect_deivce_upgrade_current_row_number
    return "log start!"

@app.route('/connect_device_upgrade_log_end', methods=['POST'])
def connect_device_upgrade_log_end():
    request_data = request.data
    device_list = json.loads(request_data)["device_list"]

    global connect_deivce_upgrade_current_row_number
    global connect_deivce_upgrade_log

    connect_deivce_upgrade_log = []

    try:

        for i in range(0,len(device_list)):
            #print(i)
            #print(device_list[i])
            #print(connect_deivce_upgrade_current_row_number[i])
            
            get_trace_log_command = 'cat /var/log/ncs/ned-cisco-ios-cli-6.44-' + device_list[i]  + '.trace | tail -n +' + str(connect_deivce_upgrade_current_row_number[i])
            trace_log = os.popen(get_trace_log_command).readlines()
            connect_deivce_upgrade_log.append(trace_log)


    except NameError:
        return 'connect_deivce_upgrade_current_row_number not define!'

    return "log end!"

@app.route('/get_connect_device_upgrade_log', methods=['POST'])
def get_connect_device_upgrade_log():
    request_data = request.data
    device_list = json.loads(request_data)["device_list"]

    global connect_deivce_upgrade_log

    try:
        return str(connect_deivce_upgrade_log)

    except NameError:
        return 'log not define!'

if __name__ == '__main__':
    app.run(host='10.124.44.46',port=8081)
