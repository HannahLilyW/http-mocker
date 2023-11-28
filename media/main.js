// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { enabled: false };

    /** @type {Array<{ value: string }>} */
    let enabled = oldState.enabled;

    let mockerEnabled = false;

    let discoverPathsOpen = true;
    let mockEndpointsOpen = true;

    let requests = {};
    let endpoints = {};

    document.getElementById('discoverPathsHeader').addEventListener('click', (event) => {
        discoverPathsOpen = !discoverPathsOpen;
        if (discoverPathsOpen) {
            document.getElementById("discoverPathsSvg").classList.add('open');
            document.getElementById("discoverPathsBody").hidden = false;
        } else {
            document.getElementById("discoverPathsSvg").classList.remove('open');
            document.getElementById("discoverPathsBody").hidden = true;
        }
    });

    document.getElementById('mockEndpointsHeader').addEventListener('click', (event) => {
        mockEndpointsOpen = !mockEndpointsOpen;
        if (mockEndpointsOpen) {
            document.getElementById("mockEndpointsSvg").classList.add('open');
            document.getElementById("mockEndpointsBody").hidden = false;
        } else {
            document.getElementById("mockEndpointsSvg").classList.remove('open');
            document.getElementById("mockEndpointsBody").hidden = true;
        }
    });

    document.getElementById('enable-switch').addEventListener('change', (event) => {
        mockerEnabled = !!(event.currentTarget.checked);
        document.getElementById('enabled-span').innerText = mockerEnabled ? 'Mocker Enabled' : 'Mocker Disabled';
        console.log('mocker enabled:', mockerEnabled);
        if (mockerEnabled) {
            vscode.postMessage({
                command: 'enableMocker',
                forwardTo: document.getElementById('forwardInput').value
            });
        } else {
            vscode.postMessage({
                command: 'disableMocker'
            });
        }
    });

    document.getElementById('forwardInput').addEventListener('change', (event) => {
        forward = event.target.value;
        vscode.postMessage({
            command: 'changeForward',
            forwardTo: forward
        });
    });

    document.getElementById('clearLog').addEventListener('click', (event) => {
        document.getElementById('noRequests').hidden = false;
        document.getElementById('clearLog').hidden = true;
        document.getElementById('requestsLog').innerHTML = '';
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'request':
                {
                    // Add the request to the log
                    console.log(message);
                    document.getElementById('noRequests').hidden = true;
                    document.getElementById('clearLog').hidden = false;
                    const requestId = Date.now();
                    requests[requestId] = message;
                    requests[requestId].open = false;
                    requests[requestId].requestHeadersOpen = true;
                    requests[requestId].requestBodyOpen = true;
                    requests[requestId].responseHeadersOpen = true;
                    requests[requestId].responseBodyOpen = true;
                    requests[requestId].endpointOpen = false;
                    requests[requestId].endpointRequestHeadersOpen = true;
                    requests[requestId].endpointRequestBodyOpen = true;
                    requests[requestId].endpointResponseHeadersOpen = true;
                    requests[requestId].endpointResponseBodyOpen = true;
                    let reqHeadersJson = '';
                    let reqBodyJson = '';
                    let resHeadersJson = '';
                    let resBodyJson = '';
                    if (message.reqHeaders) {
                        reqHeadersJson = JSON.stringify(message.reqHeaders, null, 2);
                    }
                    if (message.reqBody) {
                        reqBodyJson = JSON.stringify(message.reqBody, null, 2);
                    }
                    if (message.resHeaders) {
                        resHeadersJson = JSON.stringify(message.resHeaders, null, 2);
                    }
                    if (message.resBody) {
                        resBodyJson = JSON.stringify(message.resBody, null, 2);
                    }
                    document.getElementById('requestsLog').insertAdjacentHTML('beforeend', `
                    <div id="requestHeader${requestId}" class="header clickable">
                        <span>
                            <svg id="requestSvg${requestId}" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                        </span>
                        <b>${message.reqMethod} ${message.reqPath}</b>
                    </div>
                    <div id="requestBody${requestId}" class="body" hidden>
                        <div id="requestRequestHeadersHeader${requestId}" class="header clickable">
                            <span>
                                <svg id="requestRequestHeadersSvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                            </span>
                            <b>Request Headers</b>
                        </div>
                        <div id="requestRequestHeadersBody${requestId}" class="body">
                            <pre>${reqHeadersJson || 'No Request Headers'}</pre>
                        </div>
                        <div id="requestRequestBodyHeader${requestId}" class="header clickable">
                            <span>
                                <svg id="requestRequestBodySvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                            </span>
                            <b>Request Body</b>
                        </div>
                        <div id="requestRequestBodyBody${requestId}" class="body">
                        <pre>${reqBodyJson || 'No Request Body'}</pre>
                        </div>
                        <div id="noMatch${requestId}">This request did not match any configured mock endpoint. The request was forwarded to ${message.forwardTo || 'nowhere'}.</div>

                        <div id="requestResponseHeadersHeader${requestId}" class="header clickable">
                            <span>
                                <svg id="requestResponseHeadersSvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                            </span>
                            <b>Response Headers</b>
                        </div>
                        <div id="requestResponseHeadersBody${requestId}" class="body">
                            <pre>${resHeadersJson || 'No Response Headers'}</pre>
                        </div>
                        <div id="requestResponseBodyHeader${requestId}" class="header clickable">
                            <span>
                                <svg id="requestResponseBodySvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                            </span>
                            <b>Response Body</b>
                        </div>
                        <div id="requestResponseBodyBody${requestId}" class="body">
                        <pre>${resBodyJson || 'No Response Body'}</pre>
                        </div>
                        <div>
                            <span id="addEndpointButton${requestId}" class="clickable add-endpoint-button">Add Endpoint</span>
                        </div>
                    </div>
                    `);
                    document.getElementById(`requestHeader${requestId}`).addEventListener('click', (event) => {
                        requests[requestId].open = !requests[requestId].open;
                        if (requests[requestId].open) {
                            document.getElementById(`requestSvg${requestId}`).classList.add('open');
                            document.getElementById(`requestBody${requestId}`).hidden = false;
                        } else {
                            document.getElementById(`requestSvg${requestId}`).classList.remove('open');
                            document.getElementById(`requestBody${requestId}`).hidden = true;
                        }
                    });
                    document.getElementById(`requestRequestHeadersHeader${requestId}`).addEventListener('click', (event) => {
                        requests[requestId].requestHeadersOpen = !requests[requestId].requestHeadersOpen;
                        if (requests[requestId].requestHeadersOpen) {
                            document.getElementById(`requestRequestHeadersSvg${requestId}`).classList.add('open');
                            document.getElementById(`requestRequestHeadersBody${requestId}`).hidden = false;
                        } else {
                            document.getElementById(`requestRequestHeadersSvg${requestId}`).classList.remove('open');
                            document.getElementById(`requestRequestHeadersBody${requestId}`).hidden = true;
                        }
                    });
                    document.getElementById(`requestRequestBodyHeader${requestId}`).addEventListener('click', (event) => {
                        requests[requestId].requestBodyOpen = !requests[requestId].requestBodyOpen;
                        if (requests[requestId].requestBodyOpen) {
                            document.getElementById(`requestRequestBodySvg${requestId}`).classList.add('open');
                            document.getElementById(`requestRequestBodyBody${requestId}`).hidden = false;
                        } else {
                            document.getElementById(`requestRequestBodySvg${requestId}`).classList.remove('open');
                            document.getElementById(`requestRequestBodyBody${requestId}`).hidden = true;
                        }
                    });
                    document.getElementById(`requestResponseHeadersHeader${requestId}`).addEventListener('click', (event) => {
                        requests[requestId].responseHeadersOpen = !requests[requestId].responseHeadersOpen;
                        if (requests[requestId].responseHeadersOpen) {
                            document.getElementById(`requestResponseHeadersSvg${requestId}`).classList.add('open');
                            document.getElementById(`requestResponseHeadersBody${requestId}`).hidden = false;
                        } else {
                            document.getElementById(`requestResponseHeadersSvg${requestId}`).classList.remove('open');
                            document.getElementById(`requestResponseHeadersBody${requestId}`).hidden = true;
                        }
                    });
                    document.getElementById(`requestResponseBodyHeader${requestId}`).addEventListener('click', (event) => {
                        requests[requestId].responseBodyOpen = !requests[requestId].responseBodyOpen;
                        if (requests[requestId].responseBodyOpen) {
                            document.getElementById(`requestResponseBodySvg${requestId}`).classList.add('open');
                            document.getElementById(`requestResponseBodyBody${requestId}`).hidden = false;
                        } else {
                            document.getElementById(`requestResponseBodySvg${requestId}`).classList.remove('open');
                            document.getElementById(`requestResponseBodyBody${requestId}`).hidden = true;
                        }
                    });
                    document.getElementById(`addEndpointButton${requestId}`).addEventListener('click', (event) => {
                        document.getElementById('mockEndpointsBody').insertAdjacentHTML('beforeend', `
                        <div id="endpointHeader${requestId}" class="header clickable">
                            <span>
                                <svg id="endpointSvg${requestId}" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                            </span>
                            <b id="endpointHeaderInfo${requestId}">${message.reqMethod} ${message.reqPath}</b>
                        </div>
                        <div id="endpointBody${requestId}" class="body" hidden>
                            <div class="endpoint-info">When we receive a <span id="requestMethodInput${requestId}" class="editable nowrap" contenteditable>${message.reqMethod}</span> request to http://localhost:8080<span id="requestPathInput${requestId}" class="editable nowrap" contenteditable>${message.reqPath}</span></div>
                            <div>containing the following request headers:</div>
                            <div id="endpointRequestHeadersHeader${requestId}" class="header clickable">
                                <span>
                                    <svg id="endpointRequestHeadersSvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                                </span>
                                <b>Request Headers</b>
                            </div>
                            <div id="endpointRequestHeadersBody${requestId}" class="body">
                                <pre class="editable" contenteditable>${reqHeadersJson || ''}</pre>
                            </div>
                            <div>and containing the following request body:</div>
                            <div id="endpointRequestBodyHeader${requestId}" class="header clickable">
                                <span>
                                    <svg id="endpointRequestBodySvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                                </span>
                                <b>Request Body</b>
                            </div>
                            <div id="endpointRequestBodyBody${requestId}" class="body">
                                <pre class="editable" contenteditable>${reqBodyJson || 'No Request Body'}</pre>
                            </div>
                            <div>Then we should return the following response headers and response body:</div>
                            <div id="endpointResponseHeadersHeader${requestId}" class="header clickable">
                                <span>
                                    <svg id="endpointResponseHeadersSvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                                </span>
                                <b>Response Headers</b>
                            </div>
                            <div id="endpointResponseHeadersBody${requestId}" class="body">
                                <pre class="editable" contenteditable>${resHeadersJson || 'No Response Headers'}</pre>
                            </div>
                            <div id="endpointResponseBodyHeader${requestId}" class="header clickable">
                                <span>
                                    <svg id="endpointResponseBodySvg${requestId}" class="open" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
                                </span>
                                <b>Response Body</b>
                            </div>
                            <div id="endpointResponseBodyBody${requestId}" class="body">
                                <pre class="editable" contenteditable>${resBodyJson || 'No Response Body'}</pre>
                            </div>
                            <div>
                                <span id="deleteEndpointButton${requestId}" class="clickable delete-endpoint-button">Delete Endpoint</span>
                            </div>
                        </div>
                        `);
                        endpoints[requestId] = requests[requestId];
                        document.getElementById(`requestMethodInput${requestId}`).addEventListener('input', (event) => {
                            console.log('innerText: ', event.target.innerText);
                            endpoints[requestId].reqMethod = event.target.innerText;
                            document.getElementById(`endpointHeaderInfo${requestId}`).innerText = `${endpoints[requestId].reqMethod} ${endpoints[requestId].reqPath}`;
                        });
                        document.getElementById(`requestPathInput${requestId}`).addEventListener('input', (event) => {
                            console.log('innerText: ', event.target.innerText);
                            endpoints[requestId].reqPath = event.target.innerText;
                            document.getElementById(`endpointHeaderInfo${requestId}`).innerText = `${endpoints[requestId].reqMethod} ${endpoints[requestId].reqPath}`;
                        })
                        document.getElementById(`endpointHeader${requestId}`).addEventListener('click', (event) => {
                            endpoints[requestId].endpointOpen = !endpoints[requestId].endpointOpen;
                            if (endpoints[requestId].endpointOpen) {
                                document.getElementById(`endpointSvg${requestId}`).classList.add('open');
                                document.getElementById(`endpointBody${requestId}`).hidden = false;
                            } else {
                                document.getElementById(`endpointSvg${requestId}`).classList.remove('open');
                                document.getElementById(`endpointBody${requestId}`).hidden = true;
                            }
                        });
                        document.getElementById(`endpointRequestHeadersHeader${requestId}`).addEventListener('click', (event) => {
                            endpoints[requestId].endpointRequestHeadersOpen = !endpoints[requestId].endpointRequestHeadersOpen;
                            if (endpoints[requestId].endpointRequestHeadersOpen) {
                                document.getElementById(`endpointRequestHeadersSvg${requestId}`).classList.add('open');
                                document.getElementById(`endpointRequestHeadersBody${requestId}`).hidden = false;
                            } else {
                                document.getElementById(`endpointRequestHeadersSvg${requestId}`).classList.remove('open');
                                document.getElementById(`endpointRequestHeadersBody${requestId}`).hidden = true;
                            }
                        });
                        document.getElementById(`endpointRequestBodyHeader${requestId}`).addEventListener('click', (event) => {
                            endpoints[requestId].endpointRequestBodyOpen = !endpoints[requestId].endpointRequestBodyOpen;
                            if (endpoints[requestId].endpointRequestBodyOpen) {
                                document.getElementById(`endpointRequestBodySvg${requestId}`).classList.add('open');
                                document.getElementById(`endpointRequestBodyBody${requestId}`).hidden = false;
                            } else {
                                document.getElementById(`endpointRequestBodySvg${requestId}`).classList.remove('open');
                                document.getElementById(`endpointRequestBodyBody${requestId}`).hidden = true;
                            }
                        });
                        document.getElementById(`endpointResponseHeadersHeader${requestId}`).addEventListener('click', (event) => {
                            endpoints[requestId].endpointResponseHeadersOpen = !endpoints[requestId].endpointResponseHeadersOpen;
                            if (endpoints[requestId].endpointResponseHeadersOpen) {
                                document.getElementById(`endpointResponseHeadersSvg${requestId}`).classList.add('open');
                                document.getElementById(`endpointResponseHeadersBody${requestId}`).hidden = false;
                            } else {
                                document.getElementById(`endpointResponseHeadersSvg${requestId}`).classList.remove('open');
                                document.getElementById(`endpointResponseHeadersBody${requestId}`).hidden = true;
                            }
                        });
                        document.getElementById(`endpointResponseBodyHeader${requestId}`).addEventListener('click', (event) => {
                            endpoints[requestId].endpointResponseBodyOpen = !endpoints[requestId].endpointResponseBodyOpen;
                            if (endpoints[requestId].endpointResponseBodyOpen) {
                                document.getElementById(`endpointResponseBodySvg${requestId}`).classList.add('open');
                                document.getElementById(`endpointResponseBodyBody${requestId}`).hidden = false;
                            } else {
                                document.getElementById(`endpointResponseBodySvg${requestId}`).classList.remove('open');
                                document.getElementById(`endpointResponseBodyBody${requestId}`).hidden = true;
                            }
                        });
                        document.getElementById(`deleteEndpointButton${requestId}`).addEventListener('click', (event) => {
                            document.getElementById(`endpointHeader${requestId}`).remove();
                            document.getElementById(`endpointBody${requestId}`).remove();
                        });
                    });

                    break;
                }
            case 'addColor':
                {
                    addColor();
                    break;
                }
            case 'clearColors':
                {
                    colors = [];
                    updateColorList(colors);
                    break;
                }

        }
    });

    /**
     * @param {Array<{ value: string }>} colors
     */
    function updateColorList(colors) {
        const ul = document.querySelector('.color-list');
        ul.textContent = '';
        for (const color of colors) {
            const li = document.createElement('li');
            li.className = 'color-entry';

            const colorPreview = document.createElement('div');
            colorPreview.className = 'color-preview';
            colorPreview.style.backgroundColor = `#${color.value}`;
            colorPreview.addEventListener('click', () => {
                onColorClicked(color.value);
            });
            li.appendChild(colorPreview);

            const input = document.createElement('input');
            input.className = 'color-input';
            input.type = 'text';
            input.value = color.value;
            input.addEventListener('change', (e) => {
                const value = e.target.value;
                if (!value) {
                    // Treat empty value as delete
                    colors.splice(colors.indexOf(color), 1);
                } else {
                    color.value = value;
                }
                updateColorList(colors);
            });
            li.appendChild(input);

            ul.appendChild(li);
        }

        // Update the saved state
        vscode.setState({ colors: colors });
    }

    /** 
     * @param {string} color 
     */
    function onColorClicked(color) {
        vscode.postMessage({ type: 'colorSelected', value: color });
    }

    /**
     * @returns string
     */
    function getNewCalicoColor() {
        const colors = ['020202', 'f1eeee', 'a85b20', 'daab70', 'efcb99'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function addColor() {
        colors.push({ value: getNewCalicoColor() });
        updateColorList(colors);
    }
}());