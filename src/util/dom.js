// @flow strict

import Point from '@mapbox/point-geometry';

import window from './window';
import assert from 'assert';

const DOM = {};
export default DOM;

DOM.create = function (tagName: string, className: ?string, container?: HTMLElement) {
    const el = window.document.createElement(tagName);
    if (className !== undefined) el.className = className;
    if (container) container.appendChild(el);
    return el;
};

DOM.createNS = function (namespaceURI: string, tagName: string) {
    const el = window.document.createElementNS(namespaceURI, tagName);
    return el;
};

const docStyle = window.document && window.document.documentElement.style;
const selectProp = docStyle && docStyle.userSelect !== undefined ? 'userSelect' : 'WebkitUserSelect';
let userSelect;

DOM.disableDrag = function () {
    if (docStyle && selectProp) {
        userSelect = docStyle[selectProp];
        docStyle[selectProp] = 'none';
    }
};

DOM.enableDrag = function () {
    if (docStyle && selectProp) {
        docStyle[selectProp] = userSelect;
    }
};

DOM.setTransform = function(el: HTMLElement, value: string) {
    el.style.transform = value;
};

// Feature detection for {passive: false} support in add/removeEventListener.
let passiveSupported = false;

try {
    // https://github.com/facebook/flow/issues/285
    // $FlowFixMe
    const options = Object.defineProperty({}, "passive", {
        get() { // eslint-disable-line
            passiveSupported = true;
        }
    });
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
} catch (err) {
    passiveSupported = false;
}

DOM.addEventListener = function(target: *, type: *, callback: *, options: {passive?: boolean, capture?: boolean} = {}) {
    if ('passive' in options && passiveSupported) {
        target.addEventListener(type, callback, options);
    } else {
        target.addEventListener(type, callback, options.capture);
    }
};

DOM.removeEventListener = function(target: *, type: *, callback: *, options: {passive?: boolean, capture?: boolean} = {}) {
    if ('passive' in options && passiveSupported) {
        target.removeEventListener(type, callback, options);
    } else {
        target.removeEventListener(type, callback, options.capture);
    }
};

// Suppress the next click, but only if it's immediate.
const suppressClick: MouseEventListener = function (e) {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('click', suppressClick, true);
};

DOM.suppressClick = function() {
    window.addEventListener('click', suppressClick, true);
    window.setTimeout(() => {
        window.removeEventListener('click', suppressClick, true);
    }, 0);
};

DOM.mousePos = function (el: HTMLElement, e: MouseEvent | window.TouchEvent | Touch) {
    const rect = el.getBoundingClientRect();
    const t = window.TouchEvent && (e instanceof window.TouchEvent) ? e.touches[0] : e;
    return new Point(
        t.offsetX !== undefined ? t.offsetX : t.clientX - rect.left - el.clientLeft,
        t.offsetY !== undefined ? t.offsetY :  t.clientY - rect.top - el.clientTop
    );
};

DOM.touchPos = function (el: HTMLElement, touches: TouchList) {
    const rect = el.getBoundingClientRect(),
        points = [];
    for (let i = 0; i < touches.length; i++) {
        points.push(new Point(
            touches[i].clientX - rect.left - el.clientLeft,
            touches[i].clientY - rect.top - el.clientTop
        ));
    }
    return points;
};

DOM.mouseButton = function (e: MouseEvent) {
    assert(e.type === 'mousedown' || e.type === 'mouseup');
    if (typeof window.InstallTrigger !== 'undefined' && e.button === 2 && e.ctrlKey &&
        window.navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
        // Fix for https://github.com/mapbox/mapbox-gl-js/issues/3131:
        // Firefox (detected by InstallTrigger) on Mac determines e.button = 2 when
        // using Control + left click
        return 0;
    }
    return e.button;
};

DOM.remove = function(node: HTMLElement) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
};
