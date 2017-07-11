"use strict";

class Grid {

    constructor(selector) {

        this.node = document.querySelector(selector);
        if (!this.node) {
            throw new Error("No element found for selector: " + selector)
        }
        this.data = {};

        this._parser = new DOMParser();
    }

    _extractHeader() {
        var i, k, j;
        this.data.keys = [];

        for (i = 0; i < this.data.initial.length; i += 1) {
            k = Object.keys(this.data.initial[i]);
            for (j = 0; j < k.length; j += 1) {
                if (this.data.keys.indexOf(k[j]) === -1) {
                    this.data.keys.push(k[j]);
                }
            }
        }
    }

    _clearDOM() {
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
    }

    _escapeHTML(data) {  // data can be of any type

        if (!data) {
            return "";
        }
        return ("" + data) // convert all types to string
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    _render() {

        this._clearDOM();

        this.table = document.createElement("table");
        this.table.className = "main-table";

        var header = document.createElement("tr");
        // header.classList.add("head");
        header.className = "table-head";
        this.table.appendChild(header);
        var thiz = this;

        console.log("keys:" + this.data.keys.length);
        this.data.keys.forEach(function (key) {

            key = thiz._escapeHTML(key);
            var str = '{key}<div class="header-search"><input type="text" placeholder="Search:" data-key="{key}"/></div>'
                .replace(new RegExp("{key}", 'g'), key);
            var th = document.createElement("th");
            // th.classList.add("key");
            th.className = "key";
            th.innerHTML = str;
            var takeInput = th.querySelector("input");
            // takeInput.classList.add("input-class");
            takeInput.className = "input-search";
            takeInput.addEventListener("keyup", function (searchEvent) {
                thiz._search(searchEvent);
            });
            th.addEventListener("click", function (e) {
                if (e.target.tagName.toLowerCase() == "input") {
                    e.preventDefault();
                    return
                }
                thiz._headerClicked(e);


            });

            header.appendChild(th);
        });

        this._renderData();
        this.node.appendChild(this.table);
    }

    _renderData() {

        var thiz = this;
        // remove existing data rows first
        var dataRows = this.node.querySelectorAll("table.main-table tr:not(.table-head)");
        dataRows.forEach(function (e) {
            e.parentNode.removeChild(e);
        });
        for (var i = 0; i < this.data.torender.length; i++) {

            var row = this.data.torender[i];
            var tr = document.createElement("tr");
            tr.className = "table-row";
            this.data.keys.forEach(function (key) {

                var data = thiz._escapeHTML(row[key]);
                var td = document.createElement("td");
                td.className = "table-cell";
                if (key == "Gender") {

                    var imageSrc = '<img class="gender" src="images/male.png"/>';
                    if (data == "Female") {
                        imageSrc = '<img class="gender" src="images/female.png"/>';
                    }
                    td.innerHTML = imageSrc;

                } else {
                    td.innerHTML = data;
                }


                tr.appendChild(td);
            });
            this.table.appendChild(tr);
        }
    }

    _elementFromString(s) {

        var doc = this._parser.parseFromString(s, "text/xml");
        return doc.firstChild;
    }

    // underscore convention is used to mark private methods
    _onDataLoaded(data) {
        this.data.initial = data;
        this.data.sorted = this.data.initial;
        this.data.torender = this.data.initial;
        console.log("data loaded:" + this.data.initial.length);

        this._extractHeader();
        this._render();
    }

    _loadingProgress(e) {
        console.log("progress:" + e.loaded * 100 / e.total + "%");
    }

    _loadingError(e) {
        console.log("error:" + e);
    }

    _loadingAborted(e) {
        console.log("abort:" + e);
    }

    load(url) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", url);

        var thiz = this;
        httpRequest.addEventListener("readystatechange", function (e) {
            if (e.currentTarget.readyState === 4) {
                thiz._onDataLoaded(JSON.parse(e.currentTarget.response));
            }
        });

        httpRequest.addEventListener("progress", function (e) {
            thiz._loadingProgress(e);
        });
        //httpRequest.addEventListener("load", transferComplete);
        httpRequest.addEventListener("error", function (e) {
            thiz._loadingError(e);
        });
        httpRequest.addEventListener("abort", function (e) {
            thiz._loadingAborted(e);
        });

        httpRequest.send();
    }

//    new code


    _stringAscending(property, x, y) {
        return x[property].localeCompare(y[property]);

    }


    _numberAscending(property, x, y) {
        return x[property] - y[property];

    }


    _stringDesending(property, x, y) {
        return y[property].localeCompare(x[property]);

    }

    _numberDesending(property, x, y) {
        return y[property] - x[property];

    }

    _headerClicked(e) {
        var headerElement = e.currentTarget;

        var direction;
        if (headerElement.classList.contains("asc") || headerElement.classList.contains("desc")) {
            //already sorted by some order
            headerElement.classList.toggle("asc");
            if (headerElement.classList.toggle("desc")) {
                direction = "desc";
            } else {
                direction = "asc";
            }
        } else {
            direction = "asc";
            headerElement.classList.add("asc");
        }

        var allHeaerElements = this.node.querySelectorAll("table tr.table-head th");
        for (var i = 0; i < allHeaerElements.length; i++) {
            var e = allHeaerElements[i];
            if (e === headerElement) {
                continue;
            }
            e.classList.remove("asc", "desc");
        }

        var key = headerElement.querySelector("input").getAttribute("data-key");
        this.sort(key, direction);
    }


    sort(data, direction) {

        this.data.sorted = this.data.initial.slice();
        var dataType = typeof this.data.sorted[0][data];
        if (direction === "asc") {
            if (dataType === "string") {

                this.data.sorted.sort(this._stringAscending.bind(null, data));
            }

            else if (dataType === "number") {
                this.data.sorted.sort(this._numberAscending.bind(null, data));
            }
        }
        else {

            if (dataType === "string") {
                this.data.sorted.sort(this._stringDesending.bind(null, data));
            }

            if (dataType === "number") {
                this.data.sorted.sort(this._numberDesending.bind(null, data));
            }
        }
        this.data.torender = this.data.sorted;

        this._renderData();

    }

// new search method
    _search(searchEvent) {
        var inputElement = searchEvent.currentTarget;


        var key = inputElement.getAttribute("data-key");
        var term = inputElement.value;
        this.data.torender = this.data.sorted.filter(function (row) {
            var regex = new RegExp(term, "gim");

            return !!row[key].toString().match(regex) === true;
        });


        this._renderData();


    }


}

var grid1 = new Grid("div#first");
// grid1.load("http://cn.sbtech.com/sb-test/content.json");
grid1.load("http://cn.sbtech.com/sb-test/MOCK_DATA_2.json");

