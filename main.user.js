// ==UserScript==
// @name         Ticket Creator (Beta)
// @namespace    https://github.com/AZAOWEN2/Ticket-Creator
// @version      1.0.4
// @description  Yesthing
// @author       AZAOWEN
// @icon         https://i.pinimg.com/736x/e9/f6/36/e9f63675fa85770c13c3d726f3313a37.jpg
// @match        https://*.vnpt.vn/*
// @resource     STYLE https://cdn.jsdelivr.net/gh/AZAOWEN2/Ticket-Creator@main/style.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js
// @connect      cdn.jsdelivr.net
// @connect      raw.githubusercontent.com

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_openInTab
// @grant        GM_addValueChangeListener
// @grant        GM_getResourceText
// @grant        GM_addStyle

// @updateURL    https://cdn.jsdelivr.net/gh/AZAOWEN2/Ticket-Creator@main/main.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/AZAOWEN2/Ticket-Creator@main/main.user.js
// ==/UserScript==

(function() {
    'use strict';
    GM_addStyle(GM_getResourceText("STYLE"));

    let PAGE_EVENTVIEWER;

    const totalLink = {
        ticketCreate: {
            url: "https://cdn.jsdelivr.net/gh/AZAOWEN2/Hex_Decoder@main/assets/img/ticketCreate.gif",
            type: "image",
        },
    };

    function observeCenter(selector, Func1, Func2, options = {}) {
        const { root = document.documentElement, timeout = 60000, forever = false } = options;

        const obs = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) {
            clearTimeout(timer);
            if(Func1) { Func1(el) };
            if(Func2) { Func2(el) };
            if(!forever) {obs.disconnect()};
        }
        });
        
        const timer = setTimeout(() => {
        if(!forever) {obs.disconnect()};
        }, timeout);

        obs.observe(root, { childList: true, subtree: true });
        return obs;
    }

    observeCenter("#PayloadHeader", (el) => {
        PAGE_EVENTVIEWER = el.ownerDocument;
        observeCenter("#GUID_6",insertTicketButton, false, {root: PAGE_EVENTVIEWER.documentElement});
    });

    observeCenter(".newTicket", (el) => {
        if(!(typeof GM_getValue("pmtrung-ticket") === 'undefined' || GM_getValue("pmtrung-ticket") === null) && Date.now() - GM_getValue("pmtrung-ticket") < 10000){
            recieveTicketData();
        }else{
            storeCleanUp();
        }
    }, false, { timeout: 20000});


    function insertTicketButton() {
        const container = PAGE_EVENTVIEWER.querySelector("#GUID_6");
        if (!container) return;

        const pre = container.querySelector("pre");
        const ticketIcon = createTicketButton();
        if(!ticketIcon) return;

        pre.parentNode.insertBefore(ticketIcon, pre);
        ticketIcon.addEventListener("click", (e) => {
            // GhostAnimation(e.currentTarget);
            prepareDataTicket();
        });
    }

    function createTicketButton(){
        if(PAGE_EVENTVIEWER.querySelector("pmtrung-ticket-creation")) return false;

        const wrapper = document.createElement("span");
        wrapper.className = "pmtrung-ticket-creation";

        const img = document.createElement("img");
        img.src = totalLink.ticketCreate.url;   
        img.alt = "Send ticket icon";
        img.className = "pmtrung-ticket-creation-icon";

        const label = document.createElement("span");
        label.className = "pmtrung-ticket-creation-label";
        label.textContent = "Create Ticket";

        wrapper.appendChild(img);
        wrapper.appendChild(label);

        return wrapper;
    }

    async function prepareDataTicket(){
        const eventInformation = document.querySelectorAll("#EventHeader");
        const IPInformation = document.querySelector("#SourceDestinationHeader").nextElementSibling;

        const data = {
            Image:          await screenshot(),
            EventID:        collectTicketData("Event ID", eventInformation[1].nextElementSibling),
            SourceIP:       collectTicketData("Source IP", IPInformation),
            DestinationIP:  collectTicketData("Destination IP", IPInformation),
            LogSource:      collectTicketData("Log Source", eventInformation[1].nextElementSibling),
            Time:           collectTicketData("Start Time", eventInformation[0].nextElementSibling),
            LogonType:      collectTicketData("Logon Type", eventInformation[0].nextElementSibling),
            Domain:         collectTicketData("Domain", eventInformation[0].nextElementSibling),
        };

        const additionalData = {
            Command:            collectTicketData(["Process Command Line", "Scriptblock Text", "Host Application", "Command Arguments", "Command"], eventInformation[0].nextElementSibling),
            ParentCommand:      collectTicketData("Parent Process Command Line", eventInformation[0].nextElementSibling),
            Hash:               collectTicketData(["Hash File","MD5 Hash","IMP Hash","SHA1 Hash","SHA256 Hash"], eventInformation[0].nextElementSibling),
            Process:            collectTicketData(["Process Name", "Process Path"], eventInformation[0].nextElementSibling),
            ParentProcess:      collectTicketData("Parent Process Name", eventInformation[0].nextElementSibling),
            File:               collectTicketData(["File Path", "Object Name", "Audit Name"], eventInformation[0].nextElementSibling),
            ServiceName:        collectTicketData("Service Name", eventInformation[0].nextElementSibling),
            ServiceFileName:    collectTicketData(["Service File Name", "Service Filename"], eventInformation[0].nextElementSibling),
            DNSQuery:           collectTicketData(["Query Name", "URL Host"], eventInformation[0].nextElementSibling),
            DNSQueryResults:    collectTicketData("Query Results", eventInformation[0].nextElementSibling),
            Username:           collectTicketData("Username", eventInformation[0].nextElementSibling),
            TargetUsername:     collectTicketData(["User Account", "Target Username", "Username"], eventInformation[0].nextElementSibling),
            ComputerName:       collectTicketData(["Machine Identifier", "Caller Computer Name"], eventInformation[0].nextElementSibling),
            EvilFile:           collectTicketData(["KSC_Malware_Object", "test-parse", "Object"], eventInformation[0].nextElementSibling),
        }

        sendTicketData(data, additionalData);
    }


    function screenshot() {
        const startNode = PAGE_EVENTVIEWER.querySelector("#SourceDestinationHeader");
        const endNode = PAGE_EVENTVIEWER.querySelectorAll("#EventHeader")[1].nextElementSibling.querySelector("tbody > tr:nth-child(2)");

        const wrapper = document.createElement('div');
        wrapper.classList.add('pmtrung-screenshot-wrapper');
        
        wrapper.style.width = startNode.parentElement ? startNode.parentElement.offsetWidth + "px" : "100%";


        if (startNode && endNode) {
            const range = document.createRange();
            range.setStartBefore(startNode);
            range.setEndAfter(endNode);
            const fragment = range.cloneContents();
            wrapper.appendChild(fragment);
        } else {
            console.error("Không tìm thấy node đầu hoặc node cuối!");
        }


        PAGE_EVENTVIEWER.querySelector("#scrollingDiv").appendChild(wrapper);


        return htmlToImage.toPng(wrapper, {
                backgroundColor: '#fff',
                filter: (node) => { return (node.tagName !== 'SCRIPT'); },
                skipFonts: true,
                cacheBust: true
            })
            .then(dataUrl => {
                return dataUrl;
            })
            .catch(err => {
                console.error("Lỗi chụp ảnh:", err);
                return null;
            })
            .finally(() => {
                if (PAGE_EVENTVIEWER.querySelector("#scrollingDiv").contains(wrapper)) {
                    PAGE_EVENTVIEWER.querySelector("#scrollingDiv").removeChild(wrapper);
                }
            });
    }

    function collectTicketData(searchData, searchScope = document) {
        const keys = Array.isArray(searchData) ? searchData : [searchData];

        for (const key of keys) {
            
            for (const pattern of [`${key} (custom)`, key]) {
                const xpath = `.//th[normalize-space()='${pattern}']/following-sibling::td`;

                const result = document.evaluate(
                    xpath, 
                    searchScope, 
                    null, 
                    XPathResult.FIRST_ORDERED_NODE_TYPE, 
                    null
                ).singleNodeValue;

                if (result)  return result.innerText;
            }
        }

        return "";
    }


    function sendTicketData(data, additionalData){
        GM_setValue("pmtrung-ticket", Date.now());
        GM_setValue("pmtrung-ticket-data", data);
        GM_setValue("pmtrung-ticket-additional-data", additionalData);

        if(window.location.hostname === "siem.vnpt.vn"){
            GM_openInTab("https://ticket.vnpt.vn/#ticket/create/id/", { active: true });
        }else{
            GM_openInTab("https://dashboard-soc.vnpt.vn/ticket/#ticket/create/id/", { active: true });
        }
        
    }



    // Receive Data
    function recieveTicketData(){
        const data = GM_getValue("pmtrung-ticket-data"); 
        const additionalData = GM_getValue("pmtrung-ticket-additional-data");
        const image = GM_getValue("pmtrung-ticket-screenshot");
        fillTicketData(data, additionalData, image);
    }

    function fillTicketData(data, additionalData){
        const createLine = (text) => {
            const div = document.createElement("div");
            const cleanText = text ? text.trim() : "";
            div.textContent = cleanText;
            return div;
        };

        const site = window.location.hostname.includes("ticket") ? "siem" : "mss";

        // Fill Title
        const TITLE = document.querySelector("[id^='Ticket_'][id$='_title']");
        const TITLE_DATA = TICKET_TITLE_TEMPLATES(data, additionalData);
        importSimulator(TITLE_DATA,TITLE);

        // Fill Description
        const DESCRIPTION = document.querySelector(".richtext-content");
        if (!DESCRIPTION || DESCRIPTION.classList.contains("pmtrung-data-filled")) return;
        const DESCRIPTION_DATA = TICKET_DESCRIPTION_TEMPLATES(data, additionalData, site);
        DESCRIPTION_DATA.forEach(block => {
            if (block.includes('\n')) {
                const lines = block.split('\n'); 
                lines.forEach(line => {
                    DESCRIPTION.appendChild(createLine(line));
                });
            } else {
                DESCRIPTION.appendChild(createLine(block));
            }
        });

        // Fill image
        if(!data.Image) return;
        const img = document.createElement("img");
        img.src = data.Image;
        img.setAttribute("tabindex", "0");
        img.style.width = "1000px";
        img.style.maxWidth = "100%";
        DESCRIPTION.appendChild(img);

        DESCRIPTION.classList.add("pmtrung-data-filled");

        otherInformation(site, data, classify(data.EventID));
        storeCleanUp();
        
        startLock();
    }


    // Title & Description
    function TICKET_TITLE_TEMPLATES(data, additionalData){
        const commonPrefix = `[YCXL][${data.LogSource}][${data.SourceIP}]`;

        const eventType = classify(data.EventID).type;

        const messages = {
            1: "Xác minh hành vi thực thi lệnh bất thường trên hệ thống",
            2: additionalData.Process.toLowerCase().includes("w3wp") ? `Phát hiện hành vi create file từ w3wp` : `Xác minh hành vi tạo file lạ trên hệ thống`,
            3: `Xác minh server cài đặt service lạ`,
            4: "Ghi nhận server thực hiện kết nối bất thường",
            5: `Phát hiện hành vi khóa tài khoản trên hệ thống ${data.Domain}`,
            6: `Phát hiện hành vi xác thực sai liên tục nghi ngờ tấn công Bruteforce`,
            7: `Xác minh hành vi create account`,
            8: (data.LogonType === '10') || (data.EventID === '1149') ? "Xác minh hành vi đăng nhập thông qua RDP" : "Xác minh hành vi đăng nhập thành công",
            9: `Phát hiện thiết bị có dấu hiệu nhiễm mã độc`,
        };

        const specificMessage = messages[eventType] || "";
        return `${commonPrefix} ${specificMessage}`;
    }

    function TICKET_DESCRIPTION_TEMPLATES(data, additionalData, site){
        const subject = site == "siem" ? "Trung tâm An Toàn Thông Tin" : "Team SOC-VCI";
        const subject_short = site == "siem" ? "TT ATTT" : "Team SOC-VCI";
        const eventType = classify(data.EventID).type;

        const parts = {
            p1: {
                1: `${subject} ghi nhận hành vi thực thi lệnh bất thường trên hệ thống`,
                2: `${subject} ghi nhận hành vi tạo file lạ hệ thống`,
                3: `${subject} ghi nhận cài đặt service lạ trên hệ thống`,
                4: `${subject} ghi nhận hành vi thực thi kết nối bất thường trên server`,
                5: `${subject} phát hiện user bị khóa trên hệ thống`,
                6: `${subject} phát hiện hành vi xác thực sai nhiều lần liên lục, nghi ngờ hệ thống bị tấn công bruteforce`,
                7: `${subject} ghi nhận hành vi tạo tài khoản mới trên hệ thống`,
                8: (data.LogonType === '10') || (data.EventID === '1149') 
                    ? `${subject} phát hiện IP ${data.SourceIP} thực hiện hành vi đăng nhập RDP trên máy chủ của ${data.Domain}.` 
                    : `${subject} ghi nhận hành vi đăng nhập thành công từ ${data.SourceIP}`,
                9: `${subject} phát hiện thiết bị chứa file nghi ngờ là mã độc
                    Nguồn phát hiện: KAS`,
                "default": `${subject} ghi nhận hành vi bất thường`,
            },
            p2: `Log Source: ${data.LogSource}`,
            p3: `Source IP: ${data.SourceIP}`,
            p4: {
                1: `Command: ${additionalData.Command}`,
                2: `File Name: ${additionalData.File}`,
                3: `Service filename: ${additionalData.ServiceName}`,
                4: `Query Name: ${additionalData.DNSQuery}`,
                5: `Username: ${additionalData.Username}
                    Computer Name: ${additionalData.ComputerName}`,
                6: `Destination IP: ${data.DestinationIP}
                    Username: ${additionalData.Username}`,
                7: `Username: ${additionalData.Username}
                    New Account: ${additionalData.TargetUsername}`,
                8: `Destination IP: ${data.DestinationIP}
                    Username: ${additionalData.TargetUsername}
                    ${/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(data.SourceIP) ? "" : "Việc cho phép IP public RDP vào server tiềm ẩn rất nhiều rủi ro cho hệ thống."}`,
                9: `File Path: ${additionalData.EvilFile == "" || additionalData.EvilFile == "N/A" ? `Chi tiết trong ảnh đính kèm` : `additionalData.EvilFile`}
                    ${additionalData.Hash == "" || additionalData.Hash == "N/A" ? "": `Hash: ` + additionalData.Hash }`,
                "default": ``
            },
            p5: `Time: ${data.Time}`,
            p6: `Đề nghị đơn vị thực hiện:`,
            p7: {
                1: `+ Xác minh nghiệp vụ hành vi trên.
                    + Nếu không phải quản trị thực hiện, tiến hành cô lập thiết bị khỏi mạng nội bộ để kiểm tra.
                    + Gửi báo cáo xử lý chi tiết theo khuyến nghị lại cho ${subject_short}.
                    + Tiếp tục theo dõi hệ thống.
                    + Nếu đơn vị cần hỗ trợ xử lý, tạo phiếu yêu cầu tới ${subject_short}.`,

                2: `+ Xác minh hành vi trên có nằm trong nghiệp vụ hay không.
                    + Nếu không nằm trong nghiệp vụ, tiến hành lưu mẫu file "${additionalData.File}" để phân tích.
                    + Rà soát, gỡ bỏ các tiến trình độc hại, lập lịch của attacker.
                    + Rà soát, chặn các kết nối bất thường.
                    + Tìm lấy mẫu mã độc (nếu có) và thu thập log gửi về ${subject_short}.`,

                3: `+ Xác minh hành vi hành vi cài service trên.
                    + Nếu không phải nghiệp vụ, thực hiện thu thập, gỡ bỏ service.
                    + Rà soát các tiến trình, các kết nối trên hệ thống.
                    + Phản hồi lại thông tin xử lý cho ${subject_short}.`,

                4: `+ Xác minh nghiệp vụ đối với hành vi trên.
                    + Nếu không phải nghiệp vụ thực hiện ngắt kết nối mạng nội bộ để tiến hành rà soát.
                    + Rà soát tiến trình, kết nối, lập lịch trên hệ thống.
                    + Thu thập log, file nghi ngờ mã độc (nếu có).
                    + Xóa file mã độc, xóa các lập lịch của mã độc (Nếu có).
                    + Chặn kết nối đến domain ${additionalData.DNSQuery}`,

                5: `+ Xác minh hành vi với user trên.
                    + Phản hồi kết quả xử lý cho ${subject_short}.`,

                6: `+ Xác minh hành vi với IP ${data.SourceIP}, chặn IP nếu không thuộc nghiệp vụ.
                    + Đổi mật khẩu các tài khoản có liên quan (sử dụng mật khẩu mạnh).
                    + Kiểm tra và disable các port dịch vụ đang mở public ra ngoài Internet nếu không cần thiết.
                    + Trong trường hợp không thể đóng các port dịch vụ đang mở public ra ngoài Internet, cần whitelist các IP có quyền truy cập hệ thống.
                    + Triển khai xác thực đa yếu tố MFA.
                    + Giới hạn số lần đăng nhập thất bại.
                    + Gửi báo cáo xử lý chi tiết theo khuyến nghị lại cho ${subject_short}.`,

                7: `+ Xác minh hành vi trên.
                    + Nếu không phải nghiệp vụ, tiến hành xóa tài khoản ${additionalData.TargetUsername}.
                    + Tiếp tục theo dõi hệ thống.
                    + Phản hồi lại kết quả xử lý cho ${subject_short}.`,

                8: `+ Xác minh hành vi đăng nhập từ IP ${data.SourceIP}.
                    + Nếu không phải nghiệp vụ, ${/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(data.SourceIP) ? "thực hiện ngắt kết nối mạng, cô lập thiết bị" : `đề nghị chặn IP ${data.SourceIP}`}  và thực hiện đổi mật khẩu tài khoản "${additionalData.TargetUsername}".
                    ${((data.LogonType === '10') || (data.EventID === '1149') && !/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(data.SourceIP)) ? `+ Đóng các cổng kết nối cho phép RDP từ ngoài vào.`: ""}
                    + Phản hồi lại kết quả xử lý với ${subject_short}.`,

                9: `+ Xác minh nghiệp vụ file trên.
                    + Nếu không phải nghiệp vụ, thực hiện cô lập hệ thống để rà soát.
                    + Rà soát, gỡ bỏ các tiến trình độc hại, lập lịch của attacker, chặn các kết nối bất thường.
                    + Thu thập mẫu mã độc và log hệ thống gửi về ${subject_short}.
                    + Xóa các file mã độc (Nếu có).
                    + Tiếp tục theo dõi hệ thống.
                    + Gửi báo cáo xử lý chi tiết theo khuyến nghị lại cho ${subject_short}.`,

                "default": `+ Xác minh hành vi trên.
                            + Gửi thông tin xác nhận lại cho ${subject_short}.`
            },
            p8: `Trân trọng!`
        };

        return Object.values(parts).map(part => {
            if (typeof part === 'object' && part) {
                return part[eventType] || part["default"] || "";
            }
            return part;
        });
    }

    // Custom fields
    function otherInformation(site, data, eventType){
        const sourceIP = document.querySelector("[id^='Ticket_'][id$='_a_source_ip']");
        const destinationIP = document.querySelector("[id^='Ticket_'][id$='_destination_ip']");

        if (sourceIP) importSimulator(data.SourceIP, sourceIP);
        if (destinationIP) importSimulator(data.DestinationIP, destinationIP);

        const groupEvent = eventType.group;

        switch(site){
            case "siem":{
                const attackType = document.querySelector('[data-name="attack_type"]').nextElementSibling;
                const attackTypeSelection = attackType.querySelector(groupEvent.map(text => `[data-value*="${text}" i]`).join(", "));

                if (attackTypeSelection) attackTypeSelection.click();
                break;
            }
            case "mss":{
                const group = document.querySelector('[data-name="group_id"]');
                const groupSelection = group.nextElementSibling.querySelector(groupEvent.map(text => `[title*="${text}" i]`).join(", "));
                if (groupSelection) group.click(); groupSelection.click();

                const priority = document.querySelector('select[name="priority_id"]');
                if (priority) importSimulator("1", priority);

                const attackType = document.querySelector('select[name="attack_type"]');
                // const attackTypeSelection = attackType.querySelector(`option[value*="${type}"]`);
                const attackTypeSelection = attackType.querySelector(groupEvent.map(text => `option[value*="${text}" i]`).join(", ")).value;
                if (attackTypeSelection) importSimulator(attackTypeSelection, attackType);

                const inputDate = document.querySelector('[data-name="time_detect_siem"] input[data-item="date"]');
                const inputTime = document.querySelector('[data-name="time_detect_siem"] input[data-item="time"]');
                const mainTime = document.querySelector('[data-name="time_detect_siem"] input[type="hidden"]');
                const { date, time, iso } = parseSmartDate(data.Time) || {};
                if (date && time && iso) {
                    inputDate.value = date;
                    inputTime.value = time;
                    mainTime.value = iso;
                }

                break;
            }
        }
    }


    // Extended handlers
    function classify (ID){
        const rules = [
            {
                ids: ["1", "4688", "EXECVE", "PROCTITLE", "4104", "600", "400"],
                type: 1, //Command
                group: ["Suspicious Activity", "client_server", "Các sự cố liên quan đến máy Client và Server"]
            },
            {
                ids: ["11", "4663", "PATH_CREATE"],
                type: 2, //create file 
                group: ["Suspicious Activity", "client_server", "Các sự cố liên quan đến máy Client và Server"]
            },
            {
                ids: ["4697", "7045"],
                type: 3, //Install Service
                group: ["Suspicious Activity", "client_server", "Các sự cố liên quan đến máy Client và Server"]
            },
            {
                ids: ["22"],
                type: 4, //DNS Query 
                group: ["Network", "Suspicious Activity"]
            },
            {
                ids: ["4740"],
                type: 5, //Locked Account 
                group: ["Access"]
            },
            {
                ids: ["4625", "SSHD_LOGIN_FAILED", "77001", "LOGIN_FAILED"],
                type: 6, //Login Failed 
                group: ["Access"]
            },
            {
                ids: ["4720"],
                type: 7, //Create Account 
                group: ["Access"]
            },
            {
                ids: ["1149", "4624"],
                type: 8, //Login Success
                group: ["Access"]
            },
            {
                ids: ["GNRL_EV_VIRUS_FOUND 61", "GNRL_EV_OBJECT_CURED", "GNRL_EV_VIRUS_FOUND 60", "GNRL_EV_VIRUS_FOUND 62", "GNRL_EV_VIRUS_FOUND", "GNRL_EV_VIRUS_FOUND_AND_BLOCKED", "GNRL_EV_OBJECT_DELETED", "GNRL_EV_OBJECT_BLOCKED"],
                type: 9, //Malware/Ransomware
                group: ["Malware"]
            },
        ];

        const foundRule = rules.find(rule => rule.ids.includes(String(ID)));
        return foundRule ? foundRule : -1;
    }

    function parseSmartDate(rawTime) {
        try{
            if (!rawTime) throw 1;

            let dateObj = null;

            // 13:33:56, 7 thg 12, 2025
            if (rawTime.includes('thg')) {
                const regex = /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?.*,\s*(\d{1,2})\s*thg\s*(\d{1,2}),\s*(\d{4})/;
                const match = rawTime.match(regex);
                const [_, hours, minutes, seconds, day, month, year] = match;

                dateObj = new Date(year, month - 1, day, hours, minutes, seconds || 0);
            } 
            else {
                dateObj = new Date(rawTime);
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const yyyy = dateObj.getFullYear();
                const hh = String(dateObj.getHours()).padStart(2, '0');
                const min = String(dateObj.getMinutes()).padStart(2, '0');

                const date = `${mm}/${dd}/${yyyy}`;
                const time = `${hh}:${min}`;

                const iso = dateObj.toISOString();

                return { date, time, iso };
            }else throw 1;
            
        } catch (e) {
            console.error("Không thể parse ngày tháng:", e);
            return null;
        }
    }

    function importSimulator(value, element, CustomSelect = false) {
        element.dispatchEvent(new Event('focus', { bubbles: true })); // click vào
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true })); // gõ
        element.dispatchEvent(new Event('change', { bubbles: true })); // nhập xong
        element.dispatchEvent(new Event('blur', { bubbles: true })); // click ra 
    }


    // Others
    function storeCleanUp(){
        const keys = GM_listValues();

        keys.forEach(key => {
            GM_deleteValue(key);
        });
    }

    function startLock(){
        const submit_button = document.querySelector(".btn--success");
        if(!submit_button) return;

        const warningDiv = document.createElement('div');
        warningDiv.className = 'pmtrung-warning';
        warningDiv.textContent = ' Vui lòng kiểm tra lại nội dung trước và sau khi tạo!!!';
        submit_button.before(warningDiv);

        const durationMs = 10000;

        let startTime = null;

        submit_button.classList.add('pmtrung-custom-submit-button','is-locked');

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            
            const progress = Math.min(elapsed / durationMs, 1);

            const currentAngle = progress * 360;

            submit_button.style.setProperty('--angle', `${currentAngle}deg`);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                submit_button.classList.remove('is-locked');
                submit_button.style.removeProperty('--angle');
                startTime = null; 
            }
        }

        requestAnimationFrame(animate);

    }

})();
