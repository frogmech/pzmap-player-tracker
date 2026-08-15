// ==UserScript==
// @name         PZMap Player Tracker
// @version      1.0
// @description  Adds live player tracking and follow mode to PZ Map
// @match        *://map.projectzomboid.com/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const nativeScriptCode = `
    (function() {
        let isFollowing = false;
        let lastPos = null;
        let osdViewer = null;
        let osdInterval = setInterval(() => {
            if (window.OpenSeadragon && window.OpenSeadragon.Viewer && window.OpenSeadragon.Viewer.prototype) {
                clearInterval(osdInterval);
                const origAddHandler = window.OpenSeadragon.Viewer.prototype.addHandler;
                window.OpenSeadragon.Viewer.prototype.addHandler = function(...args) {
                    osdViewer = this;
                    return origAddHandler.apply(this, args);
                };
            }
        }, 10);

        function getOsd() {
            if (osdViewer) return osdViewer;
            const candidates = [window.map, window.viewer, window.pzmap, window.osd];
            for (let c of candidates) {
                if (c && c.viewport && typeof c.viewport.panTo === 'function') return (osdViewer = c);
            }
            return null;
        }

        function ensureMarker() {
            let currentGroup = document.getElementById('pz-player-marker');
            const currentSvgIso = document.getElementById('svg_iso');

            if (!currentGroup && currentSvgIso) {
                currentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                currentGroup.id = 'pz-player-marker';
                currentGroup.style.transition = 'transform 0.1s linear';

                const playerPin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                playerPin.setAttribute('d', 'M 5,0 L -1.25,-2.165 A 2.5,2.5 0 1,0 -1.25,2.165 Z');
                playerPin.setAttribute('fill', 'rgba(51, 153, 255, 0.9)');
                playerPin.setAttribute('stroke', '#ffffff');
                playerPin.setAttribute('stroke-width', '0.5');
                playerPin.setAttribute('stroke-linejoin', 'round');
                playerPin.setAttribute('transform', 'scale(0.3)');

                currentGroup.appendChild(playerPin);
                currentSvgIso.appendChild(currentGroup);
            }
            return { currentGroup, currentSvgIso };
        }

        function panCamera() {
            if (!lastPos) return;
            const osd = getOsd();
            const currentSvgIso = document.getElementById('svg_iso');

            if (osd && currentSvgIso) {
                const rootSvg = currentSvgIso.ownerSVGElement || document.querySelector('svg');
                if (rootSvg) {
                    const pt = rootSvg.createSVGPoint();
                    pt.x = lastPos.x;
                    pt.y = lastPos.y;

                    const screenPt = pt.matrixTransform(currentSvgIso.getScreenCTM());
                    const osdPt = new window.OpenSeadragon.Point(screenPt.x, screenPt.y);
                    const viewportPt = osd.viewport.windowToViewportCoordinates(osdPt);

                    osd.viewport.panTo(viewportPt, false);
                }
            }
        }

        function triggerFollowOn() {
            if (!lastPos) return;
            const osd = getOsd();
            const currentSvgIso = document.getElementById('svg_iso');

            if (osd && currentSvgIso) {
                const rootSvg = currentSvgIso.ownerSVGElement || document.querySelector('svg');
                if (rootSvg) {
                    const pt = rootSvg.createSVGPoint();
                    pt.x = lastPos.x;
                    pt.y = lastPos.y;

                    const screenPt = pt.matrixTransform(currentSvgIso.getScreenCTM());
                    const osdPt = new window.OpenSeadragon.Point(screenPt.x, screenPt.y);
                    const viewportPt = osd.viewport.windowToViewportCoordinates(osdPt);

                    osd.viewport.zoomTo(100);
                    osd.viewport.panTo(viewportPt, false);
                }
            }
        }

        function initUI() {
            const svgIso = document.getElementById('svg_iso');
            const toolsGroup = document.getElementById('tools-group');

            if (!svgIso || !toolsGroup) {
                setTimeout(initUI, 500);
                return;
            }

            if (!document.getElementById('follow_player_btn')) {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.id = 'follow_player_btn';
                btn.type = 'button';
                btn.title = 'Follow player location';
                btn.innerText = 'Follow Player';
                btn.onclick = () => {
                    isFollowing = !isFollowing;
                    btn.style.color = isFollowing ? 'rgba(51, 153, 255, 0.9)' : '';
                    if (isFollowing) {
                        triggerFollowOn();
                    }
                };
                li.appendChild(btn);

                const parentListItem = toolsGroup.parentElement;
                const mainSidebarList = parentListItem ? parentListItem.parentElement : null;
                if (mainSidebarList && mainSidebarList.tagName.toLowerCase() === 'ul') {
                    mainSidebarList.insertBefore(li, mainSidebarList.firstChild);
                }
            }

            ensureMarker();
        }

        window.addEventListener('pz_tracker_data', (e) => {
            const p = e.detail;
            if (!p) return;
            lastPos = p;

            const dy = typeof p.dy === 'number' ? p.dy : 0;
            const dx = typeof p.dx === 'number' ? p.dx : 0;
            const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

            const { currentGroup, currentSvgIso } = ensureMarker();

            if (currentGroup) {
                currentGroup.setAttribute('transform', \`translate(\${p.x}, \${p.y}) rotate(\${angleDeg})\`);
                if (currentSvgIso && currentGroup.nextElementSibling) {
                    currentSvgIso.appendChild(currentGroup);
                }
            }

            if (isFollowing) panCamera();
        });

            initUI();
    })();
    `;

    const scriptElement = document.createElement('script');
    scriptElement.textContent = nativeScriptCode;
    document.documentElement.appendChild(scriptElement);
    scriptElement.remove();

    function pollLocalTracker() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "http://127.0.0.1:9526/",
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.player) {
                            window.dispatchEvent(new CustomEvent('pz_tracker_data', { detail: data.player }));
                        }
                    } catch (error) {}
                }
                setTimeout(pollLocalTracker, 100);
            },
            onerror: function() {
                setTimeout(pollLocalTracker, 2000);
            }
        });
    }

    pollLocalTracker();

})();
